import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<Error | null>
  signUpWithEmail: (email: string, password: string) => Promise<Error | null>
  signInWithGoogle: () => Promise<Error | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// 🚧 DEV ADMIN HELPER (REMOVE BEFORE PRODUCTION)
const getDevUser = (): User | null => {
  const raw = localStorage.getItem('dev_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

 useEffect(() => {
  const init = async () => {
    // ✅ Check for DEV ADMIN first
    const devUser = getDevUser()
    if (devUser) {
      setUser(devUser)
      setSession(null)
      setLoading(false)
      return
    }

    // Otherwise use real Supabase session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    setSession(session ?? null)
    setUser(session?.user ?? null)
    setLoading(false)
  }

  void init()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    const devUser = getDevUser()
    if (devUser) {
      setUser(devUser)
      setSession(null)
      return
    }

    setSession(session ?? null)
    setUser(session?.user ?? null)
  })

  return () => {
    subscription.unsubscribe()
  }
}, [])


  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ?? null
  }

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error ?? null
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    return error ?? null
  }

  const signOut = async () => {
    localStorage.removeItem('dev_user') // remove dev bypass
    await supabase.auth.signOut()
  }

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
