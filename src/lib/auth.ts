import { supabase } from './supabase'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

export type AuthStateCallback = (event: AuthChangeEvent, session: Session | null) => void

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithOtp(phone: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithOtp({ phone })
  if (error) throw error
  return data
}

export async function verifyOtp(phone: string, token: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getUser() {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user as User
}

export function onAuthStateChange(callback: AuthStateCallback) {
  if (!supabase) {
    console.warn('Supabase not configured — auth state changes will not be tracked')
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return supabase.auth.onAuthStateChange(callback)
}
