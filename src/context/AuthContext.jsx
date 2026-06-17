// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, userAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)   // true while checking localStorage

  // On first load: if tokens exist, fetch the current user
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      userAPI.me()
        .then(res => setUser(res.data))
        .catch(() => localStorage.clear())   // token invalid/expired, clear it
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function register(formData) {
    const { data } = await authAPI.register(formData)
    localStorage.setItem('access_token',  data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    return data
  }

  async function login(email, password) {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('access_token',  data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    return data
  }

  async function logout() {
    try { await authAPI.logout() } catch (_) {}
    localStorage.clear()
    setUser(null)
  }

  function updateUser(updated) {
    setUser(prev => ({ ...prev, ...updated }))
  }

  const isPremium = user?.tier === 'premium'

  return (
    <AuthContext.Provider value={{
      user, loading, isPremium,
      register, login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
