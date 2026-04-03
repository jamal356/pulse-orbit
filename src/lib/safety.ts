import { supabase } from './supabase'

export interface Report {
  id: string
  reporter_id: string
  reported_id: string
  session_id: string | null
  reason: 'inappropriate' | 'harassment' | 'fake_profile' | 'underage' | 'spam' | 'other'
  details: string | null
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed'
  created_at: string
}

export interface Block {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: Report['reason'],
  sessionId?: string,
  details?: string,
) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      reported_id: reportedId,
      session_id: sessionId || null,
      reason,
      details: details || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Report
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('blocks')
    .insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    })
    .select()
    .single()

  if (error) throw error
  return data as Block
}

export async function unblockUser(blockerId: string, blockedId: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)

  if (error) throw error
}

export async function getBlockedUsers(userId: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId)

  if (error) throw error
  return (data || []).map((b) => b.blocked_id)
}

export async function isBlocked(userId: string, targetId: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', userId)
    .eq('blocked_id', targetId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return !!data
}
