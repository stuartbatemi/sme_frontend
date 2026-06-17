// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar      from './components/common/Navbar'
import Home        from './pages/Home'
import AdvisorPage from './pages/AdvisorPage'
import Login       from './pages/Login'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import { Spinner } from './components/common/UI'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'var(--space-16)' }}>
      <Spinner size={40} />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/advisor"   element={<AdvisorPage />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer style={{
        borderTop: '1px solid var(--clr-border)', padding: 'var(--space-6)',
        textAlign: 'center', fontSize: '13px', color: 'var(--clr-text-3)',
      }}>
        © {new Date().getFullYear()} SME Advisor — Dar es Salaam ·{' '}
        Built on real NBS & Census data
      </footer>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
