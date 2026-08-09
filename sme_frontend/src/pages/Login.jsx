// src/pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Button, Input, Card, Alert } from '../components/common/UI'

export default function Login() {
  const { login }  = useAuth()
  const { t }      = useLanguage()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(field, value) { setForm(p => ({ ...p, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/advisor')
    } catch (err) {
      setError(err.response?.data?.error || t('login.error_default'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '80vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-8) var(--space-6)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="animate-fadeUp">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
            {t('login.welcome_title')}
          </h1>
          <p style={{ color: 'var(--clr-text-2)' }}>
            {t('login.welcome_sub')}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Alert type="error" message={error} />

            <Input
              label={t('login.email_label')} name="email" type="email"
              value={form.email} onChange={e => set('email', e.target.value)}
              placeholder={t('login.email_placeholder')} required
            />
            <Input
              label={t('login.password_label')} name="password" type="password"
              value={form.password} onChange={e => set('password', e.target.value)}
              placeholder={t('login.password_placeholder')} required
            />

            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-primary)' }}>
                {t('login.forgot_password')}
              </Link>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              {t('login.submit')}
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: '14px', color: 'var(--clr-text-2)' }}>
          {t('login.no_account')}{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>{t('login.create_account')}</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: '12px', color: 'var(--clr-text-3)' }}>
          <Link to="/terms" style={{ color: 'inherit' }}>{t('nav.terms')}</Link>
          {' · '}
          <Link to="/privacy" style={{ color: 'inherit' }}>{t('nav.privacy')}</Link>
        </p>

      </div>
    </div>
  )
}
