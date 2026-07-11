// src/components/common/LanguageToggle.jsx
// A single tiny pill button that cycles EN -> SW -> EN on tap.
// Shows the language you'll switch TO is implied by the current code
// shown (matches ThemeToggle's minimal, icon-only navbar aesthetic,
// but text is clearer than an icon for a language switch).
import React from 'react'
import { useLanguage } from '../../context/LanguageContext'

const ORDER = ['en', 'sw']
const LABEL = { en: 'EN', sw: 'SW' }
const FULL_LABEL = { en: 'English', sw: 'Kiswahili' }

export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage()

  function cycle() {
    const next = ORDER[(ORDER.indexOf(lang) + 1) % ORDER.length]
    setLang(next)
  }

  return (
    <button
      onClick={cycle}
      className="orin-icon-btn"
      aria-label={`${t('lang.switch')} (${FULL_LABEL[lang]})`}
      title={`${t('lang.switch')}: ${FULL_LABEL[lang]}`}
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.2px',
      }}
    >
      {LABEL[lang] || 'EN'}
    </button>
  )
}
