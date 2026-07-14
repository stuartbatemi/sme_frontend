import { motion } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useLanguage } from "../../context/LanguageContext"
import darEsSalaamVideo from "../../assets/daressalaam-hero.mp4"

/**
 * Homepage showcase section — simple static layout, no scroll-pin
 * effects. Video sits as a side column on desktop (stacked on
 * mobile), with a message-bubble-shaped eyebrow badge pinned to the
 * section's top-right corner, and a plain "Get started" button.
 */
export function DarShowcase() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const goNext = () => (user ? navigate("/advisor") : navigate("/register"))

  return (
    <section
      style={{ background: "var(--clr-bg)" }}
      className="relative overflow-hidden px-6 py-16 md:px-10 md:py-24"
    >
      {/* Eyebrow badge — message-bubble shaped, top-right corner */}
      <div className="absolute right-6 top-6 z-10 flex flex-col items-end gap-2 md:right-10 md:top-10">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border"
          style={{ borderColor: "var(--clr-border)" }}
        >
          <MessageCircle size={16} style={{ color: "var(--clr-text-2)" }} />
        </div>
        <div
          style={{ borderColor: "var(--clr-border)" }}
          className="rounded-2xl rounded-tr-sm border px-4 py-2"
        >
          <p
            className="text-[11px] font-medium tracking-[0.25em] uppercase"
            style={{ color: "var(--clr-primary)" }}
          >
            {t('home.showcase_eyebrow')}
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 pt-16 md:flex-row md:items-center md:gap-14 md:pt-4">
        {/* Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto h-[280px] w-full max-w-[360px] shrink-0 overflow-hidden rounded-2xl md:mx-0 md:h-[500px] md:w-[360px] md:rounded-none"
        >
          <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/30 via-transparent to-transparent" />
          <video
            src={darEsSalaamVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-col gap-6 text-center md:text-left"
        >
          <p
            style={{ fontFamily: "var(--font-display)", color: "var(--clr-text)" }}
            className="text-3xl leading-[1.15] font-light tracking-tight sm:text-4xl md:text-5xl"
          >
            {t('home.showcase_title_line1')}
            <br />
            <span className="font-normal">{t('home.showcase_title_line2')}</span>
          </p>

          <p className="mx-auto max-w-[420px] text-sm leading-[1.8] md:mx-0" style={{ color: "var(--clr-text-2)" }}>
            {t('home.showcase_body')}
          </p>

          <button
            onClick={goNext}
            className="mx-auto w-full max-w-[280px] rounded-full py-3.5 text-base font-semibold text-white transition hover:opacity-90 md:mx-0 md:w-fit md:px-9"
            style={{ background: "var(--clr-primary)" }}
          >
            {t('home.showcase_cta')}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
