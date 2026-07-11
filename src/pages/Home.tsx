import { useNavigate } from "react-router-dom"
import { Hero } from "../components/sections/hero"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <div style={{ background: "var(--clr-bg)", color: "var(--clr-text)" }}>

      <Hero showCreateAccount={!user} />

      {/* ── How it works ── */}
      <section style={{
        padding: "72px 24px",
        background: "var(--clr-bg)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.8px",
            textTransform: "uppercase", color: "var(--clr-primary)",
            marginBottom: 12,
          }}>{t('home.how_eyebrow')}</p>

          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
            lineHeight: 1.2, color: "var(--clr-text)",
            marginBottom: 16,
          }}>{t('home.how_title')}</h2>

          <p style={{
            fontSize: "clamp(0.9rem, 1.8vw, 1rem)",
            color: "var(--clr-text-2)", lineHeight: 1.75,
            maxWidth: 500, margin: "0 auto",
          }}>
            {t('home.how_body')}
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: "var(--clr-primary-lt)",
        borderTop: "1px solid var(--clr-border)",
        padding: "72px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            color: "var(--clr-text)", lineHeight: 1.25, marginBottom: 14,
          }}>{t('home.cta_title')}</h2>

          <p style={{
            fontSize: "clamp(0.88rem, 1.8vw, 0.97rem)",
            color: "var(--clr-text-2)", lineHeight: 1.72, marginBottom: 32,
          }}>
            {t('home.cta_body')}
          </p>

          <button
            onClick={() => user ? navigate("/advisor") : navigate("/register")}
            style={{
              background: "var(--clr-primary)", color: "#fff",
              fontWeight: 700, fontSize: "0.95rem",
              padding: "13px 36px", borderRadius: 999, border: "none",
              cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: "0 4px 18px rgba(13,110,110,0.26)",
              transition: "background 180ms ease, transform 180ms ease",
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--clr-primary-dark)"
              ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--clr-primary)"
              ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"
            }}
          >{t('home.cta_button')}</button>

          {!user && (
            <p style={{ marginTop: 16, fontSize: "0.85rem", color: "var(--clr-text-3)" }}>
              {t('home.already_account')}{" "}
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "none", border: "none",
                  color: "var(--clr-primary)", fontWeight: 600,
                  cursor: "pointer", fontSize: "inherit",
                  textDecoration: "underline", padding: 0,
                }}
              >{t('nav.login')}</button>
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
