import { supabase } from './supabase'

export interface Session {
  id: string
  type: 'on_demand' | 'scheduled'
  status: 'waiting' | 'countdown' | 'live' | 'rating' | 'completed' | 'cancelled'
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  max_participants: number
  current_round: number
  total_rounds: number
  created_at: string
}

export interface SessionParticipant {
  id: string
  session_id: string
  user_id: string
  joined_at: string
  left_at: string | null
  status: 'active' | 'disconnected' | 'left' | 'removed'
}

export interface Round {
  id: string
  session_id: string
  round_number: number
  user_a: string
  user_b: string
  started_at: string | null
  ended_at: string | null
  extended: boolean
  spark_a: boolean
  spark_b: boolean
  mutual_spark: boolean
}

export interface Rating {
  id: string
  session_id: string
  round_id: string
  rater_id: string
  rated_id: string
  rating: 'like' | 'pass'
  created_at: string
}

export interface Match {
  id: string
  session_id: string
  user_a: string
  user_b: string
  matched_at: string
  status: 'active' | 'blocked' | 'expired'
}

export async function fetchActiveSessions() {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .in('status', ['waiting', 'countdown', 'live'])

  if (error) throw error
  return data as Session[]
}

export async function fetchSession(id: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('sessions')
    .select('*, session_participants(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Session & { session_participants: SessionParticipant[] }
}

export async function joinSession(sessionId: string, userId: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('session_participants')
    .insert({
      session_id: sessionId,
      user_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data as SessionParticipant
}

export async function leaveSession(sessionId: string, userId: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('session_participants')
    .update({ left_at: new Date().toISOString(), status: 'left' })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as SessionParticipant
}

export async function fetchRoundsForSession(sessionId: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('rounds')
    .select('*, user_a_profile:user_a(display_name, photo_url), user_b_profile:user_b(display_name, photo_url)')
    .eq('session_id', sessionId)
    .order('round_number', { ascending: true })

  if (error) throw error
  return data as (Round & {
    user_a_profile: { display_name: string; photo_url: string } | null
    user_b_profile: { display_name: string; photo_url: string } | null
  })[]
}

export async function submitRating(
  roundId: string,
  raterId: string,
  ratedId: string,
  sessionId: string,
  rating: 'like' | 'pass',
) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      round_id: roundId,
      rater_id: raterId,
      rated_id: ratedId,
      session_id: sessionId,
      rating,
    })
    .select()
    .single()

  if (error) throw error
  return data as Rating
}

export async function fetchMyMatches(userId: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq('status', 'active')

  if (error) throw error
  return data as Match[]
}

export interface SessionTick {
  round_id: string
  round_number: number
  started_at: string | null
  ended_at: string | null
  seconds_remaining: number
  extended: boolean
  ended: boolean
  server_time: string
}

export async function tickRound(
  sessionId: string,
  roundId: string,
  action?: 'start' | 'extend' | 'end',
): Promise<SessionTick> {
  const res = await fetch('/api/session-tick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, round_id: roundId, action }),
  })
  if (!res.ok) {
    throw new Error(`session-tick failed: ${res.status}`)
  }
  return (await res.json()) as SessionTick
}

export async function fetchSessionResults(sessionId: string, userId: string) {
  if (!supabase) throw new Error('Supabase not configured')

  const [ratingsRes, matchesRes] = await Promise.all([
    supabase
      .from('ratings')
      .select('*')
      .eq('session_id', sessionId),
    supabase
      .from('matches')
      .select('*')
      .eq('session_id', sessionId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`),
  ])

  if (ratingsRes.error) throw ratingsRes.error
  if (matchesRes.error) throw matchesRes.error

  return {
    ratings: ratingsRes.data as Rating[],
    matches: matchesRes.data as Match[],
  }
}
