import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getToken as getStoredToken, getMe, clearAuth } from '../api'

interface User {
  id: number
  username: string
  role: string
}

interface AuthContextType {
  token: string | null
  user: User | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getStoredToken())
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (token) {
      getMe()
        .then(data => setUser(data))
        .catch(() => {
          clearAuth()
          setTokenState(null)
        })
    }
  }, [token])

  const login = (newToken: string) => {
    setTokenState(newToken)
  }

  const logout = () => {
    clearAuth()
    setTokenState(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
