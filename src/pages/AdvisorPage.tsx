// src/pages/AdvisorPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  advisoryAPI,
  modelAPI,
  consultantAPI,
  microfinanceAPI,
} from "../services/api";
import {
  Button,
  Input,
  Select,
  Card,
  Spinner,
  Alert,
  Badge,
  TierBadge,
  TierSelect,
} from "../components/common/UI";
import { PathCard } from "../components/ui/path-card";
import { RiskToleranceScale } from "../components/ui/RiskToleranceScale";
import { MultiSelectChips } from "../components/ui/MultiSelectChips";
import { PremiumAnalysisPanel } from "../components/charts/PremiumAnalysisPanel";
import { PremiumAnalysisLocked } from "../components/charts/PremiumAnalysisLocked";
import { PerformanceMiniChart } from "../components/charts/PerformanceMiniChart";
import { BusinessTrendChart } from "../components/charts/BusinessTrendChart";
import { BusinessPieCharts } from "../components/charts/BusinessPieCharts";
import { BusinessPreviewMini } from "../components/charts/BusinessPreviewMini";
import { ExportMenu } from "../components/reports/ExportMenu";
import type { ReportRow, ReportMeta } from "../lib/reportExport";
import { resolveCssVar } from "../lib/chartTheme";
import DistrictMapPicker from "../components/ui/DistrictMapPicker";
import pathAThumb from "../assets/path-a-card-bg.jpg";
import pathBThumb from "../assets/path-b-card-bg.jpg";
import pathCThumb from "../assets/path-c-card-bg.jpg";
import pathDThumb from "../assets/path-d-card-bg.jpg";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
const MIN_CAPITAL = 20000;
// Strips everything but digits, so pasted/typed commas, spaces, or a
// stray "TZS" don't break parsing — this is what gets stored in form
// state and sent to the backend.
function digitsOnly(val: string): string {
  return val.replace(/[^\d]/g, "");
}
// Adds thousand-separator commas for display only, e.g. "500000" -> "500,000".
function formatWithCommas(digits: string): string {
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}
const SUGGESTION_COUNT_OPTIONS = [3, 5, 8, 10, 20, 30, 50];
const REC_PAGE_SIZE = 10; // suggestions per mini-tab page

interface PriorExperienceEntry {
  isic_detailed: number;
  activity_label: string;
  years: string;
  still_active: boolean;
}

interface AdvisorForm {
  path_type: string;
  business_idea: string;
  isic_detailed: string | null;
  activity_label: string;
  sector: string;
  skills: string[];
  hobbies: string[];
  risk_tolerance: string;
  district: string;
  ward: string;
  village: string;
  capital_tzs: string;
  age: string;
  gender: string;
  top_n: number;
  funding_type: string; // '' | 'personal' | 'loan' | 'expansion'
  prior_experience: PriorExperienceEntry[];
  experience_preference: string; // 'experience' | 'new' | 'both'
}

const emptyForm: AdvisorForm = {
  path_type: "",
  business_idea: "",
  isic_detailed: null,
  activity_label: "",
  sector: "",
  skills: [],
  hobbies: [],
  risk_tolerance: "",
  district: "",
  ward: "",
  village: "",
  capital_tzs: "",
  age: "",
  gender: "",
  top_n: 5,
  funding_type: "personal",
  prior_experience: [],
  experience_preference: "both",
};

export default function AdvisorPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const isPremium = user?.tier === "premium";
  const navigate = useNavigate();

  // Require login — guests go to register
  useEffect(() => {
    if (!authLoading && user === null) navigate("/register", { replace: true });
  }, [user, authLoading, navigate]);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AdvisorForm>(emptyForm);
  const [matches, setMatches] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [capError, setCapError] = useState("");

  // ── Funding sub-flow (lives inside Step 1, doesn't need its own
  // step number — keeps the existing step machine untouched) ────────
  // ── Full business list (browse instead of type-to-search, so a
  // misspelled query can never block someone from finding their idea) ─
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);

  // Sector list for the dropdown — refetched whenever the UI language
  // changes, so the labels switch to Swahili without a page reload.
  const [sectors, setSectors] = useState<{ code: string; name: string }[]>([]);
  useEffect(() => {
    modelAPI
      .sectors(lang)
      .then(({ data }) => setSectors(data?.sectors || []))
      .catch(() => setSectors([]));
  }, [lang]);

  const [skillsList, setSkillsList] = useState<{ code: string; name: string }[]>([]);
  useEffect(() => {
    modelAPI
      .skills(lang)
      .then(({ data }) => setSkillsList(data?.skills || []))
      .catch(() => setSkillsList([]));
  }, [lang]);

  const [hobbiesList, setHobbiesList] = useState<{ code: string; name: string }[]>([]);
  useEffect(() => {
    modelAPI
      .hobbies(lang)
      .then(({ data }) => setHobbiesList(data?.hobbies || []))
      .catch(() => setHobbiesList([]));
  }, [lang]);

  // Re-fetch the activity list whenever the sector filter or UI
  // language changes — "I know the sector but not the specific
  // business yet" narrows this from the full 379-activity catalog
  // down to just that sector, and switching language refreshes
  // the display names without a page reload.
  useEffect(() => {
    setLoadingAllActivities(true);
    modelAPI
      .activities(form.sector || undefined, lang)
      .then(({ data }) => {
        const list = (data?.activities || [])
          .slice()
          .sort((a: any, b: any) =>
            a.MainActivityDescription.localeCompare(b.MainActivityDescription),
          );
        setAllActivities(list);
      })
      .catch(() => setAllActivities([]))
      .finally(() => setLoadingAllActivities(false));
  }, [form.sector, lang]);

  const [showFunding, setShowFunding] = useState(false);
  const [expQuery, setExpQuery] = useState("");
  const [expSearching, setExpSearching] = useState(false);
  const [expMatches, setExpMatches] = useState<any[]>([]);
  const [expYears, setExpYears] = useState("1");
  const [expActive, setExpActive] = useState(true);

  // Pre-fill from user profile if logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        age: user.age ? String(user.age) : prev.age,
        gender: user.gender ? user.gender : prev.gender,
        district: user.district ? user.district : prev.district,
        ward: user.ward ? user.ward : prev.ward,
      }));
    }
  }, [user]);

  function set(field: keyof AdvisorForm, value: any) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function validateCapital(val: string) {
    if (!val) {
      setCapError("");
      return true;
    }
    const n = parseFloat(val);
    if (isNaN(n) || n < MIN_CAPITAL) {
      setCapError(
        `Minimum startup capital is TZS ${MIN_CAPITAL.toLocaleString()}`,
      );
      return false;
    }
    setCapError("");
    return true;
  }

  // ── Activity search ───────────────────────────────────────────────
  async function searchActivities() {
    if (!form.business_idea.trim()) return;
    setSearching(true);
    setMatches([]);
    setError("");
    try {
      const { data } = await modelAPI.activities(form.sector || undefined, lang);
      const words = form.business_idea.toLowerCase().split(/\s+/);
      const scored = data.activities
        .map((a: any) => ({
          ...a,
          score: words.reduce(
            (s: number, w: string) =>
              s + (a.MainActivityDescription.toLowerCase().includes(w) ? 1 : 0),
            0,
          ),
        }))
        .filter((a: any) => a.score > 0)
        .sort((a: any, b: any) => b.score - a.score || b.Count - a.Count)
        .slice(0, 8);
      setMatches(scored);
      if (!scored.length)
        setError(
          'No matches found. Try simpler words like "food", "clothes", "repair".',
        );
    } catch {
      setError(
        "Something went wrong loading business ideas. Please try again in a moment.",
      );
    } finally {
      setSearching(false);
    }
  }

  function selectActivity(act: any) {
    set("isic_detailed", act.ISIC_Detailed);
    set("activity_label", act.MainActivityDescription);
    setMatches([]);
    submitPrediction({
      ...form,
      isic_detailed: act.ISIC_Detailed,
      activity_label: act.MainActivityDescription,
    });
  }

  // ── Prior-experience search (funding_type === 'expansion') ─────────
  async function searchExperience() {
    if (!expQuery.trim()) return;
    setExpSearching(true);
    setExpMatches([]);
    try {
      const { data } = await advisoryAPI.experienceSearch(expQuery);
      setExpMatches((data.activities || []).slice(0, 8));
    } catch {
      setExpMatches([]);
    } finally {
      setExpSearching(false);
    }
  }

  function addExperienceEntry(act: any) {
    const entry: PriorExperienceEntry = {
      isic_detailed: act.ISIC_Detailed,
      activity_label: act.MainActivityDescription,
      years: expYears,
      still_active: expActive,
    };
    setForm((p) => ({
      ...p,
      prior_experience: [...p.prior_experience, entry],
    }));
    setExpQuery("");
    setExpMatches([]);
  }

  function removeExperienceEntry(idx: number) {
    setForm((p) => ({
      ...p,
      prior_experience: p.prior_experience.filter((_, i) => i !== idx),
    }));
  }

  // ── Submit ────────────────────────────────────────────────────────
  async function submitPrediction(overrides: Partial<AdvisorForm> = {}) {
    const f = { ...form, ...overrides };
    setLoading(true);
    setError("");
    setResult(null);
    setStep(4);
    const payload = {
      path_type: f.path_type,
      business_idea: f.business_idea || undefined,
      district: f.district,
      ward: f.ward || undefined,
      village: f.village || undefined,
      capital_tzs: f.capital_tzs ? parseFloat(f.capital_tzs) : undefined,
      age: f.age ? parseInt(f.age) : undefined,
      gender: f.gender || undefined,
      funding_type: f.funding_type || undefined,
      lang,
      prior_experience:
        f.funding_type === "expansion" && f.prior_experience.length > 0
          ? f.prior_experience.map((e) => ({
              isic_detailed: e.isic_detailed,
              years: parseFloat(e.years) || 0,
              still_active: e.still_active,
            }))
          : undefined,
      ...(f.path_type === "A"
        ? { isic_detailed: f.isic_detailed, workers: 1 }
        : {
            top_n: f.top_n || 5,
            sector: f.sector || undefined,
            skills: f.skills.length > 0 ? f.skills : undefined,
            hobbies: f.hobbies.length > 0 ? f.hobbies : undefined,
            risk_tolerance: f.risk_tolerance || undefined,
          }),
    };
    try {
      const { data } = await advisoryAPI.predict(payload);
      // Client-side experience-preference filter for Path B — 'experience'
      // shows only matches, 'new' shows only non-matches, 'both' (default)
      // shows the model's own boosted ranking unfiltered.
      if (
        f.path_type === "B" &&
        Array.isArray(data.recommendations) &&
        f.experience_preference !== "both"
      ) {
        const wantMatch = f.experience_preference === "experience";
        const filtered = data.recommendations.filter(
          (r: any) => !!r.matches_your_experience === wantMatch,
        );
        data.recommendations =
          filtered.length > 0 ? filtered : data.recommendations;
      }
      setResult(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Prediction failed. Please try again.",
      );
      setStep(form.path_type === "A" ? 3 : 2);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm(emptyForm);
    setResult(null);
    setError("");
    setMatches([]);
    setStep(0);
    setShowFunding(false);
    setExpQuery("");
    setExpMatches([]);
    setExpYears("1");
    setExpActive(true);
  }

  // ── Determine step count based on login state ─────────────────────
  // Logged-in users skip the personal details step (age/gender already known)
  const totalSteps = form.path_type === "A" ? (user ? 2 : 3) : user ? 2 : 3;
  const personalStep = user ? null : 2; // null means skip it

  function goFromLocation() {
    setShowFunding(true); // reveal funding-type question within Step 1, don't advance yet
  }

  function goFromFunding() {
    if (user) {
      if (form.path_type === "A") setStep(3);
      else submitPrediction();
    } else {
      setStep(2);
    }
  }

  function goFromPersonal() {
    if (form.path_type === "A") setStep(3);
    else submitPrediction();
  }

  // Show spinner while auth is resolving — prevents blank flash
  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div>
      {/* Upgrade banner for regular users */}
      {!isPremium && (
        <div
          style={{
            background: "linear-gradient(135deg, #0D3D3D 0%, #0a2a2a 100%)",
            borderBottom: "1px solid rgba(232,168,56,0.30)",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{ fontSize: 13, color: "rgba(255,255,255,0.80)", margin: 0 }}
          >
            ✨ <strong style={{ color: "#E8A838" }}>Fursa LoNet 2.5</strong> —
            faster & sharper predictions available
          </p>
          <button
            onClick={() => navigate("/upgrade")}
            style={{
              background: "#E8A838",
              color: "#1a0f00",
              fontWeight: 700,
              fontSize: 12,
              padding: "6px 18px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Upgrade — $10/mo
          </button>
        </div>
      )}
      <div
        style={{
          padding: "var(--space-8) var(--space-4)",
          maxWidth: 680,
          margin: "0 auto",
        }}
      >
        {/* Step 0: Choose path */}
        {step === 0 && (
          <div className="animate-fadeUp">
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                marginBottom: "var(--space-2)",
              }}
            >
              {user
                ? t("advisor.welcome_user").replace(
                    "{name}",
                    user.full_name?.split(" ")[0] || "",
                  )
                : t("advisor.welcome_guest")}
            </h1>
            <p
              style={{
                color: "var(--clr-text-2)",
                fontSize: "1rem",
                marginBottom: "var(--space-6)",
              }}
            >
              {t("advisor.welcome_sub")}
            </p>
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <PathCard
                variant="static"
                image={pathAThumb}
                title={t("advisor.pathA_title")}
                description={t("advisor.pathA_desc")}
                onClick={() => {
                  set("path_type", "A");
                  setStep(1);
                }}
                className="animate-fadeUp"
                style={{ animationDelay: "80ms" }}
                labelClassName="animate-fadeUp"
                labelStyle={{ animationDelay: "260ms" }}
              />
              <PathCard
                variant="static"
                image={pathBThumb}
                title={t("advisor.pathB_title")}
                description={t("advisor.pathB_desc")}
                onClick={() => {
                  set("path_type", "B");
                  setStep(1);
                }}
                className="animate-fadeUp"
                style={{ animationDelay: "200ms" }}
                labelClassName="animate-fadeUp"
                labelStyle={{ animationDelay: "380ms" }}
              />
              <PathCard
                variant="static"
                image={pathCThumb}
                title={t("advisor.pathC_title")}
                description={t("advisor.pathC_desc")}
                disabled
                disabledLabel={t("advisor.coming_soon")}
                className="animate-fadeUp"
                style={{ animationDelay: "320ms" }}
                labelClassName="animate-fadeUp"
                labelStyle={{ animationDelay: "500ms" }}
              />
              <PathCard
                variant="static"
                image={pathDThumb}
                title={t("advisor.pathD_title")}
                description={t("advisor.pathD_desc")}
                disabled
                disabledLabel={t("advisor.coming_soon")}
                className="animate-fadeUp"
                style={{ animationDelay: "440ms" }}
                labelClassName="animate-fadeUp"
                labelStyle={{ animationDelay: "620ms" }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Location + Capital (+ funding-type sub-flow, revealed after Continue) */}
        {step === 1 && (
          <StepCard
            title={t("advisor.step1_title")}
            step={1}
            total={user ? 2 : 3}
            onBack={() => (showFunding ? setShowFunding(false) : setStep(0))}
          >
            {/* Map-based district + ward + street picker */}
            <DistrictMapPicker
              district={form.district}
              ward={form.ward}
              village={form.village}
              onDistrictChange={(v) => set("district", v)}
              onWardChange={(v) => set("ward", v)}
              onVillageChange={(v) => set("village", v)}
            />

            {/* Capital is asked of EVERYONE here — it's specific to this
              business query, not a fixed profile attribute, so it can't
              be safely skipped just because someone is logged in. */}
            <Input
              label={t("advisor.capital_label")}
              name="capital_tzs"
              type="text"
              inputMode="numeric"
              prefix="TZS"
              value={formatWithCommas(form.capital_tzs)}
              min={MIN_CAPITAL}
              onChange={(e) => {
                const raw = digitsOnly(e.target.value);
                set("capital_tzs", raw);
                validateCapital(raw);
              }}
              placeholder={`e.g. 500,000 (min TZS ${MIN_CAPITAL.toLocaleString()})`}
              hint={t("advisor.capital_hint")}
              error={capError}
            />

            {form.path_type === "B" && (
              <>
                <Select
                  label={t("advisor.sector_label")}
                  name="sector"
                  value={form.sector}
                  hint={t("advisor.sector_hint")}
                  onChange={(e) => set("sector", e.target.value)}
                  options={[
                    { value: "", label: t("advisor.sector_any") },
                    ...sectors.map((s) => ({ value: s.code, label: s.name })),
                  ]}
                />
                <Select
                  label={t("advisor.suggestions_label")}
                  name="top_n"
                  value={String(form.top_n)}
                  onChange={(e) => set("top_n", parseInt(e.target.value, 10))}
                  options={SUGGESTION_COUNT_OPTIONS.map((n) => ({
                    value: String(n),
                    label: `${n} suggestions`,
                  }))}
                />
                <RiskToleranceScale
                  label={t("advisor.risk_tolerance_label")}
                  hint={t("advisor.risk_tolerance_hint")}
                  value={form.risk_tolerance}
                  onChange={(v) => set("risk_tolerance", v)}
                  levelLabels={{
                    very_low: t("advisor.risk_very_low"),
                    low: t("advisor.risk_low"),
                    average: t("advisor.risk_average"),
                    high: t("advisor.risk_high"),
                    very_high: t("advisor.risk_very_high"),
                  }}
                />
                <MultiSelectChips
                  label={t("advisor.skills_label")}
                  hint={t("advisor.skills_hint")}
                  emptyLabel={t("advisor.analysing")}
                  options={skillsList}
                  selected={form.skills}
                  onChange={(next) => set("skills", next)}
                />
                <Select
                  label={t("advisor.hobby_label")}
                  name="hobby"
                  value={form.hobbies[0] || ""}
                  hint={t("advisor.hobby_hint")}
                  onChange={(e) =>
                    set("hobbies", e.target.value ? [e.target.value] : [])
                  }
                  options={[
                    { value: "", label: t("advisor.hobby_any") },
                    ...hobbiesList.map((h) => ({ value: h.code, label: h.name })),
                  ]}
                />
              </>
            )}

            {!showFunding && (
              <Button
                variant="primary"
                fullWidth
                disabled={!form.district || !!capError}
                onClick={goFromLocation}
              >
                {t("advisor.continue")}
              </Button>
            )}

            {/* ── Funding-type question (revealed after Continue) ────── */}
            {showFunding && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-4)",
                  borderTop: "1px solid var(--clr-border)",
                  paddingTop: "var(--space-4)",
                }}
              >
                <Select
                  label={t("advisor.funding_label")}
                  name="funding_type"
                  value={form.funding_type}
                  onChange={(e) => set("funding_type", e.target.value)}
                  options={[
                    { value: "personal", label: t("advisor.funding_personal") },
                    { value: "loan", label: t("advisor.funding_loan") },
                    {
                      value: "expansion",
                      label: t("advisor.funding_expansion"),
                    },
                  ]}
                />

                {/* ── Prior-experience search (expansion only) ─────────── */}
                {form.funding_type === "expansion" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-3)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--clr-text-3)",
                        fontWeight: 700,
                        letterSpacing: ".4px",
                      }}
                    >
                      {t("advisor.experience_title")}
                    </p>

                    {form.prior_experience.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--space-2)",
                        }}
                      >
                        {form.prior_experience.map((entry, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              borderRadius: "var(--radius-sm)",
                              background: "var(--clr-bg)",
                              fontSize: 13,
                            }}
                          >
                            <span>
                              {entry.activity_label} — {entry.years} yr
                              {parseFloat(entry.years) === 1 ? "" : "s"}
                              {entry.still_active
                                ? " (still active)"
                                : " (closed)"}
                            </span>
                            <button
                              onClick={() => removeExperienceEntry(i)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--clr-text-3)",
                                cursor: "pointer",
                                fontSize: 14,
                              }}
                              aria-label="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-3)",
                        alignItems: "flex-end",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <Input
                          label={t("advisor.experience_search_label")}
                          name="exp_query"
                          value={expQuery}
                          onChange={(e) => setExpQuery(e.target.value)}
                          placeholder={t(
                            "advisor.experience_search_placeholder",
                          )}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <Input
                          label={t("advisor.experience_years")}
                          name="exp_years"
                          type="number"
                          value={expYears}
                          onChange={(e) => setExpYears(e.target.value)}
                          min={0}
                        />
                      </div>
                      <Select
                        label={t("advisor.experience_status")}
                        name="exp_active"
                        value={expActive ? "yes" : "no"}
                        onChange={(e) => setExpActive(e.target.value === "yes")}
                        options={[
                          {
                            value: "yes",
                            label: t("advisor.experience_active"),
                          },
                          {
                            value: "no",
                            label: t("advisor.experience_closed"),
                          },
                        ]}
                      />
                      <Button
                        variant="secondary"
                        loading={expSearching}
                        onClick={searchExperience}
                      >
                        {t("advisor.search")}
                      </Button>
                    </div>

                    {expMatches.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--space-2)",
                        }}
                      >
                        {expMatches.map((m) => (
                          <button
                            key={m.ISIC_Detailed}
                            onClick={() => addExperienceEntry(m)}
                            style={{
                              textAlign: "left",
                              padding: "var(--space-2) var(--space-3)",
                              borderRadius: "var(--radius-sm)",
                              border: "1.5px solid var(--clr-border)",
                              background: "var(--clr-card)",
                              cursor: "pointer",
                              color: "var(--clr-text)",
                              fontSize: 13,
                            }}
                          >
                            {m.MainActivityDescription}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        margin: "var(--space-1) 0",
                      }}
                    >
                      <div style={{ flex: 1, height: 1, background: "var(--clr-border)" }} />
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--clr-text-3)",
                          letterSpacing: ".4px",
                        }}
                      >
                        {t("advisor.or_divider")}
                      </span>
                      <div style={{ flex: 1, height: 1, background: "var(--clr-border)" }} />
                    </div>

                    <Select
                      label={t("advisor.browse_all_label")}
                      name="exp_business_browse"
                      value=""
                      hint={
                        loadingAllActivities
                          ? t("advisor.analysing")
                          : t("advisor.browse_all_hint")
                      }
                      onChange={(e) => {
                        const idx = e.target.value;
                        if (idx === "") return;
                        addExperienceEntry(allActivities[Number(idx)]);
                      }}
                      options={[
                        { value: "", label: t("advisor.browse_all_placeholder") },
                        ...allActivities.map((a: any, i: number) => ({
                          value: String(i),
                          label: a.MainActivityDescription,
                        })),
                      ]}
                    />

                    <Select
                      label={t("advisor.experience_preference_label")}
                      name="experience_preference"
                      value={form.experience_preference}
                      onChange={(e) =>
                        set("experience_preference", e.target.value)
                      }
                      options={[
                        {
                          value: "both",
                          label: t("advisor.experience_pref_both"),
                        },
                        {
                          value: "experience",
                          label: t("advisor.experience_pref_experience"),
                        },
                        {
                          value: "new",
                          label: t("advisor.experience_pref_new"),
                        },
                      ]}
                    />
                  </div>
                )}

                <Button
                  variant="primary"
                  fullWidth
                  disabled={!form.funding_type}
                  onClick={goFromFunding}
                >
                  {form.path_type === "A"
                    ? t("advisor.continue")
                    : user
                      ? t("advisor.get_recommendations")
                      : t("advisor.continue")}
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
          <StepCard
            title={t("advisor.personal_title")}
            step={2}
            total={3}
            onBack={() => setStep(1)}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <Input
                label={t("advisor.age_label")}
                name="age"
                type="number"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="e.g. 28"
                min={16}
                max={100}
              />
              <Select
                label={t("advisor.gender_label")}
                name="gender"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                options={[
                  { value: "", label: t("advisor.gender_prefer_not") },
                  { value: "male", label: t("advisor.gender_male") },
                  { value: "female", label: t("advisor.gender_female") },
                ]}
              />
            </div>
            <Button variant="primary" fullWidth onClick={goFromPersonal}>
              {form.path_type === "A"
                ? t("advisor.continue")
                : t("advisor.get_recommendations")}
            </Button>
          </StepCard>
        )}

        {/* Step 3: Business idea search (Path A) */}
        {step === 3 && (
          <StepCard
            title={t("advisor.idea_title")}
            step={user ? 2 : 3}
            total={user ? 2 : 3}
            onBack={() => setStep(user ? 1 : 2)}
          >
            <Alert type="error" message={error} />
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                alignItems: "flex-end",
              }}
            >
              <div style={{ flex: 1 }}>
                <Input
                  label={t("advisor.idea_label")}
                  name="business_idea"
                  value={form.business_idea}
                  onChange={(e) => set("business_idea", e.target.value)}
                  placeholder={t("advisor.idea_placeholder")}
                  hint={t("advisor.idea_hint")}
                />
              </div>
              <Button
                variant="secondary"
                loading={searching}
                onClick={searchActivities}
              >
                {t("advisor.search")}
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                margin: "var(--space-2) 0",
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--clr-border)" }} />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--clr-text-3)",
                  letterSpacing: ".4px",
                }}
              >
                {t("advisor.or_divider")}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--clr-border)" }} />
            </div>

            <Select
              label={t("advisor.sector_label")}
              name="sector"
              value={form.sector}
              hint={t("advisor.sector_hint")}
              onChange={(e) => set("sector", e.target.value)}
              options={[
                { value: "", label: t("advisor.sector_any") },
                ...sectors.map((s) => ({ value: s.code, label: s.name })),
              ]}
            />

            <Select
              label={t("advisor.browse_all_label")}
              name="business_idea_browse"
              value=""
              hint={
                loadingAllActivities
                  ? t("advisor.analysing")
                  : t("advisor.browse_all_hint")
              }
              onChange={(e) => {
                const idx = e.target.value;
                if (idx === "") return;
                selectActivity(allActivities[Number(idx)]);
              }}
              options={[
                { value: "", label: t("advisor.browse_all_placeholder") },
                ...allActivities.map((a: any, i: number) => ({
                  value: String(i),
                  label: a.MainActivityDescription,
                })),
              ]}
            />

            {matches.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--clr-text-3)",
                    fontWeight: 700,
                    letterSpacing: ".4px",
                  }}
                >
                  {t("advisor.select_match")}
                </p>
                {matches.map((m) => (
                  <button
                    key={m.ISIC_Detailed}
                    onClick={() => selectActivity(m)}
                    style={{
                      textAlign: "left",
                      padding: "var(--space-3) var(--space-4)",
                      borderRadius: "var(--radius-sm)",
                      border: "1.5px solid var(--clr-border)",
                      background: "var(--clr-card)",
                      cursor: "pointer",
                      transition: "var(--transition)",
                      color: "var(--clr-text)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "var(--clr-primary)";
                      e.currentTarget.style.background =
                        "var(--clr-primary-lt)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "var(--clr-border)";
                      e.currentTarget.style.background = "var(--clr-card)";
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>
                      {m.MainActivityDescription}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--clr-text-3)",
                        marginTop: 2,
                      }}
                    >
                      {m.Sector_Name}
                    </div>
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
              <div
                style={{ textAlign: "center", padding: "var(--space-16) 0" }}
              >
                <Spinner size={44} />
                <p
                  style={{
                    marginTop: "var(--space-4)",
                    color: "var(--clr-text-2)",
                  }}
                >
                  {t("advisor.analysing")}
                </p>
              </div>
            )}
            {!loading && error && (
              <Card>
                <Alert type="error" message={error} />
                <Button
                  style={{ marginTop: "var(--space-4)" }}
                  onClick={() =>
                    setStep(form.path_type === "A" ? 3 : user ? 1 : 2)
                  }
                >
                  {t("advisor.try_again")}
                </Button>
              </Card>
            )}
            {!loading && result && result.blocked && (
              <Card
                style={{
                  background: "var(--clr-warning-lt)",
                  border: "1px solid var(--clr-warning)",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--clr-warning)",
                    letterSpacing: ".4px",
                    marginBottom: 8,
                  }}
                >
                  {t("advisor.capital_blocked_title")}
                </p>
                <p style={{ fontSize: 15 }}>{result.message}</p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--clr-text-2)",
                    marginTop: 8,
                  }}
                >
                  {t("advisor.capital_blocked_min")}{" "}
                  <strong>
                    TZS {Number(result.min_capital_tzs).toLocaleString()}
                  </strong>
                </p>
                <Button
                  style={{ marginTop: "var(--space-4)" }}
                  onClick={() => setStep(form.path_type === "A" ? 3 : 1)}
                >
                  {t("advisor.capital_blocked_retry")}
                </Button>
              </Card>
            )}
            {!loading && result && !result.blocked && (
              <>
                {form.path_type === "A" ? (
                  <PathAResult
                    result={result}
                    activityLabel={form.activity_label}
                    fundingType={form.funding_type}
                    isPremium={isPremium}
                  />
                ) : (
                  <PathBResult
                    result={result}
                    fundingType={form.funding_type}
                    isPremium={isPremium}
                  />
                )}
                {form.funding_type === "loan" && (
                  <MicrofinancePanel
                    defaultRiskTier={
                      form.path_type === "A"
                        ? result.risk_tier
                        : result.recommendations?.[0]?.risk_tier || "Medium"
                    }
                  />
                )}
                {result.saved && (
                  <p
                    style={{
                      textAlign: "center",
                      marginTop: "var(--space-4)",
                      fontSize: "13px",
                      color: "var(--clr-success)",
                    }}
                  >
                    {t("advisor.saved_premium")}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "var(--space-3)",
                    marginTop: "var(--space-8)",
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setStep(form.path_type === "A" ? 3 : user ? 1 : 2)
                    }
                  >
                    {t("advisor.back_to_edit")}
                  </Button>
                  <Button variant="secondary" onClick={reset}>
                    {t("advisor.new_query")}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────

// Shared Y-axis tick formatter for TZS values — always returns a string
// (Recharts' tickFormatter type requires a string return in all branches).
function formatTzsTick(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v.toString();
}

function StepCard({
  title,
  step,
  total,
  onBack,
  children,
}: {
  title: string;
  step: number;
  total: number;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fadeUp">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          marginBottom: "var(--space-5)",
        }}
      >
        <button
          onClick={onBack}
          aria-label="Go back"
          title="Go back"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: "50%",
            border: "1.5px solid var(--clr-primary)",
            background: "var(--clr-primary-lt)",
            cursor: "pointer",
            color: "var(--clr-primary)",
            transition: "opacity .15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--clr-text-3)",
              fontWeight: 700,
              letterSpacing: ".5px",
            }}
          >
            STEP {step} OF {total}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.3rem,3vw,1.7rem)",
            }}
          >
            {title}
          </h2>
        </div>
      </div>
      <Card
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
        }}
      >
        {children}
      </Card>
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: "var(--clr-bg)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--space-4)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.1rem,2.5vw,1.5rem)",
          color: "var(--clr-primary)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--clr-text-3)",
          marginTop: 3,
          fontWeight: 600,
          letterSpacing: ".3px",
        }}
      >
        {label.toUpperCase()}
      </div>
      {sub && (
        <div
          style={{ fontSize: "11px", color: "var(--clr-text-3)", marginTop: 1 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function PathAResult({
  result,
  activityLabel,
  fundingType,
  isPremium,
}: {
  result: any;
  activityLabel: string;
  fundingType?: string;
  isPremium?: boolean;
}) {
  const { t } = useLanguage();
  const fmt = (n: any) => (n ? Number(n).toLocaleString() : "—");
  const chartBorderColor = resolveCssVar("--clr-border", "#E5E7EB");
  const chartTextMutedColor = resolveCssVar("--clr-text-3", "#9CA3AF");
  const chartTextColor2 = resolveCssVar("--clr-text-2", "#4B5563");
  const chartData = [
    {
      name: t("chart.capital"),
      value: Number(result.startup_capital_tzs) || 0,
    },
    {
      name: t("chart.annual_profit"),
      value: (Number(result.expected_monthly_profit_tzs) || 0) * 12,
    },
  ];

  const chartsRef = React.useRef<HTMLDivElement>(null);
  const exportRows: ReportRow[] = [
    {
      activity: activityLabel || result.activity,
      sector: result.sector,
      success_chance: result.success_chance,
      startup_capital_tzs: Number(result.startup_capital_tzs) || 0,
      expected_monthly_profit_tzs: Number(result.expected_monthly_profit_tzs) || 0,
      roi_percent_per_year: Number(result.roi_percent_per_year) || 0,
      breakeven_months: Number(result.breakeven_months) || 0,
      existing_similar_businesses_in_area: result.existing_similar_businesses_in_area,
    },
  ];
  const exportMeta: ReportMeta = {
    reportTitle: t("export.report_title"),
    generatedOnLabel: t("export.generated_on"),
    generatedOn: new Date().toLocaleDateString(),
    locationLabel: t("export.location"),
    location: [result.location?.ward, result.location?.district]
      .filter(Boolean)
      .join(", "),
    capitalLabel: t("export.capital"),
    capital: `TZS ${Math.round(Number(result.startup_capital_tzs) || 0).toLocaleString()}`,
    summaryHeading: t("export.summary_heading"),
    summaryIntro: t("export.summary_intro"),
    disclaimer: t("export.disclaimer"),
    columns: {
      activity: t("advisor.activity_col"),
      sector: t("export.sector_col"),
      successChance: t("export.success_col"),
      capital: t("advisor.capital_col"),
      monthlyProfit: t("advisor.monthly_profit"),
      annualProfit: t("chart.annual_profit"),
      roi: t("advisor.roi_year"),
      breakeven: t("advisor.breakeven"),
      competition: t("advisor.similar_nearby"),
    },
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ExportMenu
          rows={exportRows}
          meta={exportMeta}
          filenameBase={`fursa_analysis_${activityLabel || "business"}`}
          chartsContainerRef={chartsRef}
          t={t}
        />
      </div>
      <div ref={chartsRef}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "11px",
                color: "var(--clr-text-3)",
                fontWeight: 700,
                marginBottom: 4,
                letterSpacing: ".4px",
              }}
            >
              {t("advisor.business_activity")}
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.2rem,3vw,1.5rem)",
                wordBreak: "break-word",
              }}
            >
              {activityLabel || result.activity}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--clr-text-2)",
                marginTop: 4,
              }}
            >
              {result.sector}
            </p>
          </div>
          <div
            style={{
              textAlign: "right",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--clr-text-3)",
                  fontWeight: 700,
                  marginBottom: 4,
                  letterSpacing: ".4px",
                }}
              >
                {t("advisor.success_chance")}
              </p>
              <TierBadge label={result.success_chance} />
            </div>
            {fundingType === "loan" && result.risk_tier && (
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--clr-text-3)",
                    fontWeight: 700,
                    marginBottom: 4,
                    letterSpacing: ".4px",
                  }}
                >
                  {t("advisor.loan_risk")}
                </p>
                <TierBadge label={result.risk_tier} />
              </div>
            )}
          </div>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
          gap: "var(--space-3)",
        }}
      >
        <StatBox
          label={t("advisor.starting_capital")}
          value={`TZS ${fmt(result.startup_capital_tzs)}`}
          sub={
            result.capital_source?.includes("typical")
              ? t("advisor.typical")
              : t("advisor.your_amount")
          }
        />
        <StatBox
          label={t("advisor.monthly_profit")}
          value={`TZS ${fmt(result.expected_monthly_profit_tzs)}`}
        />
        <StatBox
          label={t("advisor.roi_year")}
          value={`${result.roi_percent_per_year}%`}
        />
        <StatBox
          label={t("advisor.breakeven")}
          value={`${result.breakeven_months} ${t("advisor.months_unit")}`}
        />
      </div>

      <Card>
        <p
          style={{
            fontSize: "12px",
            color: "var(--clr-text-3)",
            fontWeight: 700,
            marginBottom: "var(--space-3)",
            letterSpacing: ".4px",
          }}
        >
          {t("chart.capital_vs_return")}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartBorderColor} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: chartTextColor2 }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: chartTextMutedColor }}
              tickFormatter={formatTzsTick}
            />
            <Tooltip
              formatter={(v: any) => `TZS ${Number(v).toLocaleString()}`}
              contentStyle={{
                background: "var(--clr-card)",
                border: "1px solid var(--clr-border)",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Bar
              dataKey="value"
              fill="#0D6E6E"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {isPremium && (
        <Card>
          <p
            style={{
              fontSize: "12px",
              color: "var(--clr-text-3)",
              fontWeight: 700,
              marginBottom: "var(--space-3)",
              letterSpacing: ".4px",
            }}
          >
            {t("advisor.growth_trajectory_title")}
          </p>
          <BusinessTrendChart
            capitalTzs={Number(result.startup_capital_tzs) || 0}
            monthlyProfitTzs={Number(result.expected_monthly_profit_tzs) || 0}
            breakevenMonths={Number(result.breakeven_months) || 0}
            t={t}
          />
        </Card>
      )}

      <Card>
        <p
          style={{
            fontSize: "12px",
            color: "var(--clr-text-3)",
            fontWeight: 700,
            marginBottom: "var(--space-3)",
            letterSpacing: ".4px",
          }}
        >
          {t("advisor.competition_title")}
        </p>
        <p style={{ fontSize: "15px" }}>
          {t("advisor.competition_prefix")}{" "}
          <strong>{result.existing_similar_businesses_in_area}</strong>{" "}
          {t("advisor.competition_suffix")}{" "}
          {result.existing_similar_businesses_in_area < 5
            ? t("advisor.competition_low")
            : result.existing_similar_businesses_in_area < 20
              ? t("advisor.competition_medium")
              : t("advisor.competition_high")}
        </p>
      </Card>

      {result.warnings?.length > 0 && (
        <Card
          style={{
            background: "var(--clr-warning-lt)",
            border: "1px solid var(--clr-warning)",
          }}
        >
          {result.warnings.map((w: string, i: number) => (
            <p
              key={i}
              style={{ fontSize: "14px", color: "var(--clr-warning)" }}
            >
              ⚠ {w}
            </p>
          ))}
        </Card>
      )}
      </div>

      <ConsultantPanel
        payload={{
          activity: activityLabel || result.activity,
          sector: result.sector,
          district: result.location?.district,
          ward: result.location?.ward,
          capital_tzs: result.startup_capital_tzs,
          monthly_profit: result.expected_monthly_profit_tzs,
          success_chance: result.success_chance,
          existing_similar_businesses_in_area:
            result.existing_similar_businesses_in_area,
          roi_percent: result.roi_percent_per_year,
          breakeven_months: result.breakeven_months,
        }}
      />
    </div>
  );
}

export function PathBResult({
  result,
  fundingType,
  isPremium,
}: {
  result: any;
  fundingType?: string;
  isPremium?: boolean;
}) {
  const { t } = useLanguage();
  const fmt = (n: any) => (n ? Number(n).toLocaleString() : "—");
  const recs = result.recommendations || [];
  const count = recs.length;

  // ── Tier filter + mini-tab pagination — with up to 50 suggestions,
  // a single long vertical list is unusable, so this splits the
  // (optionally filtered) list into fixed-size pages browsable via
  // small numbered tabs instead of continuous scrolling. ────────────
  const [tierFilter, setTierFilter] = useState("");
  const [page, setPage] = useState(0);

  // ── List / detail view — hovering a card in the list shows a quick
  // preview in the side panel; clicking it opens that business as its
  // own full-page view (not an inline section at the bottom of the
  // list), with a way back to the list. ─────────────────────────────
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const detailRef = React.useRef<HTMLDivElement>(null);

  const filteredRecs =
    tierFilter === ""
      ? recs
      : recs.filter((r: any) => r.success_chance === tierFilter);

  const pageCount = Math.max(1, Math.ceil(filteredRecs.length / REC_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRecs = filteredRecs.slice(
    safePage * REC_PAGE_SIZE,
    safePage * REC_PAGE_SIZE + REC_PAGE_SIZE,
  );

  // Normalize each card's mini performance chart against the best on
  // this page, so bars are comparable at a glance rather than each
  // card scaling to its own numbers in isolation.
  const pageMaxProfit = Math.max(
    1,
    ...pageRecs.map((r: any) => Number(r.expected_monthly_profit_tzs) || 0),
  );
  const pageMaxRoi = Math.max(
    1,
    ...pageRecs.map((r: any) => Number(r.roi_percent_per_year) || 0),
  );
  const pageMinBreakeven = Math.min(
    ...pageRecs
      .map((r: any) => Number(r.breakeven_months) || Infinity)
      .filter((v: number) => v !== Infinity),
    Infinity,
  );

  function onTierFilterChange(v: string) {
    setTierFilter(v);
    setPage(0);
    setActiveIdx(0);
  }

  function openBusiness(idx: number) {
    setActiveIdx(idx);
    setViewMode("detail");
  }

  function backToList() {
    setViewMode("list");
    setHoveredIdx(null);
  }

  useEffect(() => {
    // A page or filter change while a detail page is open would leave
    // it pointing at a card that's no longer on this page — safest to
    // drop back to the list rather than show the wrong business.
    setViewMode("list");
    setActiveIdx(0);
    setHoveredIdx(null);
  }, [safePage, tierFilter]);

  useEffect(() => {
    if (viewMode === "detail") {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [viewMode, activeIdx]);

  const activeRec = pageRecs[Math.min(activeIdx, Math.max(0, pageRecs.length - 1))];

  const chartsRef = React.useRef<HTMLDivElement>(null);
  const exportRows: ReportRow[] = recs.map((r: any) => ({
    activity: r.activity,
    sector: r.sector,
    success_chance: r.success_chance,
    startup_capital_tzs: Number(r.startup_capital_tzs) || 0,
    expected_monthly_profit_tzs: Number(r.expected_monthly_profit_tzs) || 0,
    roi_percent_per_year: Number(r.roi_percent_per_year) || 0,
    breakeven_months: Number(r.breakeven_months) || 0,
    existing_similar_businesses_in_area: r.existing_similar_businesses_in_area,
  }));
  const exportMeta: ReportMeta = {
    reportTitle: t("export.report_title"),
    generatedOnLabel: t("export.generated_on"),
    generatedOn: new Date().toLocaleDateString(),
    locationLabel: t("export.location"),
    location: [result.location?.ward, result.location?.district]
      .filter(Boolean)
      .join(", "),
    capitalLabel: t("export.capital"),
    capital: exportRows[0]
      ? `TZS ${Math.round(
          exportRows.reduce((s, r) => s + r.startup_capital_tzs, 0) / exportRows.length,
        ).toLocaleString()} (avg)`
      : "—",
    summaryHeading: t("export.summary_heading"),
    summaryIntro: t("export.summary_intro"),
    disclaimer: t("export.disclaimer"),
    columns: {
      activity: t("advisor.activity_col"),
      sector: t("export.sector_col"),
      successChance: t("export.success_col"),
      capital: t("advisor.capital_col"),
      monthlyProfit: t("advisor.monthly_profit"),
      annualProfit: t("chart.annual_profit"),
      roi: t("advisor.roi_year"),
      breakeven: t("advisor.breakeven"),
      competition: t("advisor.similar_nearby"),
    },
  };

  // ── Per-business export — same shape as the full-list export above,
  // scoped to whichever business's detail page is currently open, so a
  // person can grab just the one business they care about instead of
  // the whole recommendation set. ────────────────────────────────────
  const activeExportRows: ReportRow[] = activeRec
    ? [
        {
          activity: activeRec.activity,
          sector: activeRec.sector,
          success_chance: activeRec.success_chance,
          startup_capital_tzs: Number(activeRec.startup_capital_tzs) || 0,
          expected_monthly_profit_tzs:
            Number(activeRec.expected_monthly_profit_tzs) || 0,
          roi_percent_per_year: Number(activeRec.roi_percent_per_year) || 0,
          breakeven_months: Number(activeRec.breakeven_months) || 0,
          existing_similar_businesses_in_area:
            activeRec.existing_similar_businesses_in_area,
        },
      ]
    : [];
  const activeExportMeta: ReportMeta = {
    ...exportMeta,
    capital: activeRec
      ? `TZS ${Math.round(Number(activeRec.startup_capital_tzs) || 0).toLocaleString()}`
      : exportMeta.capital,
  };

  if (viewMode === "detail" && activeRec) {
    return (
      <div
        ref={detailRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          scrollMarginTop: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <button
            onClick={backToList}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              color: "var(--clr-primary)",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              padding: "6px 2px",
            }}
          >
            <ArrowLeft size={16} />
            {t("advisor.back_to_list")}
          </button>
          <ExportMenu
            rows={activeExportRows}
            meta={activeExportMeta}
            filenameBase={`fursa_business_${activeRec.activity || "recommendation"}`}
            chartsContainerRef={chartsRef}
            t={t}
          />
        </div>

        <div ref={chartsRef} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Card style={{ border: "1.5px solid var(--clr-accent, var(--clr-primary))" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: "var(--space-3)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--clr-text-3)",
                    letterSpacing: ".4px",
                    marginBottom: 4,
                  }}
                >
                  {t("advisor.deep_dive_title")}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.15rem,2.8vw,1.5rem)",
                    wordBreak: "break-word",
                  }}
                >
                  {activeRec.activity}
                </h3>
                <span style={{ fontSize: 13, color: "var(--clr-text-2)" }}>
                  {activeRec.sector}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <TierBadge label={activeRec.success_chance} />
                {fundingType === "loan" && activeRec.risk_tier && (
                  <TierBadge label={`${activeRec.risk_tier} ${t("advisor.risk_suffix")}`} />
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
                gap: "var(--space-2)",
              }}
            >
              {[
                [t("advisor.capital_col"), `TZS ${fmt(activeRec.startup_capital_tzs)}`],
                [t("advisor.profit_col"), `TZS ${fmt(activeRec.expected_monthly_profit_tzs)}`],
                [t("advisor.roi_col"), `${activeRec.roi_percent_per_year}%`],
                [
                  t("advisor.breakeven_col"),
                  `${activeRec.breakeven_months} ${t("advisor.months_unit")}`,
                ],
              ].map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    background: "var(--clr-bg)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--clr-text-3)", fontWeight: 700 }}>
                    {l}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12.5, color: "var(--clr-text-3)", marginTop: "var(--space-3)" }}>
              {activeRec.existing_similar_businesses_in_area} {t("advisor.similar_nearby")}
            </p>
            {activeRec.warning && (
              <p style={{ fontSize: 12.5, color: "var(--clr-warning)", marginTop: "var(--space-2)" }}>
                ⚠ {activeRec.warning}
              </p>
            )}
          </Card>

          {isPremium ? (
            <>
              <BusinessPieCharts
                activity={activeRec.activity}
                startupCapitalTzs={Number(activeRec.startup_capital_tzs) || 0}
                monthlyProfitTzs={Number(activeRec.expected_monthly_profit_tzs) || 0}
                breakevenMonths={Number(activeRec.breakeven_months) || 0}
                existingSimilarBusinesses={
                  Number(activeRec.existing_similar_businesses_in_area) || 0
                }
                t={t}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "var(--space-4)",
                }}
              >
                <Card>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--clr-text-3)",
                      fontWeight: 700,
                      marginBottom: "var(--space-3)",
                      letterSpacing: ".4px",
                    }}
                  >
                    {t("chart.profit_comparison")}
                  </p>
                  <PerformanceMiniChart
                    profit={Number(activeRec.expected_monthly_profit_tzs) || 0}
                    roi={Number(activeRec.roi_percent_per_year) || 0}
                    breakevenMonths={Number(activeRec.breakeven_months) || 0}
                    pageMaxProfit={pageMaxProfit}
                    pageMaxRoi={pageMaxRoi}
                    pageMinBreakeven={pageMinBreakeven}
                    labels={{
                      profit: t("chart.profit"),
                      roi: t("chart.roi"),
                      speed: t("chart.speed"),
                      tapHint: t("chart.tap_for_details"),
                    }}
                  />
                </Card>
                <Card>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--clr-text-3)",
                      fontWeight: 700,
                      marginBottom: "var(--space-3)",
                      letterSpacing: ".4px",
                    }}
                  >
                    {t("advisor.growth_trajectory_title")}
                  </p>
                  <BusinessTrendChart
                    capitalTzs={Number(activeRec.startup_capital_tzs) || 0}
                    monthlyProfitTzs={Number(activeRec.expected_monthly_profit_tzs) || 0}
                    breakevenMonths={Number(activeRec.breakeven_months) || 0}
                    t={t}
                  />
                </Card>
              </div>
            </>
          ) : (
            <PremiumAnalysisLocked t={t} />
          )}
        </div>

        <ConsultantPanel
          payload={{
            activity: activeRec.activity,
            sector: activeRec.sector,
            district: result.location?.district,
            ward: result.location?.ward,
            capital_tzs: activeRec.startup_capital_tzs,
            monthly_profit: activeRec.expected_monthly_profit_tzs,
            success_chance: activeRec.success_chance,
            existing_similar_businesses_in_area:
              activeRec.existing_similar_businesses_in_area,
            roi_percent: activeRec.roi_percent_per_year,
            breakeven_months: activeRec.breakeven_months,
          }}
        />

        <button
          onClick={backToList}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            color: "var(--clr-primary)",
            fontSize: 13.5,
            fontWeight: 700,
            cursor: "pointer",
            padding: "6px 2px",
          }}
        >
          <ArrowLeft size={16} />
          {t("advisor.back_to_list")}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ExportMenu
          rows={exportRows}
          meta={exportMeta}
          filenameBase={`fursa_recommendations_${result.location?.district || ""}`}
          chartsContainerRef={chartsRef}
          t={t}
        />
      </div>
      <div ref={chartsRef}>
      <div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.4rem,3vw,1.8rem)",
            marginBottom: "var(--space-2)",
          }}
        >
          {t("advisor.recommended_title")}
        </h2>
        <p style={{ color: "var(--clr-text-2)", fontSize: "14px" }}>
          {count} {t("advisor.recommended_count_suffix")}
        </p>
        {count > 1 && (
          <p
            style={{
              color: "var(--clr-text-3)",
              fontSize: "12.5px",
              marginTop: 4,
            }}
          >
            {t("advisor.select_business_hint")}
          </p>
        )}
      </div>

      {count > 1 && (
        <div>
          {isPremium ? (
            <PremiumAnalysisPanel
              recs={recs}
              activeTier={tierFilter}
              onTierClick={onTierFilterChange}
              t={t}
              formatTzsTick={formatTzsTick}
            />
          ) : (
            <PremiumAnalysisLocked t={t} />
          )}
        </div>
      )}

      {count > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--clr-text-3)",
                letterSpacing: ".4px",
              }}
            >
              {t("advisor.tier_filter_label")}
            </span>
            <TierSelect
              value={tierFilter}
              onChange={onTierFilterChange}
              allLabel={t("advisor.tier_filter_all")}
            />
          </div>

          {pageCount > 1 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                maxWidth: "100%",
              }}
            >
              {Array.from({ length: pageCount }, (_, i) => i).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    minWidth: 30,
                    padding: "5px 8px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 12,
                    fontWeight: safePage === p ? 700 : 500,
                    cursor: "pointer",
                    border: `1.5px solid ${safePage === p ? "var(--clr-primary)" : "var(--clr-border)"}`,
                    background:
                      safePage === p ? "var(--clr-primary-lt)" : "var(--clr-card)",
                    color:
                      safePage === p ? "var(--clr-primary)" : "var(--clr-text-2)",
                  }}
                  title={`${t("advisor.page_label")} ${p + 1}`}
                >
                  {p + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filteredRecs.length === 0 && (
        <Card>
          <p style={{ fontSize: 14, color: "var(--clr-text-2)" }}>
            {t("advisor.no_matches")}
          </p>
        </Card>
      )}

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
      <div
        style={{
          flex: "2 1 480px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "var(--space-4)",
          alignContent: "start",
        }}
      >
        {pageRecs.map((rec: any, i: number) => {
        const isHovered = i === hoveredIdx;
        return (
        <Card
          key={safePage * REC_PAGE_SIZE + i}
          className="clay-card"
          onClick={() => openBusiness(i)}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx((h) => (h === i ? null : h))}
          onFocus={() => setHoveredIdx(i)}
          role="button"
          tabIndex={0}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openBusiness(i);
            }
          }}
          style={{
            borderLeft: `4px solid ${isHovered ? "var(--clr-accent, var(--clr-primary))" : "var(--clr-primary)"}`,
            cursor: "pointer",
            outline: isHovered ? "2px solid var(--clr-accent, var(--clr-primary))" : "none",
            outlineOffset: 2,
            transition: "outline-color .15s ease, transform .1s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "var(--space-3)",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--clr-text-3)",
                }}
              >
                #{safePage * REC_PAGE_SIZE + i + 1}
              </span>
              {rec.matches_your_experience && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--clr-primary)",
                    letterSpacing: ".3px",
                  }}
                >
                  {t("advisor.based_on_experience")}
                </span>
              )}
              {rec.matches_your_skills && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--clr-accent)",
                    letterSpacing: ".3px",
                  }}
                >
                  {t("advisor.based_on_skills")}
                </span>
              )}
              {rec.matches_your_hobbies && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--clr-success)",
                    letterSpacing: ".3px",
                  }}
                >
                  {t("advisor.based_on_hobby")}
                </span>
              )}
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1rem,2.5vw,1.15rem)",
                  margin: "2px 0",
                  wordBreak: "break-word",
                }}
              >
                {rec.activity}
              </h3>
              <span style={{ fontSize: "13px", color: "var(--clr-text-2)" }}>
                {rec.sector}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "flex-end",
              }}
            >
              <TierBadge label={rec.success_chance} />
              {fundingType === "loan" && rec.risk_tier && (
                <TierBadge label={`${rec.risk_tier} ${t("advisor.risk_suffix")}`} />
              )}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
              gap: "var(--space-2)",
            }}
          >
            {[
              [t("advisor.capital_col"), `TZS ${fmt(rec.startup_capital_tzs)}`],
              [
                t("advisor.profit_col"),
                `TZS ${fmt(rec.expected_monthly_profit_tzs)}`,
              ],
              [t("advisor.roi_col"), `${rec.roi_percent_per_year}%`],
              [
                t("advisor.breakeven_col"),
                `${rec.breakeven_months} ${t("advisor.months_unit")}`,
              ],
            ].map(([l, v]) => (
              <div
                key={l}
                style={{
                  background: "var(--clr-bg)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--clr-text-3)",
                    fontWeight: 700,
                    letterSpacing: ".3px",
                  }}
                >
                  {String(l).toUpperCase()}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "var(--clr-text)",
                    marginTop: 2,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--clr-text-3)",
              marginTop: "var(--space-3)",
            }}
          >
            {rec.existing_similar_businesses_in_area}{" "}
            {t("advisor.similar_nearby")}
          </p>
          {rec.warning && (
            <p
              style={{
                fontSize: "12px",
                color: "var(--clr-warning)",
                marginTop: "var(--space-2)",
              }}
            >
              ⚠ {rec.warning}
            </p>
          )}
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: isHovered ? "var(--clr-accent, var(--clr-primary))" : "var(--clr-text-3)",
              marginTop: "var(--space-3)",
            }}
          >
            {t("advisor.tap_for_analysis")}
          </p>
        </Card>
        );
        })}
      </div>

      {/* ── Hover preview aside — a quick look at whichever business is
          currently hovered, before committing to opening its full page.
          On narrow layouts this simply wraps below the list. ─────────── */}
      <div className="advisor-preview-aside" style={{ flex: "1 1 280px", position: "sticky", top: 84, minWidth: 260 }}>
        <Card style={{ minHeight: 220 }}>
          {hoveredIdx !== null && pageRecs[hoveredIdx] ? (
            <BusinessPreviewMini rec={pageRecs[hoveredIdx]} isPremium={isPremium} fmt={fmt} t={t} />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: 220,
                gap: 6,
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--clr-text-2)" }}>
                {t("advisor.select_business_title")}
              </p>
              <p style={{ fontSize: 12.5, color: "var(--clr-text-3)" }}>
                {t("advisor.select_business_hint")}
              </p>
            </div>
          )}
        </Card>
      </div>
      </div>
      </div>
    </div>
  );
}

// ── AI Consultant panel — lazy: fetches only when the person clicks ──
// ── AI Consultant panel — loads automatically as soon as a business's
// detail page opens (no click required), including a live web search
// for real nearby competition. ──────────────────────────────────────
function ConsultantPanel({ payload }: { payload: any }) {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  async function explain() {
    setLoading(true);
    setErr("");
    try {
      const { data: res } = await consultantAPI.analyze({
        ...payload,
        language: lang,
      });
      setData(res);
    } catch (e: any) {
      setErr(e.response?.data?.error || t("consultant.unavailable"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    explain();
    // Runs once when this business's detail page mounts — payload
    // identifies a single, specific business and doesn't change under
    // an already-mounted instance of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ marginTop: "var(--space-3)" }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--clr-text-3)",
          letterSpacing: ".4px",
          marginBottom: "var(--space-2)",
        }}
      >
        {t("consultant.title")}
      </p>

      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "var(--space-3) 0",
            color: "var(--clr-text-2)",
            fontSize: 13.5,
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "2px solid var(--clr-border)",
              borderTopColor: "var(--clr-primary)",
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
            }}
          />
          {t("consultant.loading")}
        </div>
      )}

      {!loading && err && (
        <div>
          <Alert type="error" message={err} />
          <Button variant="secondary" onClick={explain} style={{ marginTop: "var(--space-2)" }}>
            {t("consultant.retry")}
          </Button>
        </div>
      )}

      {!loading && data && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--clr-text-3)",
                letterSpacing: ".4px",
              }}
            >
              {t("consultant.3month")}
            </p>
            <p style={{ fontSize: 14 }}>{data.three_month_outlook}</p>
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--clr-text-3)",
                letterSpacing: ".4px",
              }}
            >
              {t("consultant.6month")}
            </p>
            <p style={{ fontSize: 14 }}>{data.six_month_outlook}</p>
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--clr-text-3)",
                letterSpacing: ".4px",
              }}
            >
              {t("consultant.12month")}
            </p>
            <p style={{ fontSize: 14 }}>{data.twelve_month_outlook}</p>
          </div>
          {data.real_world_competition?.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--clr-text-3)",
                  letterSpacing: ".4px",
                  marginBottom: 4,
                }}
              >
                {t("consultant.competition_title")}
              </p>
              <ul style={{ paddingLeft: 18, fontSize: 14 }}>
                {data.real_world_competition.map((c: string, i: number) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {c}
                  </li>
                ))}
              </ul>
              <p
                style={{
                  fontSize: 10.5,
                  color: "var(--clr-text-3)",
                  fontStyle: "italic",
                }}
              >
                {t("consultant.competition_disclaimer")}
              </p>
            </div>
          )}
          {data.first_30_days?.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--clr-text-3)",
                  letterSpacing: ".4px",
                  marginBottom: 4,
                }}
              >
                {t("consultant.first30")}
              </p>
              <ol style={{ paddingLeft: 18, fontSize: 14 }}>
                {data.first_30_days.map((step: string, i: number) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {data.supplier_guidance && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--clr-text-3)",
                  letterSpacing: ".4px",
                }}
              >
                {t("consultant.suppliers")}
              </p>
              <p style={{ fontSize: 14 }}>{data.supplier_guidance}</p>
            </div>
          )}
          {data.risk_factors_outside_the_model?.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--clr-text-3)",
                  letterSpacing: ".4px",
                  marginBottom: 4,
                }}
              >
                {t("consultant.risks")}
              </p>
              <ul style={{ paddingLeft: 18, fontSize: 14 }}>
                {data.risk_factors_outside_the_model.map(
                  (r: string, i: number) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      {r}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
          <p
            style={{
              fontSize: 11,
              color: "var(--clr-text-3)",
              fontStyle: "italic",
            }}
          >
            {data.generated_by}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Microfinance panel (loan funding path) ────────────────────────
function MicrofinancePanel({ defaultRiskTier }: { defaultRiskTier: string }) {
  const { t, lang } = useLanguage();
  const [tier, setTier] = useState(defaultRiskTier || "Medium");
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [err, setErr] = useState("");

  const TIER_LABEL: Record<string, string> = {
    Low: t("microfinance.risk_low"),
    Medium: t("microfinance.risk_medium"),
    High: t("microfinance.risk_high"),
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr("");
    microfinanceAPI
      .list(tier, lang)
      .then(({ data }: any) => {
        if (!cancelled) setInstitutions(data.institutions || []);
      })
      .catch(() => {
        if (!cancelled) setErr(t("microfinance.error"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tier, lang]);

  return (
    <Card style={{ marginTop: "var(--space-4)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: "var(--space-3)",
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--clr-text-3)",
            letterSpacing: ".4px",
          }}
        >
          {t("microfinance.title")}
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          {["Low", "Medium", "High"].map((tierOption) => (
            <button
              key={tierOption}
              onClick={() => setTier(tierOption)}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 12,
                cursor: "pointer",
                border: `1.5px solid ${tier === tierOption ? "var(--clr-primary)" : "var(--clr-border)"}`,
                background:
                  tier === tierOption
                    ? "var(--clr-primary-lt)"
                    : "var(--clr-card)",
                color:
                  tier === tierOption
                    ? "var(--clr-primary)"
                    : "var(--clr-text-2)",
                fontWeight: tier === tierOption ? 700 : 400,
              }}
            >
              {TIER_LABEL[tierOption]}
            </button>
          ))}
        </div>
      </div>
      {loading && <Spinner size={24} />}
      {err && <Alert type="error" message={err} />}
      {!loading && !err && institutions.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--clr-text-3)" }}>
          {t("microfinance.none_found")}
        </p>
      )}
      {!loading &&
        institutions.map((inst: any) => (
          <div
            key={inst.id}
            style={{
              padding: "10px 0",
              borderTop: "1px solid var(--clr-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <strong style={{ fontSize: 14 }}>{inst.name}</strong>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--clr-text-3)",
                  textTransform: "uppercase",
                }}
              >
                {inst.type.replace("_", " ")}
              </span>
            </div>
            <p
              style={{ fontSize: 13, color: "var(--clr-text-2)", marginTop: 4 }}
            >
              {inst.eligibility_summary}
            </p>
            {(inst.min_loan_tzs || inst.max_loan_tzs) && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--clr-text-3)",
                  marginTop: 4,
                }}
              >
                {t("microfinance.loan_range")} TZS{" "}
                {inst.min_loan_tzs
                  ? Number(inst.min_loan_tzs).toLocaleString()
                  : "—"}
                {" – "}
                {inst.max_loan_tzs
                  ? Number(inst.max_loan_tzs).toLocaleString()
                  : "varies"}
              </p>
            )}
            {inst.website && (
              <a
                href={inst.website}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: "var(--clr-primary)" }}
              >
                {t("microfinance.visit")}
              </a>
            )}
          </div>
        ))}
      <p
        style={{
          fontSize: 11,
          color: "var(--clr-text-3)",
          marginTop: "var(--space-3)",
          fontStyle: "italic",
        }}
      >
        {t("microfinance.disclaimer")}
      </p>
    </Card>
  );
}
