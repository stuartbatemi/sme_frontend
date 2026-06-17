/* src/components/common/UI.jsx — Reusable components, theme-aware */
import React from 'react'

export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = false,
  onClick, type = 'button', style = {}, className = ''
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', borderRadius: 'var(--radius-sm)', fontWeight: 600,
    border: 'none', transition: 'var(--transition)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
  }
  const variants = {
    primary:   { background: 'var(--clr-primary)',    color: '#fff', boxShadow: '0 2px 8px rgba(13,110,110,0.25)' },
    secondary: { background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)' },
    accent:    { background: 'var(--clr-accent)',      color: '#fff', boxShadow: '0 2px 8px rgba(232,168,56,0.30)' },
    ghost:     { background: 'transparent', color: 'var(--clr-primary)', border: '1.5px solid var(--clr-primary)' },
    danger:    { background: 'var(--clr-danger)',      color: '#fff' },
    subtle:    { background: 'var(--clr-bg-2)',        color: 'var(--clr-text-2)', border: '1px solid var(--clr-border)' },
  }
  const sizes = {
    xs: { padding: '4px 10px', fontSize: '12px' },
    sm: { padding: '6px 14px', fontSize: '13px' },
    md: { padding: '10px 22px', fontSize: '15px' },
    lg: { padding: '14px 32px', fontSize: '16px' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={className}
      style={{ ...base, ...variants[variant], ...sizes[size], ...style }}>
      {loading && <Spinner size={15} color="currentColor" />}
      {children}
    </button>
  )
}

export function Input({
  label, name, type = 'text', value, onChange,
  placeholder, error, required = false, hint = '',
  min, max, step
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label htmlFor={name} style={{ fontWeight: 600, fontSize: '13px', color: 'var(--clr-text-2)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
          {label}{required && <span style={{ color: 'var(--clr-danger)' }}> *</span>}
        </label>
      )}
      <input
        id={name} name={name} type={type} value={value}
        onChange={onChange} placeholder={placeholder}
        required={required} min={min} max={max} step={step}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${error ? 'var(--clr-danger)' : 'var(--clr-border)'}`,
          fontSize: '15px', outline: 'none', transition: 'border-color var(--transition)',
          background: 'var(--clr-card)', color: 'var(--clr-text)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--clr-primary)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--clr-danger)' : 'var(--clr-border)'}
      />
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
          width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${error ? 'var(--clr-danger)' : 'var(--clr-border)'}`,
          fontSize: '15px', background: 'var(--clr-card)', color: 'var(--clr-text)', cursor: 'pointer',
          outline: 'none',
        }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint  && <p style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>{hint}</p>}
      {error && <p style={{ fontSize: '12px', color: 'var(--clr-danger)' }}>{error}</p>}
    </div>
  )
}

export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--clr-card)', borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--clr-border)',
      padding: 'var(--space-6)', ...style,
    }}>{children}</div>
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

export function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 'var(--space-2) 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--clr-border)' }} />
      {label && <span style={{ fontSize: '12px', color: 'var(--clr-text-3)', whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: 'var(--clr-border)' }} />
    </div>
  )
}
