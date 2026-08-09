// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

// Theme token definitions
const THEMES = {
  grey: {
    '--clr-bg':           '#F0F0F0',
    '--clr-bg-2':         '#E4E4E4',
    '--clr-card':         '#F7F7F7',
    '--clr-border':       '#D1D1D1',
    '--clr-text':         '#1A1A1A',
    '--clr-text-2':       '#4A4A4A',
    '--clr-text-3':       '#888888',
    '--clr-navbar':       'rgba(240,240,240,0.95)',
    '--shadow-sm':        '0 1px 4px rgba(0,0,0,0.10)',
    '--shadow-md':        '0 4px 16px rgba(0,0,0,0.12)',
    '--clay-highlight':   'rgba(255,255,255,0.65)',
    '--clay-shadow-soft': 'rgba(0,0,0,0.10)',
    '--clay-shadow-deep': 'rgba(0,0,0,0.16)',
    // Navbar clay-glass surface — dark clay tone (grey/dark themes
    // share this; light gets its own lighter variant below).
    '--navbar-clay-bg':      'rgba(58, 60, 66, 0.62)',
    '--navbar-clay-bg-soft': 'rgba(58, 60, 66, 0.40)',
    '--navbar-clay-edge':    'rgba(255, 255, 255, 0.10)',
    '--navbar-clay-inset':   'inset 0 1px 1px rgba(255,255,255,0.14), inset 0 -6px 14px rgba(0,0,0,0.22)',
    '--navbar-clay-shadow':  '0 10px 30px rgba(20,20,24,0.28), 0 2px 8px rgba(20,20,24,0.18)',
    '--navbar-ink':          '#F3F2EF',
    '--navbar-ink-dim':      'rgba(243,242,239,0.62)',
  },
  light: {
    '--clr-bg':           '#F9FAFB',
    '--clr-bg-2':         '#F3F4F6',
    '--clr-card':         '#FFFFFF',
    '--clr-border':       '#E5E7EB',
    '--clr-text':         '#111827',
    '--clr-text-2':       '#4B5563',
    '--clr-text-3':       '#9CA3AF',
    '--clr-navbar':       'rgba(255,255,255,0.95)',
    '--shadow-sm':        '0 1px 3px rgba(0,0,0,0.08)',
    '--shadow-md':        '0 4px 16px rgba(0,0,0,0.10)',
    '--clay-highlight':   'rgba(255,255,255,0.85)',
    '--clay-shadow-soft': 'rgba(0,0,0,0.07)',
    '--clay-shadow-deep': 'rgba(0,0,0,0.12)',
    // Lighter, warmer clay so the navbar sits naturally on a white
    // page instead of reading as a dark patch.
    '--navbar-clay-bg':      'rgba(120, 116, 108, 0.30)',
    '--navbar-clay-bg-soft': 'rgba(120, 116, 108, 0.16)',
    '--navbar-clay-edge':    'rgba(255, 255, 255, 0.55)',
    '--navbar-clay-inset':   'inset 0 1px 1px rgba(255,255,255,0.65), inset 0 -6px 14px rgba(60,55,45,0.07)',
    '--navbar-clay-shadow':  '0 10px 26px rgba(60,55,45,0.10), 0 2px 8px rgba(60,55,45,0.08)',
    '--navbar-ink':          '#2B2A27',
    '--navbar-ink-dim':      'rgba(43,42,39,0.58)',
  },
  dark: {
    '--clr-bg':           '#0F1117',
    '--clr-bg-2':         '#1A1D26',
    '--clr-card':         '#1E2130',
    '--clr-border':       '#2E3347',
    '--clr-text':         '#F1F3F9',
    '--clr-text-2':       '#A8B0C8',
    '--clr-text-3':       '#5A637A',
    '--clr-navbar':       'rgba(15,17,23,0.97)',
    '--shadow-sm':        '0 1px 4px rgba(0,0,0,0.40)',
    '--shadow-md':        '0 4px 20px rgba(0,0,0,0.50)',
    // Claymorphism on dark surfaces needs a lighter, dimmer highlight
    // (lighter than the surface, not blown out) and a deeper shadow,
    // or the puffy effect washes out against an already-dark page.
    '--clay-highlight':   'rgba(255,255,255,0.06)',
    '--clay-shadow-soft': 'rgba(0,0,0,0.45)',
    '--clay-shadow-deep': 'rgba(0,0,0,0.65)',
    '--navbar-clay-bg':      'rgba(58, 60, 66, 0.62)',
    '--navbar-clay-bg-soft': 'rgba(58, 60, 66, 0.40)',
    '--navbar-clay-edge':    'rgba(255, 255, 255, 0.10)',
    '--navbar-clay-inset':   'inset 0 1px 1px rgba(255,255,255,0.14), inset 0 -6px 14px rgba(0,0,0,0.22)',
    '--navbar-clay-shadow':  '0 10px 30px rgba(20,20,24,0.28), 0 2px 8px rgba(20,20,24,0.18)',
    '--navbar-ink':          '#F3F2EF',
    '--navbar-ink-dim':      'rgba(243,242,239,0.62)',
  },
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('sme_theme') || 'grey'
  )

  useEffect(() => {
    const tokens = THEMES[theme] || THEMES.grey
    const root = document.documentElement
    Object.entries(tokens).forEach(([k, v]) => {
      root.style.setProperty(k, v)
      // Also set on body so every page picks up bg/text changes
      document.body.style.setProperty(k, v)
    })
    root.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    // Directly set bg + text on body so non-clr pages also respond
    document.body.style.background = tokens['--clr-bg'] || ''
    document.body.style.color = tokens['--clr-text'] || ''
    localStorage.setItem('sme_theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: Object.keys(THEMES) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
