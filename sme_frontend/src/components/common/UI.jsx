/* src/components/common/UI.jsx — Reusable components, theme-aware */
import React from 'react'

export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false,
  onClick, type = 'button', style = {}, className = ''
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', borderRadius: 'var(--radius-lg)', fontWeight: 600,
    border: 'none', transition: 'var(--transition)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
  }
  // Claymorphic surfaces: a puffy, molded look (var(--clay-raised) via
  // .clay-btn class) replaces flat drop-shadows. Color variants now only
  // set background/text — the clay shadow does the lifting visually.
  const variants = {
    primary:   { background: 'var(--clr-primary)',    color: '#fff' },
    secondary: { background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)' },
    accent:    { background: 'var(--clr-accent)',      color: '#fff' },
    ghost:     { background: 'var(--clr-card)', color: 'var(--clr-primary)' },
    danger:    { background: 'var(--clr-danger)',      color: '#fff' },
    subtle:    { background: 'var(--clr-bg-2)',        color: 'var(--clr-text-2)' },
  }
  const sizes = {
    xs: { padding: '4px 10px', fontSize: '12px' },
    sm: { padding: '6px 14px', fontSize: '13px' },
    md: { padding: '10px 22px', fontSize: '15px' },
    lg: { padding: '14px 32px', fontSize: '16px' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`clay-btn ${className}`}
      style={{ ...base, ...variants[variant], ...sizes[size], ...style }}>
      {loading && <Spinner size={15} color="currentColor" />}
      {children}
    </button>
  )
}

export function Input({
  label, name, type = 'text', value, onChange,
  placeholder, error, required = false, hint = '',
  min, max, step, prefix, inputMode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label htmlFor={name} style={{ fontWeight: 600, fontSize: '13px', color: 'var(--clr-text-2)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
          {label}{required && <span style={{ color: 'var(--clr-danger)' }}> *</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: '15px', fontWeight: 600, color: 'var(--clr-text-3)', pointerEvents: 'none',
          }}>
            {prefix}
          </span>
        )}
        <input
          id={name} name={name} type={type} value={value}
          onChange={onChange} placeholder={placeholder}
          required={required} min={min} max={max} step={step} inputMode={inputMode}
          style={{
            width: '100%', padding: prefix ? '11px 14px 11px 52px' : '11px 14px', borderRadius: 'var(--radius-md)',
            border: error ? '1.5px solid var(--clr-danger)' : 'none',
            boxShadow: error ? 'var(--clay-pressed)' : 'var(--clay-inset)',
            fontSize: '15px', outline: 'none', transition: 'box-shadow var(--transition)',
            background: 'var(--clr-bg)', color: 'var(--clr-text)', boxSizing: 'border-box',
          }}
          onFocus={e => { if (!error) e.target.style.boxShadow = 'var(--clay-pressed)' }}
          onBlur={e => { if (!error) e.target.style.boxShadow = 'var(--clay-inset)' }}
        />
      </div>
      {hint  && <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', lineHeight: 1.4 }}>{hint}</p>}
      {error && <p style={{ fontSize: '12px', color: 'var(--clr-danger)' }}>{error}</p>}
    </div>
  )
}

export function Select({ label, name, value, onChange, options = [], error, required = false, hint = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label htmlFor={name} style={{ fontWeight: 600, fontSize: '13px', color: 'var(--clr-text-2)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
          {label}{required && <span style={{ color: 'var(--clr-danger)' }}> *</span>}
        </label>
      )}
      <select id={name} name={name} value={value} onChange={onChange} required={required}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)',
          border: error ? '1.5px solid var(--clr-danger)' : 'none',
          boxShadow: error ? 'var(--clay-pressed)' : 'var(--clay-inset)',
          fontSize: '15px', background: 'var(--clr-bg)', color: 'var(--clr-text)', cursor: 'pointer',
          outline: 'none',
        }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint  && <p style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>{hint}</p>}
      {error && <p style={{ fontSize: '12px', color: 'var(--clr-danger)' }}>{error}</p>}
    </div>
  )
}

export function Card({ children, style = {}, className = '', ...rest }) {
  return (
    <div className={`clay-card ${className}`} style={{
      background: 'var(--clr-card)', borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)', ...style,
    }} {...rest}>{children}</div>
  )
}

export function Spinner({ size = 24, color = 'var(--clr-primary)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2.5px solid ${color}30`,
      borderTop: `2.5px solid ${color}`,
      borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

export function Badge({ label }) {
  const map = {
    High:    { bg: 'var(--clr-success-lt)', color: 'var(--clr-success)' },
    Medium:  { bg: 'var(--clr-warning-lt)', color: 'var(--clr-warning)' },
    Low:     { bg: 'var(--clr-danger-lt)',  color: 'var(--clr-danger)'  },
    premium: { bg: 'var(--clr-accent-lt)',  color: 'var(--clr-accent)'  },
  }
  const c = map[label] || { bg: 'var(--clr-primary-lt)', color: 'var(--clr-primary)' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
      fontSize: '12px', fontWeight: 700, letterSpacing: '.4px',
      background: c.bg, color: c.color,
    }}>{label}</span>
  )
}

// ── pH-style intensity scale for High / Medium / Low tiers ─────────
// Low = red (weak), Medium = amber (moderate), High = green (strong) —
// same visual language as a pH strip, so intensity reads at a glance.
const TIER_SCALE = [
  { value: 'Low',    color: '#E03131', bg: '#FDECEA' },
  { value: 'Medium', color: '#E8A838', bg: '#FEF6E7' },
  { value: 'High',   color: '#2F9E44', bg: '#E9F9EF' },
]

function tierMeta(label) {
  return TIER_SCALE.find(t => label && label.startsWith(t.value)) || null
}

// Small read-only chip: colored dot + label, tinted to match its tier.
export function TierBadge({ label }) {
  const t = tierMeta(label)
  if (!t) return <Badge label={label} />
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px 3px 8px', borderRadius: '99px',
      fontSize: '12px', fontWeight: 700, letterSpacing: '.4px',
      background: t.bg, color: t.color,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, boxShadow: `0 0 0 3px ${t.color}22` }} />
      {label}
    </span>
  )
}

// Selectable pH-strip dropdown — used to filter a list by tier.
// value: '' | 'Low' | 'Medium' | 'High'. Pass allLabel to customize the
// "no filter" option text.
export function TierSelect({ value, onChange, allLabel = 'All levels' }) {
  const [open, setOpen] = React.useState(false)
  const options = [{ value: '', color: 'var(--clr-text-3)' }, ...TIER_SCALE]
  const current = TIER_SCALE.find(t => t.value === value)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
      )}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
          borderRadius: '999px', border: '1.5px solid var(--clr-border)',
          background: 'var(--clr-card)', cursor: 'pointer', fontSize: '12px',
          fontWeight: 700, color: current ? current.color : 'var(--clr-text-2)',
        }}>
        {/* mini pH strip — full-intensity segment marks the active tier */}
        <span style={{ display: 'flex', width: 34, height: 8, borderRadius: 4, overflow: 'hidden' }}>
          {TIER_SCALE.map(t => (
            <span key={t.value} style={{
              flex: 1, background: t.color,
              opacity: !current || current.value === t.value ? 1 : 0.25,
            }} />
          ))}
        </span>
        {current ? current.value : allLabel}
        <span style={{ fontSize: '9px', opacity: 0.7 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
          background: 'var(--clr-card)', border: '1px solid var(--clr-border)',
          borderRadius: '10px', boxShadow: '0 6px 20px rgba(0,0,0,.14)',
          padding: 6, minWidth: 140,
        }}>
          {options.map(o => (
            <div key={o.value || 'all'}
              onClick={() => { onChange(o.value); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 9px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: value === o.value ? 700 : 500,
                background: value === o.value ? 'var(--clr-primary-lt)' : 'transparent',
                color: value === o.value ? 'var(--clr-primary)' : 'var(--clr-text)',
              }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.color, flexShrink: 0 }} />
              {o.value || allLabel}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Alert({ type = 'error', message }) {
  if (!message) return null
  const map = {
    error:   { bg: 'var(--clr-danger-lt)',  border: 'var(--clr-danger)',  color: 'var(--clr-danger)'  },
    success: { bg: 'var(--clr-success-lt)', border: 'var(--clr-success)', color: 'var(--clr-success)' },
    warning: { bg: 'var(--clr-warning-lt)', border: 'var(--clr-warning)', color: 'var(--clr-warning)' },
    info:    { bg: 'var(--clr-primary-lt)', border: 'var(--clr-primary)', color: 'var(--clr-primary)' },
  }
  const c = map[type] || map.error
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, fontSize: '14px', fontWeight: 500,
    }}>{message}</div>
  )
}

// Simple accessible checkbox with a clickable label — used for consent
// checkboxes (terms/privacy acceptance, marketing opt-in) where the
// label often needs to contain links.
export function Checkbox({ checked, onChange, children, required = false, error = '' }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      cursor: 'pointer', fontSize: '13.5px', color: 'var(--clr-text-2)',
      lineHeight: 1.5,
    }}>
      <input
        type="checkbox"
        checked={checked}
        required={required}
        onChange={e => onChange(e.target.checked)}
        style={{
          marginTop: 2, width: 16, height: 16, flexShrink: 0,
          accentColor: 'var(--clr-primary)', cursor: 'pointer',
        }}
      />
      <span>
        {children}
        {error && (
          <div style={{ color: 'var(--clr-danger)', fontSize: 12, marginTop: 2 }}>{error}</div>
        )}
      </span>
    </label>
  )
}

export function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 'var(--space-2) 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--clr-border)' }} />
      {label && <span style={{ fontSize: '12px', color: 'var(--clr-text-3)', whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: 'var(--clr-border)' }} />
    </div>
  )
}
