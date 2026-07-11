// src/pages/Register.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Button, Input, Select, Card, Alert } from '../components/common/UI'

const DISTRICTS = ['Ilala', 'Kigamboni', 'Kinondoni', 'Temeke', 'Ubungo']

export default function Register() {
  const { register } = useAuth()
  const { t }         = useLanguage()
  const navigate     = useNavigate()

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '',
    phone: '', age: '', gender: '', district: '', ward: '',
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(field, value) { setForm(p => ({ ...p, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError(t('register.password_mismatch')); return }
    if (form.password.length < 8) { setError(t('register.password_short')); return }
    setLoading(true)
    try {
      await register({
        full_name: form.full_name,
        email:     form.email,
        password:  form.password,
        phone:     form.phone    || undefined,
        age:       form.age      ? parseInt(form.age) : undefined,
        gender:    form.gender   || undefined,
        district:  form.district || undefined,
        ward:      form.ward     || undefined,
      })
      navigate('/advisor')
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        t('register.error_default')
      )
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
      <div style={{ width: '100%', maxWidth: 520 }} className="animate-fadeUp">

        {/* Header — no "PREMIUM ACCOUNT" badge */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem', marginBottom: 'var(--space-2)',
          }}>{t('register.title')}</h1>
          <p style={{ color: 'var(--clr-text-2)' }}>
            {t('register.subtitle')}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Alert type="error" message={error} />

            <Input label={t('register.fullname_label')} name="full_name" value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder={t('register.fullname_placeholder')} required />

            <Input label={t('register.email_label')} name="email" type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder={t('register.email_placeholder')} required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input label={t('register.password_label')} name="password" type="password" value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={t('register.password_placeholder')} required />
              <Input label={t('register.confirm_label')} name="confirm" type="password" value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                placeholder={t('register.confirm_placeholder')} required />
            </div>

            {/* Optional fields */}
            <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.5px',
              color: 'var(--clr-text-3)', textTransform: 'uppercase', marginTop: 4 }}>
              {t('register.optional_label')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input label={t('register.phone_label')} name="phone" type="tel" value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="+255 7XX XXX XXX" />
              <Input label={t('register.age_label')} name="age" type="number" value={form.age}
                onChange={e => set('age', e.target.value)} placeholder={t('register.age_placeholder')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Select label={t('advisor.gender_label')} name="gender" value={form.gender}
                onChange={e => set('gender', e.target.value)}
                options={[
                  { value: '', label: t('advisor.gender_prefer_not') },
                  { value: 'male', label: t('advisor.gender_male') },
                  { value: 'female', label: t('advisor.gender_female') },
                ]} />
              <Select label={t('register.district_label')} name="district" value={form.district}
                onChange={e => set('district', e.target.value)}
                options={[
                  { value: '', label: t('register.district_select') },
                  ...DISTRICTS.map(d => ({ value: d, label: d }))
                ]} />
            </div>

            <Input label={t('register.ward_label')} name="ward" value={form.ward}
              onChange={e => set('ward', e.target.value)} placeholder={t('register.ward_placeholder')} />

            <Button type="submit" variant="primary" fullWidth loading={loading}
              style={{ marginTop: 'var(--space-2)' }}>
              {t('register.submit')}
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: '14px', color: 'var(--clr-text-2)' }}>
          {t('register.have_account')}{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>{t('nav.login')}</Link>
        </p>
      </div>
    </div>
  )
}
