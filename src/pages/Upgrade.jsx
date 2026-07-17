// src/pages/Upgrade.jsx
// Pricing page — shown to regular users who want to go Premium
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userAPI } from '../services/api'
import { Alert } from '../components/common/UI'

const ACCENT = '#E8A838'
const TEAL   = '#0D6E6E'

const FEATURES_FREE = [
  'Instant business viability scFursag',
  'Path A & Path B advice',
  'District-level analysis',
  'Based on 64,000+ real enterprises',
]

const FEATURES_PREMIUM = [
  'Everything in Free',
  'Powered by Fursa LoNet 2.5 — faster & sharper model',
  'Higher prediction accuracy',
  'Full advisory history saved',
  'Ward-level micro analysis',
  'Priority support',
  'Early access to new features',
]

export default function Upgrade() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [plan, setPlan]       = useState('monthly') // 'monthly' | 'yearly'
  const [step, setStep]       = useState('pricing') // 'pricing' | 'payment' | 'success'
  const [method, setMethod]   = useState('mpesa')   // 'mpesa' | 'card'
  const [form, setForm]       = useState({ phone: '', ref: '', card_no: '', expiry: '', cvv: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const price = plan === 'monthly' ? '$10' : '$100'
  const priceSub = plan === 'monthly' ? 'per month' : 'per year — save $20'

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handlePay(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const ref = method === 'mpesa'
        ? `MPESA-${form.phone}-${Date.now()}`
        : `CARD-${form.card_no.slice(-4)}-${Date.now()}`

      const { data } = await userAPI.upgrade({
        amount_tzs:     plan === 'monthly' ? 25000 : 250000,
        payment_method: method,
        reference_no:   ref,
      })

      // Update local user state to premium
      updateUser({ tier: 'premium' })
      localStorage.setItem('access_token', data.access_token)
      setStep('success')
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }} className="animate-fadeUp">
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 12 }}>
            Welcome to Premium!
          </h1>
          <p style={{ color: 'var(--clr-text-2)', lineHeight: 1.7, marginBottom: 32 }}>
            You're now on <strong>Fursa LoNet 2.5</strong> — our fastest, sharpest model.
            Your advice just got a serious upgrade.
          </p>
          <button
            onClick={() => navigate('/advisor')}
            style={{
              background: TEAL, color: '#fff', fontWeight: 700,
              fontSize: '1rem', padding: '13px 40px', borderRadius: 999,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(13,110,110,0.30)',
            }}
          >Go to Advisor →</button>
        </div>
      </div>
    )
  }

  // ── Payment form ──────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 460 }} className="animate-fadeUp">

          {/* Back */}
          <button onClick={() => setStep('pricing')} style={{
            background: 'none', border: 'none', color: 'var(--clr-primary)',
            fontWeight: 600, cursor: 'pointer', fontSize: 14, marginBottom: 24,
            padding: 0,
          }}>← Back to plans</button>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', marginBottom: 8 }}>
              Complete your upgrade
            </h2>
            <div style={{
              display: 'inline-block', background: 'var(--clr-accent-lt)',
              color: 'var(--clr-accent)', padding: '5px 16px',
              borderRadius: 999, fontSize: 13, fontWeight: 700,
            }}>
              {price} / {plan === 'monthly' ? 'month' : 'year'}
            </div>
          </div>

          {/* Method tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[['mpesa', '📱 M-Pesa'], ['card', '💳 Card']].map(([k, label]) => (
              <button key={k} onClick={() => setMethod(k)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                border: `2px solid ${method === k ? TEAL : 'var(--clr-border)'}`,
                background: method === k ? 'var(--clr-primary-lt)' : 'var(--clr-card)',
                color: method === k ? TEAL : 'var(--clr-text-2)',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                transition: 'all .15s ease',
              }}>{label}</button>
            ))}
          </div>

          <div style={{
            background: 'var(--clr-card)', borderRadius: 16,
            padding: '28px 24px', border: '1px solid var(--clr-border)',
          }}>
            <Alert type="error" message={error} />

            <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {method === 'mpesa' ? (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text-2)', display: 'block', marginBottom: 6 }}>
                      M-Pesa Phone Number
                    </label>
                    <input
                      required value={form.phone}
                      onChange={e => setF('phone', e.target.value)}
                      placeholder="+255 7XX XXX XXX"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text-2)', display: 'block', marginBottom: 6 }}>
                      Transaction Reference (after paying)
                    </label>
                    <input
                      required value={form.ref}
                      onChange={e => setF('ref', e.target.value)}
                      placeholder="e.g. QHK2X3AB7F"
                      style={inputStyle}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--clr-text-3)', lineHeight: 1.6 }}>
                    Send <strong>{plan === 'monthly' ? 'TZS 25,000' : 'TZS 250,000'}</strong> to <strong>+255 XXX XXX XXX</strong> via M-Pesa,
                    then enter the confirmation code above.
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text-2)', display: 'block', marginBottom: 6 }}>
                      Name on Card
                    </label>
                    <input required value={form.name} onChange={e => setF('name', e.target.value)}
                      placeholder="John Doe" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text-2)', display: 'block', marginBottom: 6 }}>
                      Card Number
                    </label>
                    <input required value={form.card_no} onChange={e => setF('card_no', e.target.value)}
                      placeholder="1234 5678 9012 3456" maxLength={19} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text-2)', display: 'block', marginBottom: 6 }}>Expiry</label>
                      <input required value={form.expiry} onChange={e => setF('expiry', e.target.value)}
                        placeholder="MM/YY" maxLength={5} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text-2)', display: 'block', marginBottom: 6 }}>CVV</label>
                      <input required value={form.cvv} onChange={e => setF('cvv', e.target.value)}
                        placeholder="123" maxLength={3} style={inputStyle} />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  marginTop: 8,
                  background: loading ? 'var(--clr-border)' : ACCENT,
                  color: '#1a0f00', fontWeight: 700, fontSize: '0.95rem',
                  padding: '13px 0', borderRadius: 999, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
                  transition: 'background .18s ease',
                }}
              >{loading ? 'Processing…' : `Confirm & Upgrade — ${price}`}</button>
            </form>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--clr-text-3)', marginTop: 16 }}>
            Demo mode — no real charges. Cancel anytime.
          </p>
        </div>
      </div>
    )
  }

  // ── Pricing screen ────────────────────────────────────────────
  return (
    <div style={{ padding: '64px 24px', background: 'var(--clr-bg)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.7px',
            textTransform: 'uppercase', color: TEAL, marginBottom: 10 }}>
            Upgrade
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,2.6rem)',
            color: 'var(--clr-text)', lineHeight: 1.15, marginBottom: 14 }}>
            Unlock Fursa LoNet 2.5
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-2)', maxWidth: 500, margin: '0 auto' }}>
            Our fastest, sharpest model — trained on 64,000+ Dar es Salaam enterprises
            with higher accuracy and ward-level precision.
          </p>
        </div>

        {/* Plan toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', gap: 4, padding: 4,
            background: 'var(--clr-bg-2)', borderRadius: 999,
            border: '1px solid var(--clr-border)',
          }}>
            {[['monthly', 'Monthly'], ['yearly', 'Yearly — save $20']].map(([k, label]) => (
              <button key={k} onClick={() => setPlan(k)} style={{
                padding: '8px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: plan === k ? TEAL : 'transparent',
                color: plan === k ? '#fff' : 'var(--clr-text-2)',
                transition: 'all .18s ease',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24, marginBottom: 48,
        }}>

          {/* Free card */}
          <div style={{
            background: 'var(--clr-card)', borderRadius: 20,
            border: '1.5px solid var(--clr-border)',
            padding: '32px 28px',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.5px',
              textTransform: 'uppercase', color: 'var(--clr-text-3)', marginBottom: 8 }}>Free</p>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem',
              color: 'var(--clr-text)', marginBottom: 4 }}>$0</div>
            <p style={{ fontSize: 13, color: 'var(--clr-text-3)', marginBottom: 28 }}>forever</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {FEATURES_FREE.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--clr-text-2)' }}>
                  <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>

            <button disabled style={{
              width: '100%', padding: '12px 0', borderRadius: 999,
              background: 'var(--clr-bg-2)', color: 'var(--clr-text-3)',
              border: '1.5px solid var(--clr-border)', fontWeight: 600, fontSize: 14,
              cursor: 'not-allowed',
            }}>
              {user ? 'Current Plan' : 'Get Started Free'}
            </button>
          </div>

          {/* Premium card */}
          <div style={{
            background: `linear-gradient(145deg, #0D3D3D 0%, #0a2a2a 100%)`,
            borderRadius: 20,
            border: `2px solid ${ACCENT}`,
            padding: '32px 28px',
            position: 'relative',
            boxShadow: `0 8px 32px rgba(232,168,56,0.20)`,
          }}>
            {/* Badge */}
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              background: ACCENT, color: '#1a0f00', fontSize: 11, fontWeight: 800,
              padding: '4px 16px', borderRadius: 999, letterSpacing: '.5px',
              whiteSpace: 'nowrap',
            }}>MOST POPULAR</div>

            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.5px',
              textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>Premium</p>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem',
              color: '#fff', marginBottom: 4 }}>{price}</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>{priceSub}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {FEATURES_PREMIUM.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                  <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>

            <button
              onClick={() => user ? setStep('payment') : navigate('/register')}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 999,
                background: ACCENT, color: '#1a0f00',
                border: 'none', fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(232,168,56,0.40)',
                transition: 'filter .18s ease',
              }}
              onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.08)'}
              onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {user ? `Upgrade Now — ${price}` : 'Sign Up to Upgrade'}
            </button>
          </div>
        </div>

        {/* LoNet 2.5 info */}
        <div style={{
          background: 'var(--clr-card)', borderRadius: 16,
          border: '1px solid var(--clr-border)',
          padding: '32px 28px', textAlign: 'center',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem',
            color: 'var(--clr-text)', marginBottom: 12 }}>
            What is Fursa LoNet 2.5?
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--clr-text-2)', lineHeight: 1.75,
            maxWidth: 620, margin: '0 auto' }}>
            LoNet 2.5 is Fursa's second-generation prediction model — retrained on a larger,
            cleaner dataset with improved feature engineering and ensemble methods.
            It delivers faster responses, sharper probability estimates, and ward-level
            granularity that the standard model doesn't have. Premium users get every query
            routed through LoNet 2.5 automatically.
          </p>
        </div>

      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid var(--clr-border)',
  background: 'var(--clr-bg)', color: 'var(--clr-text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--font-body)',
}
