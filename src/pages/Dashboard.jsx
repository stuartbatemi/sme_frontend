// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { advisoryAPI, userAPI } from '../services/api'
import { Card, Badge, Button, Spinner, Alert } from '../components/common/UI'

export default function Dashboard() {
  const { user, isPremium, logout } = useAuth()
  const navigate = useNavigate()

  const [tab,      setTab]      = useState('history')
  const [sessions, setSessions] = useState([])
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [page,     setPage]     = useState(1)
  const [pagination, setPagination] = useState({})

  // Redirect non-premium users
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!isPremium) { navigate('/advisor'); return }
    loadData()
  }, [user, isPremium])

  useEffect(() => { if (tab === 'history') loadHistory() }, [page])

  async function loadData() {
    setLoading(true)
    await Promise.all([loadHistory(), loadStats()])
    setLoading(false)
  }

  async function loadHistory() {
    try {
      const { data } = await advisoryAPI.history(page, 8)
      setSessions(data.sessions)
      setPagination(data.pagination)
    } catch { setError('Failed to load history.') }
  }

  async function loadStats() {
    try {
      const { data } = await userAPI.stats()
      setStats(data)
    } catch { /* stats are optional */ }
  }

  const fmt = (n) => n ? Number(n).toLocaleString() : '—'
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'var(--space-16)' }}>
      <Spinner size={40} />
    </div>
  )

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 4 }}>
          Welcome back, {user?.full_name?.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--clr-text-2)' }}>
          Your Premium advisory dashboard
          <span style={{
            marginLeft: 10, background: 'var(--clr-accent-lt)', color: 'var(--clr-accent)',
            fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
          }}>PREMIUM</span>
        </p>
      </div>

      {/* Stats overview */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--space-4)', marginBottom: 'var(--space-8)',
        }}>
          <StatCard label="Total Sessions"    value={stats.total_sessions || 0} />
          <StatCard label="Avg Monthly Profit" value={`TZS ${fmt(stats.avg_monthly_profit)}`} />
          <StatCard label="Avg ROI / year"     value={`${parseFloat(stats.avg_roi || 0).toFixed(1)}%`} />
          <StatCard label="High Chance Hits"   value={stats.high_count || 0} accent />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--clr-border)', marginBottom: 'var(--space-6)' }}>
        {['history', 'profile'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: 'var(--space-3) var(--space-2)',
            border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '14px',
            color: tab === t ? 'var(--clr-primary)' : 'var(--clr-text-2)',
            borderBottom: tab === t ? '2px solid var(--clr-primary)' : '2px solid transparent',
            textTransform: 'capitalize',
          }}>
            {t === 'history' ? '📋 Advisory History' : '👤 My Profile'}
          </button>
        ))}
      </div>

      {/* History tab */}
      {tab === 'history' && (
        <div>
          <Alert type="error" message={error} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <Button variant="primary" size="sm" onClick={() => navigate('/advisor')}>
              + New Advisory Session
            </Button>
          </div>

          {sessions.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>📋</p>
              <p style={{ color: 'var(--clr-text-2)', marginBottom: 'var(--space-4)' }}>
                No advisory sessions yet. Run your first query to see it here.
              </p>
              <Button variant="primary" onClick={() => navigate('/advisor')}>
                Get Advice Now
              </Button>
            </Card>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {sessions.map(s => (
                  <Card key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                      background: s.path_type === 'A' ? 'var(--clr-primary-lt)' : 'var(--clr-accent-lt)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', flexShrink: 0,
                    }}>
                      {s.path_type === 'A' ? '🎯' : '💡'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: 2 }}>
                        {s.business_idea || (s.path_type === 'B' ? 'Business Suggestion Query' : 'Business Idea Check')}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--clr-text-3)' }}>
                        {s.district}{s.ward ? ` · ${s.ward}` : ''} · {fmtDate(s.created_at)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {s.success_chance && <Badge label={s.success_chance} />}
                      {s.monthly_profit && (
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-primary)' }}>
                          TZS {fmt(s.monthly_profit)}/mo
                        </span>
                      )}
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                        borderRadius: '99px', background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)',
                      }}>Path {s.path_type}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                  <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                  <span style={{ alignSelf: 'center', fontSize: '14px', color: 'var(--clr-text-2)' }}>
                    Page {page} of {pagination.pages}
                  </span>
                  <Button variant="ghost" size="sm" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Profile tab */}
      {tab === 'profile' && (
        <div style={{ maxWidth: 480 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <ProfileRow label="Full name"  value={user?.full_name} />
            <ProfileRow label="Email"      value={user?.email} />
            <ProfileRow label="Phone"      value={user?.phone || '—'} />
            <ProfileRow label="Age"        value={user?.age || '—'} />
            <ProfileRow label="Gender"     value={user?.gender || '—'} />
            <ProfileRow label="District"   value={user?.district || '—'} />
            <ProfileRow label="Ward"       value={user?.ward || '—'} />
            <ProfileRow label="Account type" value="Premium" highlight />
            <ProfileRow label="Member since" value={user?.created_at ? fmtDate(user.created_at) : '—'} />
          </Card>

          <Button
            variant="ghost" size="sm"
            style={{ marginTop: 'var(--space-4)', color: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }}
            onClick={async () => { await logout(); navigate('/') }}
          >
            Log out
          </Button>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <Card style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '1.6rem',
        color: accent ? 'var(--clr-success)' : 'var(--clr-primary)',
        marginBottom: 4,
      }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 600 }}>{label.toUpperCase()}</div>
    </Card>
  )
}

function ProfileRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--space-3)' }}>
      <span style={{ fontSize: '14px', color: 'var(--clr-text-2)', fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: '14px', fontWeight: 600,
        color: highlight ? 'var(--clr-accent)' : 'var(--clr-text)',
      }}>{value}</span>
    </div>
  )
}
