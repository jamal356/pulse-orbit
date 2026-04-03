import { useEffect, useState } from 'react'
import * as sessionLib from '../lib/session'
import * as realtimeLib from '../lib/realtime'
import type { Session, Round } from '../lib/session'

export type SessionPhase = 'lobby' | 'countdown' | 'live' | 'transition' | 'rating' | 'results'

export interface Pair {
  userId: string
  displayName: string
  photoUrl: string | null
}

export interface Sparks {
  sent: boolean
  received: boolean
  mutual: boolean
}

export function useSession(sessionId: string | null, userId: string | null) {
  const [session, setSession] = useState<Session | null>(null)
  const [currentRound] = useState<Round | null>(null)
  const [pairs] = useState<Pair[]>([])
  const [myPartner] = useState<Pair | null>(null)
  const [phase, setPhase] = useState<SessionPhase>('lobby')
  const [timer, setTimer] = useState(0)
  const [sparks, setSparks] = useState<Sparks>({ sent: false, received: false, mutual: false })

  useEffect(() => {
    if (!sessionId || !userId) return

    const init = async () => {
      try {
        const sess = await sessionLib.fetchSession(sessionId)
        setSession(sess as Session)

        await sessionLib.fetchRoundsForSession(sessionId)

        await realtimeLib.joinSession(sessionId)

        realtimeLib.onSessionEvent('round_start', (evt: unknown) => {
          const event = evt as { round_number: number; pairs: unknown } | null
          if (event && session && event.round_number === session.current_round + 1) {
            setPhase('live')
            setTimer(300)
          }
        })

        realtimeLib.onSessionEvent('round_tick', (evt: unknown) => {
          const event = evt as { secondsRemaining: number } | null
          if (event?.secondsRemaining !== undefined) {
            setTimer(event.secondsRemaining)
          }
        })

        realtimeLib.onSessionEvent('spark_sent', (evt: unknown) => {
          const event = evt as { senderId: string } | null
          if (event?.senderId !== userId) {
            setSparks((prev) => ({
              ...prev,
              received: true,
              mutual: prev.sent && true,
            }))
          }
        })

        realtimeLib.onSessionEvent('extend_confirmed', () => {
          setTimer((prev) => prev + 120)
        })

        realtimeLib.onSessionEvent('rating_phase', () => {
          setPhase('rating')
        })

        realtimeLib.onSessionEvent('results_ready', () => {
          setPhase('results')
        })
      } catch (err) {
        console.error('Session init error:', err)
      }
    }

    init()

    return () => {
      realtimeLib.leaveSession()
    }
  }, [sessionId, userId])

  const sendSpark = async () => {
    if (!sessionId || !userId || !myPartner) return
    try {
      setSparks((prev) => ({ ...prev, sent: true }))
      await realtimeLib.broadcastEvent('spark_sent', { senderId: userId, roundId: currentRound?.id })
    } catch (err) {
      console.error('Send spark error:', err)
    }
  }

  const requestExtend = async () => {
    if (!sessionId || !userId) return
    try {
      await realtimeLib.broadcastEvent('extend_request', { userId, roundId: currentRound?.id })
    } catch (err) {
      console.error('Extend request error:', err)
    }
  }

  const submitRating = async (ratedId: string, rating: 'like' | 'pass') => {
    if (!sessionId || !userId || !currentRound) return
    try {
      await sessionLib.submitRating(currentRound.id, userId, ratedId, sessionId, rating)
    } catch (err) {
      console.error('Submit rating error:', err)
    }
  }

  return {
    session,
    currentRound,
    pairs,
    myPartner,
    phase,
    timer,
    sparks,
    sendSpark,
    requestExtend,
    submitRating,
  }
}
