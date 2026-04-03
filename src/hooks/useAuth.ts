import { useEffect, useState } from 'react'
import * as authLib from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  phone: string | null
  display_name: string
  age: number
  gender: string
  city: string | null
  bio: string | null
  photo_url: string | null
  interests: string[]
  is_verified: boolean
  is_banned: boolean
  created_at: string
  updated_at: string
  last_seen: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const init = async () => {
      try {
        const session = await authLib.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }

        const sub = authLib.onAuthStateChange((_event, sess) => {
          if (sess?.user) {
            setUser(sess.user)
            fetchProfile(sess.user.id)
          } else {
            setUser(null)
            setProfile(null)
          }
        })

        unsubscribe = sub.data.subscription.unsubscribe
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data as UserProfile)
    } catch (err) {
      console.error('Profile fetch error:', err)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const data = await authLib.signUp(email, password)
      return data
    } catch (err) {
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authLib.signIn(email, password)
      setUser(data.user)
      if (data.user) await fetchProfile(data.user.id)
      return data
    } catch (err) {
      throw err
    }
  }

  const signOut = async () => {
    try {
      await authLib.signOut()
      setUser(null)
      setProfile(null)
    } catch (err) {
      throw err
    }
  }

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  }
}
