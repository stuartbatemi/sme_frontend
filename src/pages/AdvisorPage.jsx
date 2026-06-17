// src/pages/AdvisorPage.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { advisoryAPI, modelAPI } from '../services/api'
import { Button, Input, Select, Card, Spinner, Alert, Badge, Divider } from '../components/common/UI'

const DISTRICTS = ['Ilala', 'Kigamboni', 'Kinondoni', 'Temeke', 'Ubungo']
const MIN_CAPITAL = 20000

const emptyForm = {
  path_type: '', business_idea: '', isic_detailed: null, activity_label: '',
  district: '', ward: '', village: '',
  capital_tzs: '', age: '', gender: '', top_n: 5,
}

export default function AdvisorPage() {
  const { user } = useAuth()

  const [step,      setStep]      = useState(0)
  const [form,      setForm]      = useState(emptyForm)
  const [matches,   setMatches]   = useState([])
  const [searching, setSearching] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')
  const [capError,  setCapError]  = useState('')

  // Pre-fill from user profile if logged in
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        age:      user.age      ? String(user.age)      : prev.age,
        gender:   user.gender   ? user.gender           : prev.gender,
        district: user.district ? user.district         : prev.district,
        ward:     user.ward     ? user.ward             : prev.ward,
      }))
    }
  }, [user])

  function set(field, value) { setForm(p => ({ ...p, [field]: value })) }

  function validateCapital(val) {
    if (!val) { setCapError(''); return true }
    const n = parseFloat(val)
    if (isNaN(n) || n < MIN_CAPITAL) {
      setCapError(`Minimum startup capital is TZS ${MIN_CAPITAL.toLocaleString()}`)
      return false
    }
    setCapError('')
    return true
  }

  // ── Activity search ───────────────────────────────────────────────
  async function searchActivities() {
    if (!form.business_idea.trim()) return
    setSearching(true); setMatches([]); setError('')
    try {
      const { data } = await modelAPI.activities()
      const words = form.business_idea.toLowerCase().split(/\s+/)
      const scored = data.activities
        .map(a => ({
          ...a,
          score: words.reduce((s, w) => s + (a.MainActivityDescription.toLowerCase().includes(w) ? 1 : 0), 0),
        }))
        .filter(a => a.score > 0)
        .sort((a, b) => b.score - a.score || b.Count - a.Count)
        .slice(0, 8)
      setMatches(scored)
      if (!scored.length) setError('No matches found. Try simpler words like "food", "clothes", "repair".')
    } catch {
      setError('Could not reach the model server. Make sure it is running on port 8000.')
    } finally { setSearching(false) }
  }

  function selectActivity(act) {
    set('isic_detailed', act.ISIC_Detailed)
    set('activity_label', act.MainActivityDescription)
    setMatches([])
    submitPrediction({ ...form, isic_detailed: act.ISIC_Detailed, activity_label: act.MainActivityDescription })
  }

  // ── Submit ────────────────────────────────────────────────────────
  async function submitPrediction(overrides = {}) {
    const f = { ...form, ...overrides }
    setLoading(true); setError(''); setResult(null); setStep(4)
    const payload = {
      path_type:     f.path_type,
      business_idea: f.business_idea || undefined,
      district:      f.district,
      ward:          f.ward    || undefined,
      village:       f.village || undefined,
      capital_tzs:   f.capital_tzs ? parseFloat(f.capital_tzs) : undefined,
      age:           f.age    ? parseInt(f.age)    : undefined,
      gender:        f.gender || undefined,
      ...(f.path_type === 'A'
        ? { isic_detailed: f.isic_detailed, workers: 1 }
        : { top_n: f.top_n || 5 }
      ),
    }
    try {
      const { data } = await advisoryAPI.predict(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Prediction failed. Please try again.')
      setStep(form.path_type === 'A' ? 3 : 2)
    } finally { setLoading(false) }
  }

  function reset() { setForm(emptyForm); setResult(null); setError(''); setMatches([]); setStep(0) }

  // ── Determine step count based on login state ─────────────────────
  // Logged-in users skip the personal details step (age/gender already known)
  const totalSteps = form.path_type === 'A' ? (user ? 2 : 3) : (user ? 2 : 3)
  const personalStep = user ? null : 2   // null means skip it

  function goFromLocation() {
    if (user) {
      // Skip personal step — go straight to idea search or submit
      if (form.path_type === 'A') setStep(3)
      else submitPrediction()
    } else {
      setStep(2)
    }
  }

  function goFromPersonal() {
    if (form.path_type === 'A') setStep(3)
    else submitPrediction()
  }

  return (
    <div style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: 680, margin: '0 auto' }}>

      {/* Step 0: Choose path */}
      {step === 0 && (
        <div className="animate-fadeUp">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: 'var(--space-2)' }}>
            {user ? `Hello ${user.full_name?.split(' ')[0]},` : 'Hello there,'}
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '1rem', marginBottom: 'var(--space-6)' }}>
            Welcome to SME Advisor. How can we help you today?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <PathCard icon="🎯" title="I have a business idea"
              desc="Check if your specific idea is likely to succeed in your area."
              onClick={() => { set('path_type','A'); setStep(1) }} />
            <PathCard icon="💡" title="Suggest me a business"
              desc="Get ranked business recommendations for your location and budget."
              onClick={() => { set('path_type','B'); setStep(1) }} />
          </div>
          {!user && (
            <p style={{ marginTop: 'var(--space-6)', fontSize: '13px', color: 'var(--clr-text-3)', textAlign: 'center' }}>
              <a href="/register">Create a Premium account</a> to save your advisory history.
            </p>
          )}
        </div>
      )}

      {/* Step 1: Location */}
      {step === 1 && (
        <StepCard title="Where is your business?" step={1} total={user ? 2 : 3} onBack={() => setStep(0)}>
          <Select label="District" name="district" value={form.district} required
            onChange={e => set('district', e.target.value)}
            options={[{ value: '', label: 'Select district...' }, ...DISTRICTS.map(d => ({ value: d, label: d }))]}
          />
          <Input label="Ward (optional)" name="ward" value={form.ward}
            onChange={e => set('ward', e.target.value)}
            placeholder="e.g. Bonyokwa — improves accuracy"
          />
          <Input label="Village / Area (optional)" name="village" value={form.village}
            onChange={e => set('village', e.target.value)} placeholder="e.g. Kitunda" />

          {user && (
            <Alert type="info" message={`Using your profile details: age ${user.age || 'not set'}, gender ${user.gender || 'not set'}. Update these in your Dashboard profile.`} />
          )}

          <Button variant="primary" fullWidth disabled={!form.district} onClick={goFromLocation}>
            {form.path_type === 'A' ? 'Continue →' : (user ? 'Get Recommendations →' : 'Continue →')}
          </Button>
        </StepCard>
      )}

      {/* Step 2: Personal details (guests only) */}
      {step === 2 && !user && (
        <StepCard title="Tell us about yourself" step={2} total={3} onBack={() => setStep(1)}>
          <Input label="Starting Capital (TZS)" name="capital_tzs" type="number"
            value={form.capital_tzs} min={MIN_CAPITAL}
            onChange={e => { set('capital_tzs', e.target.value); validateCapital(e.target.value) }}
            placeholder={`e.g. 500000 (min TZS ${MIN_CAPITAL.toLocaleString()})`}
            hint="Leave blank if unknown — we'll show the typical capital required."
            error={capError}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Age" name="age" type="number" value={form.age}
              onChange={e => set('age', e.target.value)} placeholder="e.g. 28" min={16} max={100} />
            <Select label="Gender" name="gender" value={form.gender}
              onChange={e => set('gender', e.target.value)}
              options={[{ value: '', label: 'Prefer not to say' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
            />
          </div>
          <Button variant="primary" fullWidth disabled={!!capError} onClick={goFromPersonal}>
            {form.path_type === 'A' ? 'Continue →' : 'Get Recommendations →'}
          </Button>
        </StepCard>
      )}

      {/* Step 2 for logged-in users who chose Path B and we call submit directly
          — this step is skipped (handled in goFromLocation).
          For logged-in Path A, we go to step 3 directly. */}

      {/* Step 3: Business idea search (Path A) */}
      {step === 3 && (
        <StepCard title="What is your business idea?" step={user ? 2 : 3} total={user ? 2 : 3} onBack={() => setStep(user ? 1 : 2)}>
          <Alert type="error" message={error} />
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input label="Describe your idea" name="business_idea" value={form.business_idea}
                onChange={e => set('business_idea', e.target.value)}
                placeholder='"bakery", "phone repair", "selling clothes"'
                hint="Type a keyword in English or Swahili and click Search."
              />
            </div>
            <Button variant="secondary" loading={searching} onClick={searchActivities}>Search</Button>
          </div>

          {matches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 700, letterSpacing: '.4px' }}>SELECT THE BEST MATCH:</p>
              {matches.map(m => (
                <button key={m.ISIC_Detailed} onClick={() => selectActivity(m)}
                  style={{
                    textAlign: 'left', padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)',
                    background: 'var(--clr-card)', cursor: 'pointer', transition: 'var(--transition)',
                    color: 'var(--clr-text)',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor='var(--clr-primary)'; e.currentTarget.style.background='var(--clr-primary-lt)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='var(--clr-border)'; e.currentTarget.style.background='var(--clr-card)' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{m.MainActivityDescription}</div>
                  <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: 2 }}>{m.Sector_Name}</div>
                </button>
              ))}
            </div>
          )}
        </StepCard>
      )}

      {/* Step 4: Result */}
      {step === 4 && (
        <div className="animate-fadeUp">
          {loading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
              <Spinner size={44} />
              <p style={{ marginTop: 'var(--space-4)', color: 'var(--clr-text-2)' }}>Analysing your business...</p>
            </div>
          )}
          {!loading && error && (
            <Card>
              <Alert type="error" message={error} />
              <Button style={{ marginTop: 'var(--space-4)' }} onClick={() => setStep(form.path_type==='A' ? 3 : (user ? 1 : 2))}>← Try again</Button>
            </Card>
          )}
          {!loading && result && (
            <>
              {form.path_type === 'A'
                ? <PathAResult result={result} activityLabel={form.activity_label} />
                : <PathBResult result={result} />
              }
              {result.saved && (
                <p style={{ textAlign:'center', marginTop:'var(--space-4)', fontSize:'13px', color:'var(--clr-success)' }}>
                  ✓ Saved to your Premium history.
                </p>
              )}
              <div style={{ textAlign:'center', marginTop:'var(--space-8)' }}>
                <Button variant="secondary" onClick={reset}>Start a new query</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Subcomponents ─────────────────────────────────────────────────

function PathCard({ icon, title, desc, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
      style={{
        textAlign: 'left', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)',
        border: `2px solid ${hov ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
        background: hov ? 'var(--clr-primary-lt)' : 'var(--clr-card)',
        cursor: 'pointer', transition: 'var(--transition)',
      }}>
      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: 'var(--space-2)', color: 'var(--clr-text)' }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'var(--clr-text-2)', lineHeight: 1.6 }}>{desc}</div>
    </button>
  )
}

function StepCard({ title, step, total, onBack, children }) {
  return (
    <div className="animate-fadeUp">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'var(--clr-text-2)', padding:4 }}>←</button>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', fontWeight: 700, letterSpacing: '.5px' }}>STEP {step} OF {total}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,3vw,1.7rem)' }}>{title}</h2>
        </div>
      </div>
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>{children}</Card>
    </div>
  )
}

function StatBox({ label, value, sub }) {
  return (
    <div style={{ background:'var(--clr-bg)', borderRadius:'var(--radius-sm)', padding:'var(--space-4)', textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.1rem,2.5vw,1.5rem)', color:'var(--clr-primary)', lineHeight:1.2 }}>{value}</div>
      <div style={{ fontSize:'11px', color:'var(--clr-text-3)', marginTop:3, fontWeight:600, letterSpacing:'.3px' }}>{label.toUpperCase()}</div>
      {sub && <div style={{ fontSize:'11px', color:'var(--clr-text-3)', marginTop:1 }}>{sub}</div>}
    </div>
  )
}

function PathAResult({ result, activityLabel }) {
  const fmt = n => n ? Number(n).toLocaleString() : '—'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'var(--space-3)' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'11px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:4, letterSpacing:'.4px' }}>BUSINESS ACTIVITY</p>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.2rem,3vw,1.5rem)', wordBreak:'break-word' }}>{activityLabel || result.activity}</h2>
            <p style={{ fontSize:'14px', color:'var(--clr-text-2)', marginTop:4 }}>{result.sector}</p>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <p style={{ fontSize:'11px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:4, letterSpacing:'.4px' }}>SUCCESS CHANCE</p>
            <Badge label={result.success_chance} />
          </div>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'var(--space-3)' }}>
        <StatBox label="Starting Capital"      value={`TZS ${fmt(result.startup_capital_tzs)}`}     sub={result.capital_source?.includes('typical') ? 'Typical' : 'Your amount'} />
        <StatBox label="Monthly Profit"        value={`TZS ${fmt(result.expected_monthly_profit_tzs)}`} />
        <StatBox label="ROI / Year"            value={`${result.roi_percent_per_year}%`} />
        <StatBox label="Break-even"            value={`${result.breakeven_months} months`} />
      </div>

      <Card>
        <p style={{ fontSize:'12px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:'var(--space-3)', letterSpacing:'.4px' }}>COMPETITION IN YOUR AREA</p>
        <p style={{ fontSize:'15px' }}>
          There are currently <strong>{result.existing_similar_businesses_in_area}</strong> similar businesses in your ward/district.
          {result.existing_similar_businesses_in_area < 5 ? ' Low competition — a good opportunity.' :
           result.existing_similar_businesses_in_area < 20 ? ' Moderate competition.' :
           ' High competition — differentiate carefully.'}
        </p>
      </Card>

      {result.warnings?.length > 0 && (
        <Card style={{ background:'var(--clr-warning-lt)', border:'1px solid var(--clr-warning)' }}>
          {result.warnings.map((w,i) => <p key={i} style={{ fontSize:'14px', color:'var(--clr-warning)' }}>⚠ {w}</p>)}
        </Card>
      )}
    </div>
  )
}

function PathBResult({ result }) {
  const fmt = n => n ? Number(n).toLocaleString() : '—'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      <div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.4rem,3vw,1.8rem)', marginBottom:'var(--space-2)' }}>Your Recommended Business Ideas</h2>
        <p style={{ color:'var(--clr-text-2)', fontSize:'14px' }}>Ranked by profit potential and competition level in your area.</p>
      </div>
      {result.recommendations?.map((rec, i) => (
        <Card key={i} style={{ borderLeft:'4px solid var(--clr-primary)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--space-3)', flexWrap:'wrap', gap:8 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <span style={{ fontSize:'11px', fontWeight:700, color:'var(--clr-text-3)' }}>#{i+1}</span>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1rem,2.5vw,1.15rem)', margin:'2px 0', wordBreak:'break-word' }}>{rec.activity}</h3>
              <span style={{ fontSize:'13px', color:'var(--clr-text-2)' }}>{rec.sector}</span>
            </div>
            <Badge label={rec.success_chance} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'var(--space-2)' }}>
            {[['Capital', `TZS ${fmt(rec.startup_capital_tzs)}`], ['Monthly Profit', `TZS ${fmt(rec.expected_monthly_profit_tzs)}`], ['ROI / year', `${rec.roi_percent_per_year}%`], ['Break-even', `${rec.breakeven_months} mo`]]
              .map(([l,v]) => (
                <div key={l} style={{ background:'var(--clr-bg)', borderRadius:'var(--radius-sm)', padding:'10px 12px' }}>
                  <div style={{ fontSize:'10px', color:'var(--clr-text-3)', fontWeight:700, letterSpacing:'.3px' }}>{l.toUpperCase()}</div>
                  <div style={{ fontWeight:700, fontSize:'14px', color:'var(--clr-text)', marginTop:2 }}>{v}</div>
                </div>
              ))}
          </div>
          <p style={{ fontSize:'12px', color:'var(--clr-text-3)', marginTop:'var(--space-3)' }}>{rec.existing_similar_businesses_in_area} similar businesses nearby</p>
        </Card>
      ))}
    </div>
  )
}
