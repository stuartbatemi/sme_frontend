// src/services/api.js
// ALL network calls live here. Components never call fetch/axios directly.
// This makes it easy to update URLs or add auth headers in one place.

import axios from 'axios'

const node = axios.create({
  baseURL: '/api',   // proxied to http://localhost:5000/api via vite.config.js
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
        const { data } = await axios.post('/api/auth/refresh', { refresh_token })
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
}

// ── Advisory (predictions) ────────────────────────────────────────
export const advisoryAPI = {
  predict: (payload) => node.post('/advisory/predict', payload),
  history: (page = 1, limit = 10) =>
    node.get(`/advisory/history?page=${page}&limit=${limit}`),
  getSession: (id) => node.get(`/advisory/history/${id}`),
}

// ── User ──────────────────────────────────────────────────────────
export const userAPI = {
  me:      ()     => node.get('/user/me'),
  update:  (data) => node.patch('/user/me', data),
  upgrade: (data) => node.post('/user/upgrade', data),
  stats:   ()     => node.get('/user/stats'),
}

// ── FastAPI direct (districts + activities list) ──────────────────
const fastapi = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
})

export const modelAPI = {
  districts:  () => fastapi.get('/districts'),
  activities: (sector) =>
    fastapi.get('/activities', sector ? { params: { sector } } : {}),
}
