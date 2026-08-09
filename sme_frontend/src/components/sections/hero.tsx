import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useLanguage } from "../../context/LanguageContext"
import { Spotlight } from "../ui/spotlight"
import { ChatBotWidget } from "../ui/chat-bot-widget"
import { TextRepel } from "../ui/text-repel"

interface HeroProps {
  showCreateAccount?: boolean
}

export function Hero({ showCreateAccount = true }: HeroProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const goNext = () => user ? navigate("/advisor") : navigate("/register")

  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(160deg, #091818 0%, #0D3D3D 55%, #091818 100%)",
      minHeight: "clamp(560px, 82vh, 820px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Background layers */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 60% at 50% 54%, rgba(13,110,110,0.30) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
        backgroundSize: "52px 52px",
      }} />

      <Spotlight className="-top-32 left-0 md:left-40 md:-top-10" fill="white" />

      {/* Content column */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 820,
        padding: "80px 24px",
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
        gap: 0,
      }}>

        {/* Eyebrow pill */}
        <div style={{
          marginBottom: 32,
          padding: "9px 22px", borderRadius: 999,
          border: "1px solid rgba(232,168,56,0.36)",
          background: "rgba(232,168,56,0.09)",
          backdropFilter: "blur(10px)",
          fontSize: 13, fontWeight: 500,
          color: "#E8A838", lineHeight: 1.6,
          maxWidth: 490,
        }}>
{t('hero.eyebrow')}
        </div>

        {/* Headline — TextRepel */}
        <TextRepel
          text={t('hero.headline')}
          radius={130}
          strength={36}
          stiffness={155}
          damping={13}
          mass={0.36}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.8rem, 6.5vw, 4.5rem)",
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.015em",
            lineHeight: 1.1,
            marginBottom: 14,
            width: "100%",
            justifyContent: "center",
          }}
        />

        {/* Sub-line */}
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.1rem, 2.6vw, 1.55rem)",
          color: "#4DC9C9",
          fontWeight: 400,
          lineHeight: 1.2,
          marginBottom: 22,
        }}>{t('hero.subline')}</p>

        {/* Body */}
        <p style={{
          fontSize: "clamp(0.93rem, 1.9vw, 1.07rem)",
          color: "rgba(255,255,255,0.76)",
          lineHeight: 1.78,
          maxWidth: 510,
          marginBottom: 40,
        }}>
{t('hero.body')}
        </p>

        {/* CTAs */}
        <div style={{
          display: "flex", flexWrap: "wrap",
          gap: 12, justifyContent: "center",
        }}>
          <button
            onClick={goNext}
            style={{
              padding: "13px 36px", borderRadius: 999,
              background: "#E8A838", color: "#1a0f00",
              fontWeight: 700, fontSize: "0.95rem",
              border: "none", cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: "0 8px 24px rgba(232,168,56,0.40)",
              transition: "filter 180ms ease, transform 180ms ease",
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.08)"
              ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)"
              ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"
            }}
          >{t('hero.cta_primary')}</button>

          {showCreateAccount && (
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "13px 36px", borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff", fontWeight: 600, fontSize: "0.95rem",
                border: "1px solid rgba(255,255,255,0.30)",
                cursor: "pointer", whiteSpace: "nowrap",
                backdropFilter: "blur(6px)",
                transition: "background 180ms ease, transform 180ms ease",
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.16)"
                ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"
                ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"
              }}
            >{t('hero.cta_secondary')}</button>
          )}
        </div>
      </div>

      <ChatBotWidget onGetStarted={goNext} />
    </section>
  )
}
