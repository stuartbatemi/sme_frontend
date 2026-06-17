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
  },
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('sme_theme') || 'grey'
  )

  useEffect(() => {
    const tokens = THEMES[theme] || THEMES.grey
    const root = document.documentElement
    Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v))
    root.setAttribute('data-theme', theme)
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
