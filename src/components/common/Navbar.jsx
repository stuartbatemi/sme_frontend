// src/components/common/Navbar.jsx
// ORin. navbar — fused claymorphism + glassmorphism "pill" bar.
// Layout: [hamburger] -------- ORin. -------- [theme icon] [auth]
// The hamburger opens a slide-in drawer for navigation links;
// it stays out of the way until tapped, per the brief.
import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const { user, logout, isPremium } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleLogout() {
    await logout()
    setDrawerOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/advisor', label: 'Get Advice' },
    ...(user && isPremium ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
  ]

  return (
    <>
      <div className="orin-navbar-wrap">
        <nav className="orin-navbar">
          {/* Hamburger — left, tucked, opens the drawer */}
          <button
            className="orin-icon-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Wordmark — dead center */}
          <Link to="/" className="orin-wordmark">
            ORin<span className="dot">.</span>
          </Link>

          {/* Right cluster — theme icon + auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <ThemeToggle />

            {user ? (
              <button
                className="orin-pill-btn ghost hide-mobile"
                onClick={() => setDrawerOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--navbar-accent)', color: '#2A2200',
                  fontSize: '11px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {user.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
                <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name?.split(' ')[0]}
                </span>
              </button>
            ) : (
              <>
                <button className="orin-pill-btn ghost hide-mobile" onClick={() => navigate('/login')}>
                  Log in
                </button>
                <button className="orin-pill-btn solid" onClick={() => navigate('/register')}>
                  Sign up
                </button>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Slide-in drawer — navigation lives here, summoned by the hamburger */}
      {drawerOpen && (
        <>
          <div className="orin-drawer-scrim" onClick={() => setDrawerOpen(false)} />
          <aside className="orin-drawer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <span className="orin-wordmark" style={{ fontSize: 18 }}>
                ORin<span className="dot">.</span>
              </span>
              <button className="orin-icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setDrawerOpen(false)}
                className={`orin-drawer-link ${isActive(l.to) ? 'active' : ''}`}
              >
                {l.label}
              </Link>
            ))}

            <div style={{ flex: 1 }} />

            {user ? (
              <>
                <div style={{ padding: '10px', fontSize: '13px', color: 'var(--navbar-ink-dim)' }}>
                  Signed in as <strong style={{ color: 'var(--navbar-ink)' }}>{user.full_name}</strong>
                  {isPremium && <span style={{ marginLeft: 6, color: 'var(--navbar-accent)', fontWeight: 700 }}>· PRO</span>}
                </div>
                <button onClick={handleLogout} className="orin-drawer-link" style={{ textAlign: 'left', color: 'var(--clr-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setDrawerOpen(false)} className="orin-drawer-link">Log in</Link>
                <Link to="/register" onClick={() => setDrawerOpen(false)} className="orin-drawer-link active">Sign up</Link>
              </>
            )}
          </aside>
        </>
      )}
    </>
  )
}
