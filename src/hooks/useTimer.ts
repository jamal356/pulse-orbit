import { useEffect, useRef, useState, useCallback } from 'react'
import * as realtimeLib from '../lib/realtime'
import { tickRound, type SessionTick } from '../lib/session'

interface ServerSyncOptions {
  sessionId: string
  roundId: string
  /** Poll interval in ms. Defaults to 5s. */
  pollMs?: number
  /** Called once when the server reports the round has ended. */
  onEnded?: () => void
}

/**
 * Timer hook.
 *
 * Two modes:
 *   - Client-only (legacy): call `start(duration)` and it decrements locally.
 *     Still listens for broadcast `round_tick` events.
 *   - Server-authoritative: pass `serverSync` with { sessionId, roundId } and
 *     the hook will POST /api/session-tick?action=start, then poll every
 *     `pollMs` for drift correction. The server owns the deadline.
 */
export function useTimer(serverSync?: ServerSyncOptions) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [extended, setExtended] = useState(false)
  const endedRef = useRef(false)
  const onEndedRef = useRef(serverSync?.onEnded)
  onEndedRef.current = serverSync?.onEnded

  // Local 1-second decrement between server syncs
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 0) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  // Legacy broadcast sync
  useEffect(() => {
    try {
      const unsub = realtimeLib.onSessionEvent('round_tick', (evt: unknown) => {
        const event = evt as { secondsRemaining: number } | null
        if (event?.secondsRemaining !== undefined) {
          setSeconds(event.secondsRemaining)
        }
      })
      return () => {
        unsub()
      }
    } catch (err) {
      console.error('Timer sync error:', err)
      return undefined
    }
  }, [])

  // Server-authoritative sync.
  // Deps intentionally use primitives only — the `serverSync` object is
  // often reconstructed per render. `onEnded` is read through a ref.
  const syncSessionId = serverSync?.sessionId
  const syncRoundId = serverSync?.roundId
  const syncPollMs = serverSync?.pollMs ?? 5000
  useEffect(() => {
    if (!syncSessionId || !syncRoundId) return

    let cancelled = false
    endedRef.current = false

    const applyTick = (tick: SessionTick) => {
      if (cancelled) return
      setSeconds(tick.seconds_remaining)
      setExtended(tick.extended)
      if (tick.ended && !endedRef.current) {
        endedRef.current = true
        setIsRunning(false)
        onEndedRef.current?.()
      } else if (!tick.ended) {
        setIsRunning(true)
      }
    }

    // Kick off round + first sync
    tickRound(syncSessionId, syncRoundId, 'start').then(applyTick).catch((err) => {
      console.error('session-tick start failed:', err)
    })

    const poll = setInterval(() => {
      tickRound(syncSessionId, syncRoundId).then(applyTick).catch((err) => {
        console.error('session-tick poll failed:', err)
      })
    }, syncPollMs)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [syncSessionId, syncRoundId, syncPollMs])

  const start = useCallback((duration: number) => {
    setSeconds(duration)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    setSeconds(0)
    setIsRunning(false)
    setExtended(false)
    endedRef.current = false
  }, [])

  const extend = useCallback(async () => {
    if (!serverSync) {
      setExtended(true)
      return
    }
    try {
      const tick = await tickRound(serverSync.sessionId, serverSync.roundId, 'extend')
      setSeconds(tick.seconds_remaining)
      setExtended(tick.extended)
    } catch (err) {
      console.error('session-tick extend failed:', err)
    }
  }, [serverSync])

  const end = useCallback(async () => {
    if (!serverSync) {
      setSeconds(0)
      setIsRunning(false)
      return
    }
    try {
      await tickRound(serverSync.sessionId, serverSync.roundId, 'end')
    } catch (err) {
      console.error('session-tick end failed:', err)
    }
    setSeconds(0)
    setIsRunning(false)
  }, [serverSync])

  return {
    seconds,
    isRunning,
    extended,
    start,
    pause,
    reset,
    extend,
    end,
  }
}
