import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRow } from '@/types/database'
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/useAuth'

/** Owns the Supabase auth session and the matching public.users profile row, and exposes sign in/up/out to the whole app via AuthContext. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
        if (!data.session) setLoading(false)
      })
      .catch(() => setLoading(false))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(
        ({ data, error }) => {
          if (cancelled) return
          if (error) console.error('Failed to load user profile', error)
          setProfile((data as UserRow) ?? null)
          setLoading(false)
        },
        (err: unknown) => {
          if (cancelled) return
          console.error('Failed to load user profile', err)
          setLoading(false)
        },
      )
    return () => {
      cancelled = true
    }
  }, [session])

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    async signIn(email, password) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Sign in failed.' }
      }
    },
    async signUp(email, password, name) {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        return { error: error?.message ?? null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Sign up failed.' }
      }
    },
    async signOut() {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error('Sign out failed', err)
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
