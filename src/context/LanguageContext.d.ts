// Type declarations for LanguageContext.jsx — the runtime implementation
// stays plain JS, but .tsx consumers need real types instead of TS
// inferring `never` (same reason AuthContext.d.ts and api.d.ts exist).
import type { ReactNode } from 'react'

export interface LanguageContextValue {
  lang: string
  setLang: (lang: string) => void
  t: (key: string) => string
  languages: string[]
}

export function LanguageProvider(props: { children: ReactNode }): JSX.Element
export function useLanguage(): LanguageContextValue
