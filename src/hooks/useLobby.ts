import { useEffect, useRef, useState } from 'react'
import * as realtimeLib from '../lib/realtime'
import { supabase } from '../lib/supabase'

export interface LobbyParticipant {
    userId: string
    displayName: string
    photoUrl: string | null
    joinedAt: string
}

interface ProfileRow {
    id: string
    display_name: string | null
    photo_url: string | null
    age: number | null
    gender: string | null
    interested_in_gender: string | null
    age_min: number | null
    age_max: number | null
}

function isCompatible(me: ProfileRow | undefined, p: ProfileRow): boolean {
    if (!me) return true
    if (p.id === me.id) return true
    const meWants = me.interested_in_gender || 'any'
    const pWants = p.interested_in_gender || 'any'
    if (meWants !== 'any' && p.gender && p.gender !== meWants) return false
    if (pWants !== 'any' && me.gender && me.gender !== pWants) return false
    if (me.age_min != null && p.age != null && p.age < me.age_min) return false
    if (me.age_max != null && p.age != null && p.age > me.age_max) return false
    if (p.age_min != null && me.age != null && me.age < p.age_min) return false
    if (p.age_max != null && me.age != null && me.age > p.age_max) return false
    return true
}

export function useLobby(userId: string | null) {
    const [participants, setParticipants] = useState<LobbyParticipant[]>([])
    const [count, setCount] = useState(0)
    const [isReady, setIsReady] = useState(false)
    const [countdown] = useState<number | null>(null)
    const profileCache = useRef<Map<string, ProfileRow>>(new Map())

  useEffect(() => {
        if (!userId) return

                let disposed = false
        let poller: ReturnType<typeof setInterval> | null = null
        let unsub: (() => void) | null = null

                const applyState = async (state: unknown) => {
                        const presenceState = state as Record<string, unknown[]> | undefined
                        if (!presenceState || disposed) return

                        const raw: { userId: string; joinedAt: string }[] = []
                                Object.values(presenceState).forEach((presences) => {
                                          presences.forEach((p: unknown) => {
                                                      const pr = p as { userId?: string; joinedAt?: string } | null
                                                      if (pr?.userId) raw.push({ userId: pr.userId, joinedAt: pr.joinedAt || new Date().toISOString() })
                                          })
                                })

                        const ids = [...new Set(raw.map((r) => r.userId))]
                        const missing = ids.filter((id) => !profileCache.current.has(id))
                        if (missing.length && supabase) {
                                  try {
                                              const { data } = await supabase
                                                .from('users')
                                                .select('id, display_name, photo_url, age, gender, interested_in_gender, age_min, age_max')
                                                .in('id', missing)
                                              ;(data || []).forEach((row) => profileCache.current.set(row.id, row as ProfileRow))
                                  } catch {
                                              // profiles unavailable: fall through, everyone passes the filter
                                  }
                        }

                        const me = profileCache.current.get(userId)
                        const users: LobbyParticipant[] = []
                                raw.forEach((r) => {
                                          const prof = profileCache.current.get(r.userId)
                                          if (prof && !isCompatible(me, prof)) return
                                          users.push({
                                                      userId: r.userId,
                                                      displayName: prof?.display_name || 'Unknown',
                                                      photoUrl: prof?.photo_url || null,
                                                      joinedAt: r.joinedAt,
                                          })
                                })

                        if (disposed) return
                        setParticipants(users)
                        setCount(users.length)
                }

                const init = async () => {
                        try {
                                  const channel = await realtimeLib.joinLobby(userId)

                          unsub = realtimeLib.onLobbyChange((state: unknown) => {
                                      void applyState(state)
                          })

                          // Poll as well: the first presence sync often fires before the
                          // listener above is registered, which left the lobby stuck at 0.
                          poller = setInterval(() => {
                                      try {
                                                    void applyState(channel.presenceState())
                                      } catch {
                                                    /* channel not ready yet */
                                      }
                          }, 2000)
                        } catch (err) {
                                  console.error('Lobby init error:', err)
                        }
                }

                void init()

                return () => {
                        disposed = true
                        if (poller) clearInterval(poller)
                        if (unsub) unsub()
                        void realtimeLib.leaveLobby()
                }
  }, [userId])

  const joinLobby = async () => {
        if (!userId) throw new Error('User not logged in')
        await realtimeLib.joinLobby(userId)
  }

  const leaveLobby = async () => {
        await realtimeLib.leaveLobby()
        setParticipants([])
        setCount(0)
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
