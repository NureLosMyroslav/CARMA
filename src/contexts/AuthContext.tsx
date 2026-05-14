// Контекст авторизації - зберігає стан поточного користувача
// Підключається в App.tsx і доступний у будь-якому компоненті через useAuth()

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Тип профілю з нашої таблиці profiles
interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: 'user' | 'admin'
  subscription_plan: 'free' | 'premium'
}

// Що зберігає контекст
interface AuthContextType {
  user: User | null           // поточний юзер з Supabase Auth
  profile: Profile | null     // профіль з нашої таблиці
  loading: boolean            // чи завантажується стан авторизації
  isAdmin: boolean            // зручна перевірка чи адмін
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Провайдер - обгортає весь додаток
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Завантажуємо профіль користувача з таблиці profiles
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, phone, role, subscription_plan')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Помилка завантаження профілю:', error)
      return
    }

    setProfile(data as Profile)
  }

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Підписуємось на зміни стану авторизації (вхід/вихід)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    // Відписуємось при розмонтуванні компонента
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Хук для зручного доступу до контексту
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
