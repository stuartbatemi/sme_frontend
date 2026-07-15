// src/pages/AdvisorPage.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { advisoryAPI, modelAPI, consultantAPI, microfinanceAPI } from '../services/api'
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../components/common/UI'
import { PathCard } from '../components/ui/path-card'
import DistrictMapPicker from '../components/ui/DistrictMapPicker'
import pathAThumb from '../assets/path-a-card-bg.jpg'
import pathBThumb from '../assets/path-b-card-bg.jpg'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
const MIN_CAPITAL = 20000
const SUGGESTION_COUNT_OPTIONS = [3, 5, 8, 10]

interface PriorExperienceEntry {
  isic_detailed: number
  activity_label: string
  years: string
  still_active: boolean
}

interface AdvisorForm {
  path_type: string
  business_idea: string
  isic_detailed: string | null
  activity_label: string
  district: string
  ward: string
  village: string
  capital_tzs: string
  age: string
  gender: string
  top_n: number
  funding_type: string                    // '' | 'personal' | 'loan' | 'expansion'
  prior_experience: PriorExperienceEntry[]
  experience_preference: string            // 'experience' | 'new' | 'both'
}

const emptyForm: AdvisorForm = {
  path_type: '', business_idea: '', isic_detailed: null, activity_label: '',
  district: '', ward: '', village: '',
  capital_tzs: '', age: '', gender: '', top_n: 5,
  funding_type: 'personal', prior_experience: [], experience_preference: 'both',
}

export default function AdvisorPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const isPremium = user?.tier === 'premium'
  const navigate = useNavigate()

  // Require login — guests go to register
  useEffect(() => {
    if (!authLoading && user === null) navigate('/register', { replace: true })
  }, [user, authLoading, navigate])

  const [step,      setStep]      = useState(0)
  const [form,      setForm]      = useState<AdvisorForm>(emptyForm)
  const [matches,   setMatches]   = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<any>(null)
  const [error,     setError]     = useState('')
  const [capError,  setCapError]  = useState('')

  // ── Funding sub-flow (lives inside Step 1, doesn't need its own
  // step number — keeps the existing step machine untouched) ────────
  const [showFunding, setShowFunding] = useState(false)
  const [expQuery,    setExpQuery]    = useState('')
  const [expSearching, setExpSearching] = useState(false)
  const [expMatches,  setExpMatches]  = useState<any[]>([])
  const [expYears,    setExpYears]    = useState('1')
  const [expActive,   setExpActive]   = useState(true)

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

  function set(field: keyof AdvisorForm, value: any) { setForm(p => ({ ...p, [field]: value })) }

  function validateCapital(val: string) {
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
        .map((a: any) => ({
          ...a,
          score: words.reduce((s: number, w: string) => s + (a.MainActivityDescription.toLowerCase().includes(w) ? 1 : 0), 0),
        }))
        .filter((a: any) => a.score > 0)
        .sort((a: any, b: any) => b.score - a.score || b.Count - a.Count)
        .slice(0, 8)
      setMatches(scored)
      if (!scored.length) setError('No matches found. Try simpler words like "food", "clothes", "repair".')
    } catch {
      setError('Could not reach the model server. Make sure it is running on port 8000.')
    } finally { setSearching(false) }
  }

  function selectActivity(act: any) {
    set('isic_detailed', act.ISIC_Detailed)
    set('activity_label', act.MainActivityDescription)
    setMatches([])
    submitPrediction({ ...form, isic_detailed: act.ISIC_Detailed, activity_label: act.MainActivityDescription })
  }

  // ── Prior-experience search (funding_type === 'expansion') ─────────
  async function searchExperience() {
    if (!expQuery.trim()) return
    setExpSearching(true); setExpMatches([])
    try {
      const { data } = await advisoryAPI.experienceSearch(expQuery)
      setExpMatches((data.activities || []).slice(0, 8))
    } catch {
      setExpMatches([])
    } finally { setExpSearching(false) }
  }

  function addExperienceEntry(act: any) {
    const entry: PriorExperienceEntry = {
      isic_detailed: act.ISIC_Detailed,
      activity_label: act.MainActivityDescription,
      years: expYears,
      still_active: expActive,
    }
    setForm(p => ({ ...p, prior_experience: [...p.prior_experience, entry] }))
    setExpQuery(''); setExpMatches([])
  }

  function removeExperienceEntry(idx: number) {
    setForm(p => ({ ...p, prior_experience: p.prior_experience.filter((_, i) => i !== idx) }))
  }

  // ── Submit ────────────────────────────────────────────────────────
  async function submitPrediction(overrides: Partial<AdvisorForm> = {}) {
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
      funding_type:  f.funding_type || undefined,
      prior_experience: f.funding_type === 'expansion' && f.prior_experience.length > 0
        ? f.prior_experience.map(e => ({ isic_detailed: e.isic_detailed, years: parseFloat(e.years) || 0, still_active: e.still_active }))
        : undefined,
      ...(f.path_type === 'A'
        ? { isic_detailed: f.isic_detailed, workers: 1 }
        : { top_n: f.top_n || 5 }
      ),
    }
    try {
      const { data } = await advisoryAPI.predict(payload)
      // Client-side experience-preference filter for Path B — 'experience'
      // shows only matches, 'new' shows only non-matches, 'both' (default)
      // shows the model's own boosted ranking unfiltered.
      if (f.path_type === 'B' && Array.isArray(data.recommendations) && f.experience_preference !== 'both') {
        const wantMatch = f.experience_preference === 'experience'
        const filtered = data.recommendations.filter((r: any) => !!r.matches_your_experience === wantMatch)
        data.recommendations = filtered.length > 0 ? filtered : data.recommendations
      }
      setResult(data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Prediction failed. Please try again.')
      setStep(form.path_type === 'A' ? 3 : 2)
    } finally { setLoading(false) }
  }

  function reset() {
    setForm(emptyForm); setResult(null); setError(''); setMatches([]); setStep(0)
    setShowFunding(false); setExpQuery(''); setExpMatches([]); setExpYears('1'); setExpActive(true)
  }

  // ── Determine step count based on login state ─────────────────────
  // Logged-in users skip the personal details step (age/gender already known)
  const totalSteps = form.path_type === 'A' ? (user ? 2 : 3) : (user ? 2 : 3)
  const personalStep = user ? null : 2   // null means skip it

  function goFromLocation() {
    setShowFunding(true)   // reveal funding-type question within Step 1, don't advance yet
  }

  function goFromFunding() {
    if (user) {
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

  // Show spinner while auth is resolving — prevents blank flash
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size={40} />
      </div>
    )
  }

  return (
    <div>
      {/* Upgrade banner for regular users */}
      {!isPremium && (
        <div style={{
          background: 'linear-gradient(135deg, #0D3D3D 0%, #0a2a2a 100%)',
          borderBottom: '1px solid rgba(232,168,56,0.30)',
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', margin: 0 }}>
            ✨ <strong style={{ color: '#E8A838' }}>ORin LoNet 2.5</strong> — faster & sharper predictions available
          </p>
          <button
            onClick={() => navigate('/upgrade')}
            style={{
              background: '#E8A838', color: '#1a0f00', fontWeight: 700,
              fontSize: 12, padding: '6px 18px', borderRadius: 999,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >Upgrade — $10/mo</button>
        </div>
      )}
      <div style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: 680, margin: '0 auto' }}>

      {/* Step 0: Choose path */}
      {step === 0 && (
        <div className="animate-fadeUp">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: 'var(--space-2)' }}>
            {user ? t('advisor.welcome_user').replace('{name}', user.full_name?.split(' ')[0] || '') : t('advisor.welcome_guest')}
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '1rem', marginBottom: 'var(--space-6)' }}>
            {t('advisor.welcome_sub')}
          </p>
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <PathCard
              variant="static"
              image={pathAThumb}
              title={t('advisor.pathA_title')}
              description={t('advisor.pathA_desc')}
              onClick={() => { set('path_type','A'); setStep(1) }}
              className="animate-fadeUp"
              style={{ animationDelay: '80ms' }}
              labelClassName="animate-fadeUp"
              labelStyle={{ animationDelay: '260ms' }}
            />
            <PathCard
              variant="static"
              image={pathBThumb}
              title={t('advisor.pathB_title')}
              description={t('advisor.pathB_desc')}
              onClick={() => { set('path_type','B'); setStep(1) }}
              className="animate-fadeUp"
              style={{ animationDelay: '200ms' }}
              labelClassName="animate-fadeUp"
              labelStyle={{ animationDelay: '380ms' }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Location + Capital (+ funding-type sub-flow, revealed after Continue) */}
      {step === 1 && (
        <StepCard title={t('advisor.step1_title')} step={1} total={user ? 2 : 3} onBack={() => showFunding ? setShowFunding(false) : setStep(0)}>
          {/* Map-based district + ward + street picker */}
          <DistrictMapPicker
            district={form.district}
            ward={form.ward}
            village={form.village}
            onDistrictChange={v => set('district', v)}
            onWardChange={v => set('ward', v)}
            onVillageChange={v => set('village', v)}
          />

          {/* Capital is asked of EVERYONE here — it's specific to this
              business query, not a fixed profile attribute, so it can't
              be safely skipped just because someone is logged in. */}
          <Input label={t('advisor.capital_label')} name="capital_tzs" type="number"
            value={form.capital_tzs} min={MIN_CAPITAL}
            onChange={e => { set('capital_tzs', e.target.value); validateCapital(e.target.value) }}
            placeholder={`e.g. 500000 (min TZS ${MIN_CAPITAL.toLocaleString()})`}
            hint={t('advisor.capital_hint')}
            error={capError}
          />

          {form.path_type === 'B' && (
            <Select label={t('advisor.suggestions_label')} name="top_n"
              value={String(form.top_n)}
              onChange={e => set('top_n', parseInt(e.target.value, 10))}
              options={SUGGESTION_COUNT_OPTIONS.map(n => ({ value: String(n), label: `${n} suggestions` }))}
            />
          )}

          {!showFunding && (
            <Button variant="primary" fullWidth disabled={!form.district || !!capError} onClick={goFromLocation}>
              {t('advisor.continue')}
            </Button>
          )}

          {/* ── Funding-type question (revealed after Continue) ────── */}
          {showFunding && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--space-4)' }}>
              <Select label={t('advisor.funding_label')} name="funding_type"
                value={form.funding_type}
                onChange={e => set('funding_type', e.target.value)}
                options={[
                  { value: 'personal', label: t('advisor.funding_personal') },
                  { value: 'loan', label: t('advisor.funding_loan') },
                  { value: 'expansion', label: t('advisor.funding_expansion') },
                ]}
              />

              {/* ── Prior-experience search (expansion only) ─────────── */}
              {form.funding_type === 'expansion' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 700, letterSpacing: '.4px' }}>
                    {t('advisor.experience_title')}
                  </p>

                  {form.prior_experience.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {form.prior_experience.map((entry, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                          background: 'var(--clr-bg)', fontSize: 13,
                        }}>
                          <span>{entry.activity_label} — {entry.years} yr{parseFloat(entry.years) === 1 ? '' : 's'}{entry.still_active ? ' (still active)' : ' (closed)'}</span>
                          <button onClick={() => removeExperienceEntry(i)}
                            style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', cursor: 'pointer', fontSize: 14 }}
                            aria-label="Remove">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <Input label={t('advisor.experience_search_label')} name="exp_query" value={expQuery}
                        onChange={e => setExpQuery(e.target.value)}
                        placeholder={t('advisor.experience_search_placeholder')}
                      />
                    </div>
                    <div style={{ width: 90 }}>
                      <Input label={t('advisor.experience_years')} name="exp_years" type="number" value={expYears}
                        onChange={e => setExpYears(e.target.value)} min={0} />
                    </div>
                    <Select label={t('advisor.experience_status')} name="exp_active" value={expActive ? 'yes' : 'no'}
                      onChange={e => setExpActive(e.target.value === 'yes')}
                      options={[{ value: 'yes', label: t('advisor.experience_active') }, { value: 'no', label: t('advisor.experience_closed') }]}
                    />
                    <Button variant="secondary" loading={expSearching} onClick={searchExperience}>{t('advisor.search')}</Button>
                  </div>

                  {expMatches.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {expMatches.map(m => (
                        <button key={m.ISIC_Detailed} onClick={() => addExperienceEntry(m)}
                          style={{
                            textAlign: 'left', padding: 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)',
                            background: 'var(--clr-card)', cursor: 'pointer', color: 'var(--clr-text)', fontSize: 13,
                          }}
                        >{m.MainActivityDescription}</button>
                      ))}
                    </div>
                  )}

                  <Select label={t('advisor.experience_preference_label')} name="experience_preference"
                    value={form.experience_preference}
                    onChange={e => set('experience_preference', e.target.value)}
                    options={[
                      { value: 'both', label: t('advisor.experience_pref_both') },
                      { value: 'experience', label: t('advisor.experience_pref_experience') },
                      { value: 'new', label: t('advisor.experience_pref_new') },
                    ]}
                  />
                </div>
              )}

              <Button variant="primary" fullWidth
                disabled={!form.funding_type}
                onClick={goFromFunding}>
                {form.path_type === 'A' ? t('advisor.continue') : (user ? t('advisor.get_recommendations') : t('advisor.continue'))}
              </Button>
            </div>
          )}
        </StepCard>
      )}

      {/* Step 2: Personal details (guests only — age/gender aren't asked
          again for logged-in users since those are stored on the profile.
          Capital is NOT asked here anymore — it moved to Step 1 above,
          since it's needed by every user regardless of login state). */}
      {step === 2 && !user && (
        <StepCard title={t('advisor.personal_title')} step={2} total={3} onBack={() => setStep(1)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label={t('advisor.age_label')} name="age" type="number" value={form.age}
              onChange={e => set('age', e.target.value)} placeholder="e.g. 28" min={16} max={100} />
            <Select label={t('advisor.gender_label')} name="gender" value={form.gender}
              onChange={e => set('gender', e.target.value)}
              options={[{ value: '', label: t('advisor.gender_prefer_not') }, { value: 'male', label: t('advisor.gender_male') }, { value: 'female', label: t('advisor.gender_female') }]}
            />
          </div>
          <Button variant="primary" fullWidth onClick={goFromPersonal}>
            {form.path_type === 'A' ? t('advisor.continue') : t('advisor.get_recommendations')}
          </Button>
        </StepCard>
      )}

      {/* Step 3: Business idea search (Path A) */}
      {step === 3 && (
        <StepCard title={t('advisor.idea_title')} step={user ? 2 : 3} total={user ? 2 : 3} onBack={() => setStep(user ? 1 : 2)}>
          <Alert type="error" message={error} />
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input label={t('advisor.idea_label')} name="business_idea" value={form.business_idea}
                onChange={e => set('business_idea', e.target.value)}
                placeholder={t('advisor.idea_placeholder')}
                hint={t('advisor.idea_hint')}
              />
            </div>
            <Button variant="secondary" loading={searching} onClick={searchActivities}>{t('advisor.search')}</Button>
          </div>

          {matches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 700, letterSpacing: '.4px' }}>{t('advisor.select_match')}</p>
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
              <p style={{ marginTop: 'var(--space-4)', color: 'var(--clr-text-2)' }}>{t('advisor.analysing')}</p>
            </div>
          )}
          {!loading && error && (
            <Card>
              <Alert type="error" message={error} />
              <Button style={{ marginTop: 'var(--space-4)' }} onClick={() => setStep(form.path_type==='A' ? 3 : (user ? 1 : 2))}>{t('advisor.try_again')}</Button>
            </Card>
          )}
          {!loading && result && result.blocked && (
            <Card style={{ background: 'var(--clr-warning-lt)', border: '1px solid var(--clr-warning)' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-warning)', letterSpacing: '.4px', marginBottom: 8 }}>
                {t('advisor.capital_blocked_title')}
              </p>
              <p style={{ fontSize: 15 }}>{result.message}</p>
              <p style={{ fontSize: 13, color: 'var(--clr-text-2)', marginTop: 8 }}>
                {t('advisor.capital_blocked_min')} <strong>TZS {Number(result.min_capital_tzs).toLocaleString()}</strong>
              </p>
              <Button style={{ marginTop: 'var(--space-4)' }} onClick={() => setStep(form.path_type === 'A' ? 3 : 1)}>
                {t('advisor.capital_blocked_retry')}
              </Button>
            </Card>
          )}
          {!loading && result && !result.blocked && (
            <>
              {form.path_type === 'A'
                ? <PathAResult result={result} activityLabel={form.activity_label} fundingType={form.funding_type} />
                : <PathBResult result={result} fundingType={form.funding_type} />
              }
              {form.funding_type === 'loan' && (
                <MicrofinancePanel defaultRiskTier={
                  form.path_type === 'A' ? result.risk_tier : (result.recommendations?.[0]?.risk_tier || 'Medium')
                } />
              )}
              {result.saved && (
                <p style={{ textAlign:'center', marginTop:'var(--space-4)', fontSize:'13px', color:'var(--clr-success)' }}>
                  {t('advisor.saved_premium')}
                </p>
              )}
              <div style={{ textAlign:'center', marginTop:'var(--space-8)' }}>
                <Button variant="secondary" onClick={reset}>{t('advisor.new_query')}</Button>
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

// ── Subcomponents ─────────────────────────────────────────────────

// Shared Y-axis tick formatter for TZS values — always returns a string
// (Recharts' tickFormatter type requires a string return in all branches).
function formatTzsTick(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
  return v.toString()
}

function StepCard({ title, step, total, onBack, children }: { title: string, step: number, total: number, onBack: () => void, children: React.ReactNode }) {
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

function StatBox({ label, value, sub }: { label: string, value: string, sub?: string }) {
  return (
    <div style={{ background:'var(--clr-bg)', borderRadius:'var(--radius-sm)', padding:'var(--space-4)', textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.1rem,2.5vw,1.5rem)', color:'var(--clr-primary)', lineHeight:1.2 }}>{value}</div>
      <div style={{ fontSize:'11px', color:'var(--clr-text-3)', marginTop:3, fontWeight:600, letterSpacing:'.3px' }}>{label.toUpperCase()}</div>
      {sub && <div style={{ fontSize:'11px', color:'var(--clr-text-3)', marginTop:1 }}>{sub}</div>}
    </div>
  )
}

function PathAResult({ result, activityLabel, fundingType }: { result: any, activityLabel: string, fundingType?: string }) {
  const { t } = useLanguage()
  const fmt = (n: any) => n ? Number(n).toLocaleString() : '—'
  const chartData = [
    { name: t('chart.capital'), value: Number(result.startup_capital_tzs) || 0 },
    { name: t('chart.annual_profit'), value: (Number(result.expected_monthly_profit_tzs) || 0) * 12 },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'var(--space-3)' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'11px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:4, letterSpacing:'.4px' }}>{t('advisor.business_activity')}</p>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.2rem,3vw,1.5rem)', wordBreak:'break-word' }}>{activityLabel || result.activity}</h2>
            <p style={{ fontSize:'14px', color:'var(--clr-text-2)', marginTop:4 }}>{result.sector}</p>
          </div>
          <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
            <div>
              <p style={{ fontSize:'11px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:4, letterSpacing:'.4px' }}>{t('advisor.success_chance')}</p>
              <Badge label={result.success_chance} />
            </div>
            {fundingType === 'loan' && result.risk_tier && (
              <div>
                <p style={{ fontSize:'11px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:4, letterSpacing:'.4px' }}>{t('advisor.loan_risk')}</p>
                <Badge label={result.risk_tier} />
              </div>
            )}
          </div>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'var(--space-3)' }}>
        <StatBox label={t('advisor.starting_capital')} value={`TZS ${fmt(result.startup_capital_tzs)}`}     sub={result.capital_source?.includes('typical') ? t('advisor.typical') : t('advisor.your_amount')} />
        <StatBox label={t('advisor.monthly_profit')}    value={`TZS ${fmt(result.expected_monthly_profit_tzs)}`} />
        <StatBox label={t('advisor.roi_year')}          value={`${result.roi_percent_per_year}%`} />
        <StatBox label={t('advisor.breakeven')}         value={`${result.breakeven_months} ${t('advisor.months_unit')}`} />
      </div>

      <Card>
        <p style={{ fontSize:'12px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:'var(--space-3)', letterSpacing:'.4px' }}>{t('chart.capital_vs_return')}</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--clr-text-2)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--clr-text-3)' }} tickFormatter={formatTzsTick} />
            <Tooltip formatter={(v: any) => `TZS ${Number(v).toLocaleString()}`} contentStyle={{ background: 'var(--clr-card)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: 13 }} />
            <Bar dataKey="value" fill="var(--clr-primary, #0D6E6E)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <p style={{ fontSize:'12px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:'var(--space-3)', letterSpacing:'.4px' }}>{t('advisor.competition_title')}</p>
        <p style={{ fontSize:'15px' }}>
          {t('advisor.competition_prefix')} <strong>{result.existing_similar_businesses_in_area}</strong> {t('advisor.competition_suffix')}
          {' '}
          {result.existing_similar_businesses_in_area < 5 ? t('advisor.competition_low') :
           result.existing_similar_businesses_in_area < 20 ? t('advisor.competition_medium') :
           t('advisor.competition_high')}
        </p>
      </Card>

      {result.warnings?.length > 0 && (
        <Card style={{ background:'var(--clr-warning-lt)', border:'1px solid var(--clr-warning)' }}>
          {result.warnings.map((w: string, i: number) => <p key={i} style={{ fontSize:'14px', color:'var(--clr-warning)' }}>⚠ {w}</p>)}
        </Card>
      )}

      <ConsultantPanel payload={{
        activity: activityLabel || result.activity,
        sector: result.sector,
        district: result.location?.district,
        ward: result.location?.ward,
        capital_tzs: result.startup_capital_tzs,
        monthly_profit: result.expected_monthly_profit_tzs,
        success_chance: result.success_chance,
        existing_similar_businesses_in_area: result.existing_similar_businesses_in_area,
        roi_percent: result.roi_percent_per_year,
        breakeven_months: result.breakeven_months,
      }} />
    </div>
  )
}

function PathBResult({ result, fundingType }: { result: any, fundingType?: string }) {
  const { t } = useLanguage()
  const fmt = (n: any) => n ? Number(n).toLocaleString() : '—'
  const recs = result.recommendations || []
  const count = recs.length

  const PIE_COLORS: Record<string, string> = { High: '#2F9E44', Medium: '#E8A838', Low: '#E03131' }
  const pieData = ['High', 'Medium', 'Low']
    .map(cat => ({ name: t(`chart.${cat.toLowerCase()}`), key: cat, value: recs.filter((r: any) => r.success_chance === cat).length }))
    .filter(d => d.value > 0)

  const barData = recs.map((r: any, i: number) => ({
    name: r.activity?.length > 16 ? r.activity.slice(0, 16) + '…' : r.activity,
    profit: Number(r.expected_monthly_profit_tzs) || 0,
  }))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      <div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.4rem,3vw,1.8rem)', marginBottom:'var(--space-2)' }}>{t('advisor.recommended_title')}</h2>
        <p style={{ color:'var(--clr-text-2)', fontSize:'14px' }}>
          {count} {t('advisor.recommended_count_suffix')}
        </p>
      </div>

      {count > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {pieData.length > 0 && (
            <Card>
              <p style={{ fontSize:'12px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:'var(--space-3)', letterSpacing:'.4px' }}>{t('chart.success_distribution')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(entry: any) => `${entry.name}: ${entry.value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={PIE_COLORS[entry.key] || '#888'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--clr-card)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
          <Card>
            <p style={{ fontSize:'12px', color:'var(--clr-text-3)', fontWeight:700, marginBottom:'var(--space-3)', letterSpacing:'.4px' }}>{t('chart.profit_comparison')}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--clr-text-2)' }} interval={0} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--clr-text-3)' }} tickFormatter={formatTzsTick} />
                <Tooltip formatter={(v: any) => `TZS ${Number(v).toLocaleString()}`} contentStyle={{ background: 'var(--clr-card)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="profit" fill="var(--clr-primary, #0D6E6E)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {recs.map((rec: any, i: number) => (
        <Card key={i} style={{ borderLeft:'4px solid var(--clr-primary)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--space-3)', flexWrap:'wrap', gap:8 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <span style={{ fontSize:'11px', fontWeight:700, color:'var(--clr-text-3)' }}>#{i+1}</span>
              {rec.matches_your_experience && (
                <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: 'var(--clr-primary)', letterSpacing: '.3px' }}>
                  {t('advisor.based_on_experience')}
                </span>
              )}
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1rem,2.5vw,1.15rem)', margin:'2px 0', wordBreak:'break-word' }}>{rec.activity}</h3>
              <span style={{ fontSize:'13px', color:'var(--clr-text-2)' }}>{rec.sector}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
              <Badge label={rec.success_chance} />
              {fundingType === 'loan' && rec.risk_tier && <Badge label={`${rec.risk_tier} ${t('advisor.risk_suffix')}`} />}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'var(--space-2)' }}>
            {[[t('advisor.capital_col'), `TZS ${fmt(rec.startup_capital_tzs)}`], [t('advisor.profit_col'), `TZS ${fmt(rec.expected_monthly_profit_tzs)}`], [t('advisor.roi_col'), `${rec.roi_percent_per_year}%`], [t('advisor.breakeven_col'), `${rec.breakeven_months} ${t('advisor.months_unit')}`]]
              .map(([l,v]) => (
                <div key={l} style={{ background:'var(--clr-bg)', borderRadius:'var(--radius-sm)', padding:'10px 12px' }}>
                  <div style={{ fontSize:'10px', color:'var(--clr-text-3)', fontWeight:700, letterSpacing:'.3px' }}>{String(l).toUpperCase()}</div>
                  <div style={{ fontWeight:700, fontSize:'14px', color:'var(--clr-text)', marginTop:2 }}>{v}</div>
                </div>
              ))}
          </div>
          <p style={{ fontSize:'12px', color:'var(--clr-text-3)', marginTop:'var(--space-3)' }}>{rec.existing_similar_businesses_in_area} {t('advisor.similar_nearby')}</p>
          {rec.warning && (
            <p style={{ fontSize:'12px', color:'var(--clr-warning)', marginTop:'var(--space-2)' }}>⚠ {rec.warning}</p>
          )}
          <ConsultantPanel payload={{
            activity: rec.activity,
            sector: rec.sector,
            district: result.location?.district,
            ward: result.location?.ward,
            capital_tzs: rec.startup_capital_tzs,
            monthly_profit: rec.expected_monthly_profit_tzs,
            success_chance: rec.success_chance,
            existing_similar_businesses_in_area: rec.existing_similar_businesses_in_area,
            roi_percent: rec.roi_percent_per_year,
            breakeven_months: rec.breakeven_months,
          }} />
        </Card>
      ))}
    </div>
  )
}

// ── AI Consultant panel — lazy: fetches only when the person clicks ──
function ConsultantPanel({ payload }: { payload: any }) {
  const { t, lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState('')

  async function explain() {
    if (data) { setOpen(o => !o); return }
    setLoading(true); setErr('')
    try {
      const { data: res } = await consultantAPI.analyze({ ...payload, language: lang })
      setData(res); setOpen(true)
    } catch (e: any) {
      setErr(e.response?.data?.error || t('consultant.unavailable'))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ marginTop: 'var(--space-3)' }}>
      <Button variant="secondary" loading={loading} onClick={explain}>
        {open ? t('consultant.hide') : t('consultant.explain')}
      </Button>
      {err && <Alert type="error" message={err} />}
      {open && data && (
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--clr-text-3)', letterSpacing:'.4px' }}>{t('consultant.3month')}</p>
            <p style={{ fontSize:14 }}>{data.three_month_outlook}</p>
          </div>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--clr-text-3)', letterSpacing:'.4px' }}>{t('consultant.6month')}</p>
            <p style={{ fontSize:14 }}>{data.six_month_outlook}</p>
          </div>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--clr-text-3)', letterSpacing:'.4px' }}>{t('consultant.12month')}</p>
            <p style={{ fontSize:14 }}>{data.twelve_month_outlook}</p>
          </div>
          {data.first_30_days?.length > 0 && (
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--clr-text-3)', letterSpacing:'.4px', marginBottom:4 }}>{t('consultant.first30')}</p>
              <ol style={{ paddingLeft: 18, fontSize: 14 }}>
                {data.first_30_days.map((step: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{step}</li>)}
              </ol>
            </div>
          )}
          {data.supplier_guidance && (
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--clr-text-3)', letterSpacing:'.4px' }}>{t('consultant.suppliers')}</p>
              <p style={{ fontSize:14 }}>{data.supplier_guidance}</p>
            </div>
          )}
          {data.risk_factors_outside_the_model?.length > 0 && (
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--clr-text-3)', letterSpacing:'.4px', marginBottom:4 }}>{t('consultant.risks')}</p>
              <ul style={{ paddingLeft: 18, fontSize: 14 }}>
                {data.risk_factors_outside_the_model.map((r: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
              </ul>
            </div>
          )}
          <p style={{ fontSize: 11, color: 'var(--clr-text-3)', fontStyle: 'italic' }}>{data.generated_by}</p>
        </div>
      )}
    </div>
  )
}

// ── Microfinance panel (loan funding path) ────────────────────────
function MicrofinancePanel({ defaultRiskTier }: { defaultRiskTier: string }) {
  const { t } = useLanguage()
  const [tier, setTier] = useState(defaultRiskTier || 'Medium')
  const [loading, setLoading] = useState(false)
  const [institutions, setInstitutions] = useState<any[]>([])
  const [err, setErr] = useState('')

  const TIER_LABEL: Record<string, string> = {
    Low: t('microfinance.risk_low'),
    Medium: t('microfinance.risk_medium'),
    High: t('microfinance.risk_high'),
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true); setErr('')
    microfinanceAPI.list(tier)
      .then(({ data }: any) => { if (!cancelled) setInstitutions(data.institutions || []) })
      .catch(() => { if (!cancelled) setErr(t('microfinance.error')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tier])

  return (
    <Card style={{ marginTop: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 'var(--space-3)' }}>
        <p style={{ fontSize:12, fontWeight:700, color:'var(--clr-text-3)', letterSpacing:'.4px' }}>{t('microfinance.title')}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Low', 'Medium', 'High'].map(tierOption => (
            <button key={tierOption} onClick={() => setTier(tierOption)}
              style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                border: `1.5px solid ${tier === tierOption ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                background: tier === tierOption ? 'var(--clr-primary-lt)' : 'var(--clr-card)',
                color: tier === tierOption ? 'var(--clr-primary)' : 'var(--clr-text-2)',
                fontWeight: tier === tierOption ? 700 : 400,
              }}
            >{TIER_LABEL[tierOption]}</button>
          ))}
        </div>
      </div>
      {loading && <Spinner size={24} />}
      {err && <Alert type="error" message={err} />}
      {!loading && !err && institutions.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--clr-text-3)' }}>{t('microfinance.none_found')}</p>
      )}
      {!loading && institutions.map((inst: any) => (
        <div key={inst.id} style={{ padding: '10px 0', borderTop: '1px solid var(--clr-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 14 }}>{inst.name}</strong>
            <span style={{ fontSize: 11, color: 'var(--clr-text-3)', textTransform: 'uppercase' }}>{inst.type.replace('_', ' ')}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--clr-text-2)', marginTop: 4 }}>{inst.eligibility_summary}</p>
          {(inst.min_loan_tzs || inst.max_loan_tzs) && (
            <p style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: 4 }}>
              {t('microfinance.loan_range')} TZS {inst.min_loan_tzs ? Number(inst.min_loan_tzs).toLocaleString() : '—'}
              {' – '}
              {inst.max_loan_tzs ? Number(inst.max_loan_tzs).toLocaleString() : 'varies'}
            </p>
          )}
          {inst.website && (
            <a href={inst.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--clr-primary)' }}>
              {t('microfinance.visit')}
            </a>
          )}
        </div>
      ))}
      <p style={{ fontSize: 11, color: 'var(--clr-text-3)', marginTop: 'var(--space-3)', fontStyle: 'italic' }}>
        {t('microfinance.disclaimer')}
      </p>
    </Card>
  )
}