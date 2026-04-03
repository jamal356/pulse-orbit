import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type EventCallback<T = unknown> = (payload: T) => void
type PresenceChangeCallback = (state: unknown) => void

let lobbyChannel: RealtimeChannel | null = null
let sessionChannel: RealtimeChannel | null = null
let videoChannel: RealtimeChannel | null = null

export async function joinLobby(userId: string) {
  if (!supabase) throw new Error('Supabase not configured')

  lobbyChannel = supabase.channel('pulse:lobby', { config: { broadcast: { self: true } } })

  await lobbyChannel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await lobbyChannel!.track({ userId, joinedAt: new Date().toISOString() })
    }
  })

  return lobbyChannel
}

export async function leaveLobby() {
  if (!lobbyChannel) return
  await lobbyChannel.unsubscribe()
  lobbyChannel = null
}

export function onLobbyChange(callback: PresenceChangeCallback) {
  if (!lobbyChannel) throw new Error('Lobby channel not initialized')
  const sub = lobbyChannel.on(
    'presence' as unknown as 'system',
    { event: 'sync' },
    callback as unknown as () => void,
  )
  return () => {
    sub.unsubscribe()
  }
}

export async function joinSession(sessionId: string) {
  if (!supabase) throw new Error('Supabase not configured')

  sessionChannel = supabase.channel(`pulse:session:${sessionId}`)
  await sessionChannel.subscribe()

  return sessionChannel
}

export async function leaveSession() {
  if (!sessionChannel) return
  await sessionChannel.unsubscribe()
  sessionChannel = null
}

export function broadcastEvent<T extends Record<string, unknown>>(
  event: string,
  payload: T,
) {
  if (!sessionChannel) throw new Error('Session channel not initialized')
  return sessionChannel.send({
    type: 'broadcast',
    event,
    payload,
  })
}

export function onSessionEvent<T = unknown>(event: string, callback: EventCallback<T>) {
  if (!sessionChannel) throw new Error('Session channel not initialized')
  const sub = sessionChannel.on('broadcast', { event }, (msg) => {
    callback(msg.payload as T)
  })
  return () => {
    sub.unsubscribe()
  }
}

export async function joinVideoChannel(sessionId: string) {
  if (!supabase) throw new Error('Supabase not configured')

  videoChannel = supabase.channel(`pulse:video:${sessionId}`)
  await videoChannel.subscribe()

  return videoChannel
}

export function broadcastPeerId(roundId: string, peerId: string) {
  if (!videoChannel) throw new Error('Video channel not initialized')
  return videoChannel.send({
    type: 'broadcast',
    event: 'peer_id',
    payload: { roundId, peerId, sentAt: new Date().toISOString() },
  })
}

export function onPeerIdReceived(callback: EventCallback<{ roundId: string; peerId: string }>) {
  if (!videoChannel) throw new Error('Video channel not initialized')
  const sub = videoChannel.on('broadcast', { event: 'peer_id' }, (msg) => {
    callback(msg.payload as { roundId: string; peerId: string })
  })
  return () => {
    sub.unsubscribe()
  }
}
