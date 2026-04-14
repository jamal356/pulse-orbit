import type { VercelRequest, VercelResponse } from '@vercel/node'

// Server-authoritative timer.
//
// Flow:
// - Client calls POST /api/session-tick with { session_id, round_id, action? }.
// - action='start'  -> stamps rounds.started_at = now() (idempotent; no-op if already set).
// - action='extend' -> sets rounds.extended = true (once per round).
// - action='end'    -> stamps rounds.ended_at   = now() (idempotent).
// - (default)       -> just reads the round and returns seconds remaining.
//
// Server computes seconds_remaining from started_at + duration, where duration is
// BASE_DURATION (300s) + optional EXTEND_DURATION (120s) if extended. Once the
// round is past its deadline the server stamps ended_at automatically and the
// response signals ended:true — clients use this to transition without being
// able to fudge the timer locally.

interface RoundRow {
  id: string
  session_id: string
  round_number: number
  started_at: string | null
  ended_at: string | null
  extended: boolean
}

interface ResponseBody {
  round_id?: string
  round_number?: number
  started_at?: string | null
  ended_at?: string | null
  seconds_remaining?: number
  extended?: boolean
  ended?: boolean
  server_time?: string
  error?: string
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const BASE_DURATION_SEC = 300 // 5 minutes
const EXTEND_DURATION_SEC = 120 // +2 minutes if both agree

async function supabaseRequest<T = unknown>(
  method: string,
  table: string,
  data?: Record<string, unknown>,
  params?: string,
): Promise<T> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  if (params) url.search = params

  const options: RequestInit = {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  }
  if (data) options.body = JSON.stringify(data)

  const res = await fetch(url.toString(), options)
  if (!res.ok) {
    throw new Error(`Supabase error: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

/**
 * Fire-and-forget broadcast on the session channel via Supabase Realtime's
 * REST broadcast endpoint. Used so all clients in a session transition in
 * lockstep when the server declares a round over, instead of each client
 * waiting up to `pollMs` for its next session-tick poll to catch up.
 *
 * Errors are swallowed — a failed broadcast must not fail the parent
 * request; the poll-based fallback still works.
 */
async function broadcastSessionEvent(
  sessionId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const url = `${SUPABASE_URL}/realtime/v1/api/broadcast`
    await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `pulse:session:${sessionId}`,
            event,
            payload,
          },
        ],
      }),
    })
  } catch (err) {
    console.warn('broadcastSessionEvent failed (non-fatal):', err)
  }
}

function computeSecondsRemaining(round: RoundRow, now: number): number {
  if (!round.started_at) return BASE_DURATION_SEC + (round.extended ? EXTEND_DURATION_SEC : 0)
  if (round.ended_at) return 0
  const startedMs = new Date(round.started_at).getTime()
  const durationMs = (BASE_DURATION_SEC + (round.extended ? EXTEND_DURATION_SEC : 0)) * 1000
  const remainingMs = startedMs + durationMs - now
  return Math.max(0, Math.ceil(remainingMs / 1000))
}

export default async function handler(req: VercelRequest, res: VercelResponse<ResponseBody>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured' })
  }

  try {
    const { session_id, round_id, action } = (req.body || {}) as {
      session_id?: string
      round_id?: string
      action?: 'start' | 'extend' | 'end'
    }

    if (!session_id || !round_id) {
      return res.status(400).json({ error: 'session_id and round_id are required' })
    }

    const rows = await supabaseRequest<RoundRow[]>(
      'GET',
      'rounds',
      undefined,
      `id=eq.${round_id}&session_id=eq.${session_id}&select=id,session_id,round_number,started_at,ended_at,extended`,
    )
    let round = rows[0]
    if (!round) {
      return res.status(404).json({ error: 'Round not found' })
    }

    const nowIso = new Date().toISOString()

    if (action === 'start' && !round.started_at) {
      const updated = await supabaseRequest<RoundRow[]>(
        'PATCH',
        'rounds',
        { started_at: nowIso },
        `id=eq.${round_id}`,
      )
      round = updated[0] ?? { ...round, started_at: nowIso }
    }

    if (action === 'extend' && !round.extended && !round.ended_at) {
      const updated = await supabaseRequest<RoundRow[]>(
        'PATCH',
        'rounds',
        { extended: true },
        `id=eq.${round_id}`,
      )
      round = updated[0] ?? { ...round, extended: true }
    }

    const now = Date.now()
    let secondsRemaining = computeSecondsRemaining(round, now)
    let endedJustNow = false

    // Auto-end if past deadline
    if (!round.ended_at && round.started_at && secondsRemaining <= 0) {
      const updated = await supabaseRequest<RoundRow[]>(
        'PATCH',
        'rounds',
        { ended_at: nowIso },
        `id=eq.${round_id}`,
      )
      round = updated[0] ?? { ...round, ended_at: nowIso }
      secondsRemaining = 0
      endedJustNow = true
    }

    if (action === 'end' && !round.ended_at) {
      const updated = await supabaseRequest<RoundRow[]>(
        'PATCH',
        'rounds',
        { ended_at: nowIso },
        `id=eq.${round_id}`,
      )
      round = updated[0] ?? { ...round, ended_at: nowIso }
      secondsRemaining = 0
      endedJustNow = true
    }

    // When the server is the one that just stamped ended_at, broadcast
    // round_end so all clients in this session transition in lockstep
    // instead of waiting for their next individual poll. Best-effort.
    if (endedJustNow) {
      await broadcastSessionEvent(session_id, 'round_end', {
        round_id: round.id,
        round_number: round.round_number,
        ended_at: round.ended_at,
        reason: action === 'end' ? 'explicit' : 'auto',
      })
    }

    return res.status(200).json({
      round_id: round.id,
      round_number: round.round_number,
      started_at: round.started_at,
      ended_at: round.ended_at,
      seconds_remaining: secondsRemaining,
      extended: round.extended,
      ended: !!round.ended_at,
      server_time: nowIso,
    })
  } catch (err) {
    console.error('session-tick error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
