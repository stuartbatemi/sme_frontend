// src/components/common/ThemeToggle.jsx
// A single tiny icon button that cycles grey -> light -> dark -> grey on tap.
// No labels, no segmented control — just the icon, matching the navbar's
// clay-glass pill aesthetic.
import React from 'react'
import { useTheme } from '../../context/ThemeContext'

const ORDER = ['grey', 'light', 'dark']

const ICON = {
  grey: (
    // soft cloud / mist mark for the neutral clay theme
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 17a4 4 0 0 1 .4-7.98A5 5 0 0 1 17 11a3.5 3.5 0 0 1-.5 7H7Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  light: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 1.8v3M12 19.2v3M3.2 3.2l2.1 2.1M18.7 18.7l2.1 2.1M1.8 12h3M19.2 12h3M3.2 20.8l2.1-2.1M18.7 5.3l2.1-2.1"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  dark: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
}

const LABEL = { grey: 'Grey theme', light: 'Light theme', dark: 'Dark theme' }

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
    setTheme(next)
  }

  return (
    <button
      onClick={cycle}
      className="orin-icon-btn"
      aria-label={`Switch theme (currently ${LABEL[theme]})`}
      title={LABEL[theme]}
    >
      {ICON[theme] || ICON.grey}
    </button>
  )
}
