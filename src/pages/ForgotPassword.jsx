// src/pages/ForgotPassword.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { authAPI } from '../services/api'
import { Button, Input, Card, Alert } from '../components/common/UI'

// Screens:
//  'choose'  — pick email-link / email-otp / sms-otp, enter contact, send
//  'sent'    — email-link method: "check your email" confirmation
//  'otp'     — email-otp or sms-otp: enter the 6-digit code + new password
//  'link'    — landed here via /reset-password?token=... — just needs new password
export default function ForgotPassword() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')

  const [screen, setScreen]   = useState(tokenFromUrl ? 'link' : 'choose')
  const [method, setMethod]   = useState('email_link') // 'email_link' | 'email_otp' | 'sms_otp'
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [otp, setOtp]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (tokenFromUrl) setScreen('link') }, [tokenFromUrl])

  const channel = method === 'sms_otp' ? 'sms' : 'email'

  async function handleSend(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { method }
      if (method === 'sms_otp') payload.phone = `255${phone.replace(/\D/g, '').slice(-9)}`
      else payload.email = email

      await authAPI.forgotPassword(payload)
      setScreen(method === 'email_link' ? 'sent' : 'otp')
    } catch (err) {
      setError(err.response?.data?.error || t('forgot.error_default'))
    } finally {
      setLoading(false)
    }
  }

  function validatePasswords() {
    if (password.length < 8) { setError(t('forgot.password_short')); return false }
    if (password !== confirm) { setError(t('forgot.password_mismatch')); return false }
    return true
  }

  async function handleResetOtp(e) {
    e.preventDefault()
    setError('')
    if (!validatePasswords()) return
    setLoading(true)
    try {
      const payload = { channel, otp, new_password: password }
      if (channel === 'sms') payload.phone = `255${phone.replace(/\D/g, '').slice(-9)}`
      else payload.email = email

      await authAPI.resetPasswordOtp(payload)
      setSuccess(t('forgot.success'))
    } catch (err) {
      setError(err.response?.data?.error || t('forgot.invalid_otp'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetLink(e) {
    e.preventDefault()
    setError('')
    if (!validatePasswords()) return
    setLoading(true)
    try {
      await authAPI.resetPasswordLink({ token: tokenFromUrl, new_password: password })
      setSuccess(t('forgot.success'))
    } catch (err) {
      setError(err.response?.data?.error || t('forgot.error_default'))
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
            {t('forgot.title')}
          </h1>
          {screen === 'choose' && (
            <p style={{ color: 'var(--clr-text-2)' }}>{t('forgot.sub')}</p>
          )}
        </div>

        <Card>
          {success ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Alert type="success" message={success} />
              <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
                {t('forgot.back_to_login')}
              </Button>
            </div>
          ) : screen === 'choose' ? (
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Alert type="error" message={error} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <MethodOption
                  selected={method === 'email_link'}
                  onClick={() => setMethod('email_link')}
                  title={t('forgot.method_email')}
                  desc={t('forgot.method_email_desc')}
                  icon="✉️"
                />
                <MethodOption
                  selected={method === 'email_otp'}
                  onClick={() => setMethod('email_otp')}
                  title={t('forgot.method_otp')}
                  desc={t('forgot.method_otp_desc')}
                  icon="🔢"
                />
                <MethodOption
                  selected={method === 'sms_otp'}
                  onClick={() => setMethod('sms_otp')}
                  title={t('forgot.method_sms')}
                  desc={t('forgot.method_sms_desc')}
                  icon="📱"
                />
              </div>

              {method === 'sms_otp' ? (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text-2)', display: 'block', marginBottom: 6 }}>
                    {t('forgot.phone_label')}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', padding: '0 14px',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)',
                      background: 'var(--clr-card)', fontWeight: 600, fontSize: 14, color: 'var(--clr-text-2)',
                      flexShrink: 0,
                    }}>+255</span>
                    <div style={{ flex: 1 }}>
                      <Input
                        name="phone" type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder={t('forgot.phone_placeholder')} required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <Input
                  label={t('forgot.email_label')} name="email" type="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={t('forgot.email_placeholder')} required
                />
              )}

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                {method === 'email_link' ? t('forgot.send_link') : t('forgot.send_code')}
              </Button>
            </form>
          ) : screen === 'sent' ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: '2rem' }}>📬</p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
                {t('forgot.link_sent_title')}
              </h3>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>
                {t('forgot.link_sent_body')}
              </p>
              <Button variant="ghost" fullWidth onClick={handleSend} loading={loading}>
                {t('forgot.resend')}
              </Button>
            </div>
          ) : screen === 'otp' ? (
            <form onSubmit={handleResetOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Alert type="error" message={error} />
              <Input
                label={t('forgot.otp_label')} name="otp" type="text"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('forgot.otp_placeholder')} required
              />
              <Input
                label={t('forgot.new_password_label')} name="password" type="password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={t('forgot.new_password_placeholder')} required
              />
              <Input
                label={t('forgot.confirm_password_label')} name="confirm" type="password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" fullWidth loading={loading}>
                {t('forgot.reset_submit')}
              </Button>
              <Button type="button" variant="ghost" fullWidth onClick={handleSend} loading={loading}>
                {t('forgot.resend')}
              </Button>
            </form>
          ) : (
            // screen === 'link' — arrived via emailed reset URL
            <form onSubmit={handleResetLink} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Alert type="error" message={error} />
              <Input
                label={t('forgot.new_password_label')} name="password" type="password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={t('forgot.new_password_placeholder')} required
              />
              <Input
                label={t('forgot.confirm_password_label')} name="confirm" type="password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" fullWidth loading={loading}>
                {t('forgot.reset_submit')}
              </Button>
            </form>
          )}
        </Card>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: '14px', color: 'var(--clr-text-2)' }}>
          <Link to="/login" style={{ fontWeight: 600 }}>{t('forgot.back_to_login')}</Link>
        </p>
      </div>
    </div>
  )
}

function MethodOption({ selected, onClick, title, desc, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        textAlign: 'left', width: '100%',
        padding: '14px 16px', borderRadius: 'var(--radius-sm)',
        border: selected ? '2px solid var(--clr-primary)' : '1px solid var(--clr-border)',
        background: selected ? 'var(--clr-primary-lt)' : 'var(--clr-card)',
        cursor: 'pointer', transition: 'border-color .15s ease, background .15s ease',
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 14, color: 'var(--clr-text)' }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--clr-text-2)', marginTop: 2 }}>{desc}</span>
      </span>
      <span style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: selected ? '5px solid var(--clr-primary)' : '1.5px solid var(--clr-border)',
        transition: 'border .15s ease',
      }} />
    </button>
  )
}
