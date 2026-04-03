import type { VercelRequest, VercelResponse } from '@vercel/node'

interface ParticipantPair {
  user_a: string
  user_b: string
}

interface RoundData {
  round_number: number
  pairs: ParticipantPair[]
  bye?: string
}

interface ResponseBody {
  session_id?: string
  rounds?: RoundData[]
  error?: string
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function supabaseRequest(
  method: string,
  table: string,
  data?: Record<string, unknown>,
  params?: string
) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  if (params) url.search = params

  const options: RequestInit = {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  const res = await fetch(url.toString(), options)
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Supabase error: ${res.status} ${error}`)
  }

  return res.json()
}

function generateRoundRobin(participants: string[]): RoundData[] {
  const n = participants.length
  if (n < 2) return []

  const isOdd = n % 2 === 1
  const nRounds = n - 1
  const people = [...participants]

  if (isOdd) {
    people.push('__bye__')
  }

  const m = people.length / 2
  const rounds: RoundData[] = []

  for (let r = 0; r < nRounds; r++) {
    const pairs: ParticipantPair[] = []

    for (let i = 0; i < m; i++) {
      const p1 = people[i]
      const p2 = people[people.length - 1 - i]

      if (p1 === '__bye__' || p2 === '__bye__') {
        continue
      }

      pairs.push({ user_a: p1, user_b: p2 })
    }

    const round: RoundData = { round_number: r + 1, pairs }

    if (isOdd) {
      const byeIdx = people.findIndex((p) => p === '__bye__')
      if (byeIdx !== -1) {
        const byeUser = byeIdx === 0 ? people[people.length - 1] : people[0]
        if (byeUser !== '__bye__') {
          round.bye = byeUser
        }
      }
    }

    rounds.push(round)

    const last = people.pop()
    if (last !== undefined) {
      people.splice(1, 0, last)
    }
  }

  return rounds
}

async function validateParticipants(ids: string[]): Promise<boolean> {
  if (ids.length < 4 || ids.length > 6) return false

  try {
    const users = await supabaseRequest('GET', 'users', undefined, `id=in.(${ids.map(id => `"${id}"`).join(',')})`)

    const activeUsers = users.filter((u: Record<string, unknown>) => !u.is_banned).length
    if (activeUsers !== ids.length) return false

    // Check for blocks
    const blocks = await supabaseRequest(
      'GET',
      'blocks',
      undefined,
      `or=(blocker_id=in.(${ids.map(id => `"${id}"`).join(',')}),blocked_id=in.(${ids.map(id => `"${id}"`).join(',')}))`
    )

    for (const block of blocks) {
      if (ids.includes(block.blocker_id) && ids.includes(block.blocked_id)) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ResponseBody>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { participant_ids } = req.body || {}

    if (!Array.isArray(participant_ids)) {
      return res.status(400).json({ error: 'participant_ids must be an array' })
    }

    const valid = await validateParticipants(participant_ids)
    if (!valid) {
      return res.status(400).json({ error: 'Invalid participants: count, bans, or blocks detected' })
    }

    const session = await supabaseRequest('POST', 'sessions', {
      type: 'on_demand',
      status: 'live',
      max_participants: participant_ids.length,
      total_rounds: participant_ids.length - 1,
    })

    const sessionId = session[0]?.id
    if (!sessionId) {
      return res.status(500).json({ error: 'Failed to create session' })
    }

    await Promise.all(
      participant_ids.map(userId =>
        supabaseRequest('POST', 'session_participants', {
          session_id: sessionId,
          user_id: userId,
          status: 'active',
        })
      )
    )

    const rounds = generateRoundRobin(participant_ids)

    await Promise.all(
      rounds.flatMap(round =>
        round.pairs.map(pair =>
          supabaseRequest('POST', 'rounds', {
            session_id: sessionId,
            round_number: round.round_number,
            user_a: pair.user_a,
            user_b: pair.user_b,
          })
        )
      )
    )

    return res.status(200).json({
      session_id: sessionId,
      rounds,
    })
  } catch (err) {
    console.error('Session creation error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
