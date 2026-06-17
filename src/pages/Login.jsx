// src/pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Card, Alert } from '../components/common/UI'

export default function Login() {
  const { login }  = useAuth()
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
      setError(err.response?.data?.error || 'Login failed. Check your email and password.')
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
            Welcome back
          </h1>
          <p style={{ color: 'var(--clr-text-2)' }}>
            Log in to access your Premium history and reports.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Alert type="error" message={error} />

            <Input
              label="Email address" name="email" type="email"
              value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="you@example.com" required
            />
            <Input
              label="Password" name="password" type="password"
              value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="Your password" required
            />

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Log in
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: '14px', color: 'var(--clr-text-2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Sign up for Premium</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontSize: '14px' }}>
          <Link to="/advisor">Continue without an account →</Link>
        </p>
      </div>
    </div>
  )
}
