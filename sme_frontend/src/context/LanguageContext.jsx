// src/context/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() =>
    localStorage.getItem('sme_lang') || 'en'
  )

  useEffect(() => {
    localStorage.setItem('sme_lang', lang)
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  // t(key) — looks up `key` in the current language's dictionary.
  // Falls back to English, then to the raw key itself, so a missing
  // translation never crashes the UI or renders blank — worst case
  // you see the English string or the key name, never a broken page.
  function t(key) {
    const dict = translations[lang] || translations.en
    if (dict[key] !== undefined) return dict[key]
    if (translations.en[key] !== undefined) return translations.en[key]
    return key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: Object.keys(translations) }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
