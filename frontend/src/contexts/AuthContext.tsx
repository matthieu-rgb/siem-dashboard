import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { ApiRequestError, api, setAccessToken } from '@/api/client'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const restore = useCallback(async () => {
    try {
      const { access_token } = await api.auth.refresh()
      setAccessToken(access_token)
      const me = await api.auth.me()
      setUser(me)
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    restore()
  }, [restore])

  const login = async (email: string, password: string) => {
    const { access_token } = await api.auth.login(email, password)
    setAccessToken(access_token)
    const me = await api.auth.me()
    setUser(me)
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
