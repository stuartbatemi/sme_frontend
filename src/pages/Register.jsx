// src/pages/Register.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Select, Card, Alert } from '../components/common/UI'

const DISTRICTS = ['Ilala', 'Kigamboni', 'Kinondoni', 'Temeke', 'Ubungo']

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm]     = useState({
    full_name: '', email: '', password: '', confirm: '',
    phone: '', age: '', gender: '', district: '', ward: '',
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(field, value) { setForm(p => ({ ...p, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
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
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed.')
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
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            display: 'inline-block', background: 'var(--clr-accent-lt)',
            color: 'var(--clr-accent)', padding: '5px 16px',
            borderRadius: '99px', fontSize: '12px', fontWeight: 700,
            marginBottom: 'var(--space-3)', letterSpacing: '.5px',
          }}>PREMIUM ACCOUNT</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--clr-text-2)' }}>
            Save your advisory history and track your business decisions over time.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Alert type="error" message={error} />

            {/* Required fields */}
            <Input label="Full name" name="full_name" value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="e.g. Amina Salim" required />
            <Input label="Email address" name="email" type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="you@example.com" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input label="Password" name="password" type="password" value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 8 characters" required />
              <Input label="Confirm password" name="confirm" type="password" value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                placeholder="Repeat password" required />
            </div>

            {/* Optional profile fields */}
            <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', fontWeight: 600, marginTop: 'var(--space-2)' }}>
              OPTIONAL — helps personalise your reports
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input label="Phone" name="phone" type="tel" value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="+255 7XX XXX XXX" />
              <Input label="Age" name="age" type="number" value={form.age}
                onChange={e => set('age', e.target.value)} placeholder="e.g. 28" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Select label="Gender" name="gender" value={form.gender}
                onChange={e => set('gender', e.target.value)}
                options={[
                  { value: '', label: 'Prefer not to say' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]} />
              <Select label="Your district" name="district" value={form.district}
                onChange={e => set('district', e.target.value)}
                options={[
                  { value: '', label: 'Select...' },
                  ...DISTRICTS.map(d => ({ value: d, label: d }))
                ]} />
            </div>
            <Input label="Ward" name="ward" value={form.ward}
              onChange={e => set('ward', e.target.value)} placeholder="e.g. Bonyokwa" />

            <Button type="submit" variant="accent" fullWidth loading={loading}
              style={{ marginTop: 'var(--space-2)' }}>
              Create Account
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: '14px', color: 'var(--clr-text-2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
