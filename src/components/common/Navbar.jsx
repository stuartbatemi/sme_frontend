// src/components/common/Navbar.jsx
import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ThemeToggle from './ThemeToggle'
import LanguageToggle from './LanguageToggle'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
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
    { to: '/', label: t('nav.home') },
    { to: '/advisor', label: t('nav.getAdvice') },
  ]

  return (
    <>
      {/* ── Pill navbar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '10px 20px',
        background: 'var(--clr-bg)',
        transition: 'background 0.25s ease',
      }}>
        <nav style={{
          maxWidth: 1160,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          height: 54,
          padding: '0 8px',
          borderRadius: 999,
          background: 'var(--navbar-clay-bg)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          border: '1px solid var(--navbar-clay-edge)',
          boxShadow: 'var(--navbar-clay-shadow), var(--navbar-clay-inset)',
        }}>

          {/* Col 1 — hamburger, left-aligned */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label={t('nav.openMenu')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: '50%',
                border: '1px solid var(--navbar-clay-edge)',
                background: 'var(--navbar-clay-bg-soft)',
                color: 'var(--navbar-ink)',
                cursor: 'pointer', flexShrink: 0,
                transition: 'background 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Col 2 — wordmark, perfectly centered in grid */}
          <Link to="/" style={{
            fontFamily: 'var(--font-wordmark)',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--navbar-ink)',
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
            textDecoration: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}>
            ORin<span style={{ color: 'var(--navbar-accent)' }}>.</span>
          </Link>

          {/* Col 3 — right cluster, right-aligned */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <ThemeToggle />
            <LanguageToggle />

            {user ? (
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: '1px solid var(--navbar-clay-edge)',
                  background: 'transparent',
                  color: 'var(--navbar-ink-dim)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13.5, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'background 0.2s ease',
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--navbar-accent)', color: '#2A2200',
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {user.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
                <span style={{ maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name?.split(' ')[0]}
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '8px 18px', borderRadius: 999,
                    border: '1px solid var(--navbar-clay-edge)',
                    background: 'transparent', color: 'var(--navbar-ink-dim)',
                    fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'background 0.2s ease',
                  }}
                >{t('nav.login')}</button>
                <button
                  onClick={() => navigate('/register')}
                  style={{
                    padding: '8px 18px', borderRadius: 999,
                    border: '1px solid var(--navbar-accent)',
                    background: 'var(--navbar-accent)', color: '#2A2200',
                    fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px rgba(232,168,56,0.35)',
                    transition: 'filter 0.18s ease',
                  }}
                >{t('nav.signup')}</button>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* ── Slide-in drawer ── */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 199,
              background: 'rgba(10,10,12,0.45)',
              backdropFilter: 'blur(2px)',
              animation: 'orinFadeIn 0.18s ease both',
            }}
          />
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
            width: 'min(80vw, 280px)',
            background: 'var(--navbar-clay-bg)',
            backdropFilter: 'blur(22px) saturate(150%)',
            WebkitBackdropFilter: 'blur(22px) saturate(150%)',
            borderRight: '1px solid var(--navbar-clay-edge)',
            boxShadow: 'var(--navbar-clay-shadow)',
            padding: '24px 20px',
            display: 'flex', flexDirection: 'column', gap: 4,
            animation: 'orinSlideIn 0.22s cubic-bezier(0.16,1,0.3,1) both',
          }}>

            {/* Drawer header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 16,
              marginBottom: 8,
              borderBottom: '1px solid var(--navbar-clay-edge)',
            }}>
              <span style={{
                fontFamily: 'var(--font-wordmark)', fontSize: 18, fontWeight: 600,
                color: 'var(--navbar-ink)', display: 'flex', alignItems: 'baseline', gap: 1,
              }}>
                ORin<span style={{ color: 'var(--navbar-accent)' }}>.</span>
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t('nav.closeMenu')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: '50%',
                  border: '1px solid var(--navbar-clay-edge)',
                  background: 'var(--navbar-clay-bg-soft)',
                  color: 'var(--navbar-ink)', cursor: 'pointer',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setDrawerOpen(false)}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
                  color: isActive(l.to) ? 'var(--navbar-accent)' : 'var(--navbar-ink)',
                  padding: '12px 16px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  background: isActive(l.to) ? 'rgba(255,255,255,0.10)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
              >{l.label}</Link>
            ))}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Auth bottom */}
            {user ? (
              <div style={{ borderTop: '1px solid var(--navbar-clay-edge)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ padding: '8px 16px', fontSize: 13, color: 'var(--navbar-ink-dim)' }}>
                  {t('nav.signedInAs')} <strong style={{ color: 'var(--navbar-ink)' }}>{user.full_name}</strong>
                </p>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'block', textAlign: 'left',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
                    color: 'var(--clr-danger)',
                    padding: '12px 16px', borderRadius: 12,
                    background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                    transition: 'background 0.15s ease',
                  }}
                >{t('nav.logout')}</button>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--navbar-clay-edge)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/login" onClick={() => setDrawerOpen(false)} style={{
                  display: 'block', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
                  color: 'var(--navbar-ink)', padding: '12px 16px', borderRadius: 12,
                  textDecoration: 'none', transition: 'background 0.15s ease',
                }}>{t('nav.login')}</Link>
                <Link to="/register" onClick={() => setDrawerOpen(false)} style={{
                  display: 'block', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
                  color: 'var(--navbar-accent)', padding: '12px 16px', borderRadius: 12,
                  textDecoration: 'none', background: 'rgba(232,168,56,0.10)',
                  transition: 'background 0.15s ease',
                }}>{t('nav.signup')}</Link>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  )
}
