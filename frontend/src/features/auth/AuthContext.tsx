import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { setAuthToken, getAuthToken, API_BASE_URL, getProfile } from '../../api/client'
import type { UserProfile } from '../../types'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  loading: boolean
  isSupabaseEnabled: boolean
  loginWithPassword: (email: string, password: string) => Promise<void>
  signupWithPassword: (email: string, password: string) => Promise<void>
  loginWithDemo: (email?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(getAuthToken())
  const [loading, setLoading] = useState<boolean>(true)

  // Initialize and check session
  useEffect(() => {
    async function initSession() {
      setLoading(true)
      const existingToken = getAuthToken()

      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession()
        if (data?.session?.access_token) {
          const accessToken = data.session.access_token
          setAuthToken(accessToken)
          setToken(accessToken)
          try {
            const profile = await getProfile()
            setUser(profile)
          } catch {
            setUser({ id: data.session.user.id, email: data.session.user.email, timezone: 'Asia/Kolkata' })
          }
        } else if (existingToken) {
          try {
            const profile = await getProfile()
            setUser(profile)
          } catch {
            setAuthToken(null)
            setToken(null)
          }
        }
      } else if (existingToken) {
        try {
          const profile = await getProfile()
          setUser(profile)
        } catch {
          setAuthToken(null)
          setToken(null)
        }
      }
      setLoading(false)
    }

    initSession()

    // Listen for Supabase auth state changes if configured
    if (isSupabaseConfigured) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.access_token) {
          setAuthToken(session.access_token)
          setToken(session.access_token)
          try {
            const profile = await getProfile()
            setUser(profile)
          } catch {
            setUser({ id: session.user.id, email: session.user.email, timezone: 'Asia/Kolkata' })
          }
        } else {
          setAuthToken(null)
          setToken(null)
          setUser(null)
        }
      })
      return () => {
        listener.subscription.unsubscribe()
      }
    }
  }, [])

  const loginWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet. Use Sandbox mode or set up .env')
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session) {
      setAuthToken(data.session.access_token)
      setToken(data.session.access_token)
      const profile = await getProfile()
      setUser(profile)
    }
  }

  const signupWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet. Use Sandbox mode or set up .env')
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.session) {
      setAuthToken(data.session.access_token)
      setToken(data.session.access_token)
      const profile = await getProfile()
      setUser(profile)
    }
  }

  const loginWithDemo = async (email = 'demo@privacypulse.local') => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/dev-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'sandbox-user-1', email }),
    })
    if (!res.ok) throw new Error('Could not obtain sandbox token')
    const data = await res.json()
    setAuthToken(data.access_token)
    setToken(data.access_token)
    const profile = await getProfile()
    setUser(profile)
  }

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isSupabaseEnabled: isSupabaseConfigured,
        loginWithPassword,
        signupWithPassword,
        loginWithDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

