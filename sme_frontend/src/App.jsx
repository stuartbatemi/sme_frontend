// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import Navbar      from './components/common/Navbar'
import Home        from './pages/Home'
import AdvisorPage from './pages/AdvisorPage'
import Login       from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import GISExplorer from './pages/GISExplorer'
import Upgrade    from './pages/Upgrade'
import LegalPage  from './pages/LegalPage'
import About      from './pages/About'
import { Spinner } from './components/common/UI'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh' }}>
      <Spinner size={40} />
    </div>
  )
  if (!user) return <Navigate to="/register" replace />
  return children
}

function AppRoutes() {
  const location = useLocation()
  const isGISPage = location.pathname === '/gis-explorer'
  const { t } = useLanguage()
  
  return (
    <>
      {!isGISPage && <Navbar />}
      <main style={{ minHeight: isGISPage ? '100vh' : 'calc(100vh - 60px)' }}>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/advisor"   element={<AdvisorPage />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ForgotPassword />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/gis-explorer" element={<GISExplorer />} />
          <Route path="/upgrade"     element={<Upgrade />} />
          <Route path="/terms"       element={<LegalPage />} />
          <Route path="/privacy"     element={<LegalPage />} />
          <Route path="/about"       element={<About />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isGISPage && (
        <footer style={{
          borderTop: '1px solid var(--clr-border)', padding: 'var(--space-6)',
          textAlign: 'center', fontSize: '13px', color: 'var(--clr-text-3)',
        }}>
          © {new Date().getFullYear()} SME Advisor — Dar es Salaam ·{' '}
          {t('home.footer')}
        </footer>
      )}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
