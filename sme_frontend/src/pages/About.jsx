// src/pages/About.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Button } from '../components/common/UI'

export default function About() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const goNext = () => (user ? navigate('/advisor') : navigate('/register'))

  return (
    <div style={{ background: 'var(--clr-bg)', color: 'var(--clr-text)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <p style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '.5px',
          color: 'var(--clr-primary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)',
        }}>
          {t('about.eyebrow')}
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
          marginBottom: 'var(--space-6)', lineHeight: 1.15,
        }}>
          {t('about.title')}
        </h1>

        <div style={{ fontSize: 16.5, lineHeight: 1.8, color: 'var(--clr-text-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <p>{t('about.p1')}</p>
          <p>{t('about.p2')}</p>
          <p>{t('about.p3')}</p>
          <p>{t('about.p4')}</p>
        </div>

        <div style={{
          marginTop: 'var(--space-8)', padding: 'var(--space-5)',
          background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <p style={{ fontSize: 14.5, color: 'var(--clr-text-2)', lineHeight: 1.7 }}>
            {t('about.builder_note')}
          </p>
        </div>

        <div style={{ marginTop: 'var(--space-8)' }}>
          <Button variant="primary" onClick={goNext}>
            {t('about.cta')}
          </Button>
        </div>
      </div>
    </div>
  )
}
