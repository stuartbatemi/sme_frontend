// src/components/common/TurnstileWidget.jsx
//
// Cloudflare Turnstile — free, privacy-friendlier bot verification than
// reCAPTCHA (no ad-tracking data sent to Google), and usually invisible
// to real users rather than a click-the-traffic-lights puzzle. Used on
// sign-up to keep accounts genuine per the Terms of Service's
// acceptable-use section.
//
// Uses Turnstile's *explicit* rendering API (window.turnstile.render)
// rather than the implicit data-sitekey-div approach, since explicit
// rendering plays much more predictably with React's render/unmount
// cycle (including StrictMode's double-invoke in development).
import React, { useEffect, useRef, useState } from 'react'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
let scriptLoadingPromise = null

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (scriptLoadingPromise) return scriptLoadingPromise
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
  return scriptLoadingPromise
}

export default function TurnstileWidget({ siteKey, onVerify, onExpire, onError, theme = 'auto' }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!siteKey) {
      // No site key configured (e.g. local dev without env vars set) —
      // fail open with a visible notice rather than blocking sign-up
      // entirely, since this is an academic project, not a production
      // system where fail-closed would be the safer default.
      setLoadError(true)
      return
    }

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token) => onVerify?.(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onError?.(),
        })
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch { /* already gone */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  if (loadError) {
    return (
      <div style={{
        fontSize: 12.5, color: 'var(--clr-text-3)',
        padding: '8px 0',
      }}>
        Bot verification is unavailable right now — sign-up may be rejected server-side if configured to require it.
      </div>
    )
  }

  return <div ref={containerRef} />
}
