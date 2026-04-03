import { useEffect, useState } from 'react'
import * as realtimeLib from '../lib/realtime'

export interface LobbyParticipant {
  userId: string
  displayName: string
  photoUrl: string | null
  joinedAt: string
}

export function useLobby(userId: string | null) {
  const [participants, setParticipants] = useState<LobbyParticipant[]>([])
  const [count, setCount] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [countdown] = useState<number | null>(null)

  useEffect(() => {
    if (!userId) return

    const init = async () => {
      try {
        await realtimeLib.joinLobby(userId)

        const sub = realtimeLib.onLobbyChange((state: unknown) => {
          const presenceState = state as Record<string, unknown[]> | undefined
          if (!presenceState) return

          const users: LobbyParticipant[] = []
          Object.values(presenceState).forEach((presences) => {
            presences.forEach((p: unknown) => {
              const presence = p as { userId?: string; displayName?: string; photoUrl?: string | null; joinedAt?: string } | null
              if (presence?.userId) {
                users.push({
                  userId: presence.userId,
                  displayName: presence.displayName || 'Unknown',
                  photoUrl: presence.photoUrl || null,
                  joinedAt: presence.joinedAt || new Date().toISOString(),
                })
              }
            })
          })

          setParticipants(users)
          setCount(users.length)
        })

        return () => {
          sub()
        }
      } catch (err) {
        console.error('Lobby init error:', err)
      }
    }

    const cleanup = init()
    return () => {
      cleanup.then((fn) => fn?.())
      realtimeLib.leaveLobby()
    }
  }, [userId])

  const joinLobby = async () => {
    if (!userId) throw new Error('User not logged in')
    try {
      await realtimeLib.joinLobby(userId)
    } catch (err) {
      throw err
    }
  }

  const leaveLobby = async () => {
    try {
      await realtimeLib.leaveLobby()
      setParticipants([])
      setCount(0)
    } catch (err) {
      throw err
    }
  }

  const setReady = (ready: boolean) => {
    setIsReady(ready)
  }

  return {
    participants,
    count,
    isReady,
    countdown,
    joinLobby,
    leaveLobby,
    setReady,
  }
}
