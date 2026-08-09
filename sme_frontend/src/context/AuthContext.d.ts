// Type declarations for AuthContext.jsx — the runtime implementation
// stays plain JS (other .jsx files still depend on its current shape),
// but .tsx consumers need real types instead of TS inferring `never`.
import type { ReactNode } from 'react'

export interface User {
  id: string | number
  full_name: string
  email: string
  tier?: 'free' | 'premium'
  age?: number
  gender?: string
  district?: string
  ward?: string
  [key: string]: any
}

export interface AuthContextValue {
  user: User | null
  loading: boolean
  isPremium: boolean
  register: (formData: Record<string, any>) => Promise<any>
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  updateUser: (updated: Partial<User>) => void
}

export function AuthProvider(props: { children: ReactNode }): JSX.Element
export function useAuth(): AuthContextValue
