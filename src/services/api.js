// src/services/api.js
// ALL network calls live here. Components never call fetch/axios directly.
// This makes it easy to update URLs or add auth headers in one place.

import axios from 'axios'

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const node = axios.create({
  baseURL: RAW_API_URL ? `${RAW_API_URL}/api` : '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Auto-attach JWT token to every Node request if logged in
node.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
node.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh_token = localStorage.getItem('refresh_token')
        if (!refresh_token) throw new Error('No refresh token')
        const { data } = await axios.post(`${RAW_API_URL}/api/auth/refresh`, { refresh_token })
        localStorage.setItem('access_token', data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return node(original)
      } catch (_) {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => node.post('/auth/register', data),
  login:    (data) => node.post('/auth/login', data),
  logout:   ()     => node.post('/auth/logout', {
    refresh_token: localStorage.getItem('refresh_token')
  }),
  forgotPassword:  (payload) => node.post('/auth/forgot-password', payload),
  resetPasswordOtp:  (data) => node.post('/auth/reset-password/otp', data),
  resetPasswordLink: (data) => node.post('/auth/reset-password/link', data),
}

// ── Advisory (predictions) ────────────────────────────────────────
export const advisoryAPI = {
  predict: (payload) => node.post('/advisory/predict', payload),
  history: (page = 1, limit = 10) =>
    node.get(`/advisory/history?page=${page}&limit=${limit}`),
  getSession: (id) => node.get(`/advisory/history/${id}`),
  experienceSearch: (q) =>
    node.get('/advisory/experience-search', q ? { params: { q } } : {}),
}

// ── AI Consultant (Groq-backed "why this will/won't work" explainer) ─
// Longer per-request timeout than the shared default: this endpoint now
// runs an agentic web-search tool loop (real competitor lookups) before
// the backend even calls Groq's completion, which is meaningfully
// slower than a plain chat call.
export const consultantAPI = {
  analyze: (payload) => node.post('/consultant/analyze', payload, { timeout: 45000 }),
}

// ── Microfinance (loan-path reference list) ─────────────────────────
export const microfinanceAPI = {
  list: (riskTier, lang = 'en') => node.get('/microfinance', { params: { risk_tier: riskTier, lang } }),
}

// ── User ──────────────────────────────────────────────────────────
export const userAPI = {
  me:      ()     => node.get('/user/me'),
  update:  (data) => node.patch('/user/me', data),
  upgrade: (data) => node.post('/user/upgrade', data),
  stats:   ()     => node.get('/user/stats'),
}

// ── Model reference data (districts, sectors, skills, hobbies,
// activities) — proxied through the Node backend (see routes/advisory.js),
// NOT called directly from the browser. Calling FastAPI directly from
// the client would require it to be publicly reachable with CORS
// configured for this origin, and would leak its URL; the Node proxy
// already exists, is cached server-side, and keeps the model service
// private.
export const modelAPI = {
  districts:  () => node.get('/advisory/districts'),
  sectors:    (lang = 'en') => node.get('/advisory/sectors', { params: { lang } }),
  skills:     (lang = 'en') => node.get('/advisory/skills', { params: { lang } }),
  hobbies:    (lang = 'en') => node.get('/advisory/hobbies', { params: { lang } }),
  activities: (sector, lang = 'en') =>
    node.get('/advisory/activities', { params: { ...(sector ? { sector } : {}), lang } }),
}
