import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useLanguage } from "../../context/LanguageContext"
import darEsSalaamVideo from "../../assets/daressalaam-hero.mp4"

/**
 * Homepage showcase section — simple static layout, no scroll-pin
 * effects. Video sits as a side column on desktop (stacked on
 * mobile), with a message-bubble-shaped badge pinned to the
 * section's top-right corner that cycles through a short intro
 * script on a loop, and a plain "Get started" button.
 */
export function DarShowcase() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const goNext = () => (user ? navigate("/advisor") : navigate("/register"))

  // Rotating message-bubble script — each entry shown for its own
  // duration, then loops back to the start forever.
  const bubbleMessages = [
    { text: t("home.showcase_eyebrow"), duration: 5000, eyebrow: true },
    { text: t("home.showcase_intro"), duration: 10000, eyebrow: false },
    { text: t("home.showcase_question1"), duration: 4000, eyebrow: false },
    { text: t("home.showcase_question2"), duration: 4000, eyebrow: false },
  ]
  const [bubbleIndex, setBubbleIndex] = useState(0)

  useEffect(() => {
    const current = bubbleMessages[bubbleIndex % bubbleMessages.length]
    const timer = setTimeout(() => {
      setBubbleIndex((i) => (i + 1) % bubbleMessages.length)
    }, current.duration)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbleIndex])

  const activeBubble = bubbleMessages[bubbleIndex % bubbleMessages.length]

  return (
    <section
      style={{ background: "var(--clr-bg)" }}
      className="relative overflow-hidden px-6 pt-16 pb-10 md:px-10 md:py-24"
    >
      {/* Eyebrow badge — message-bubble shaped. In normal document flow
          on mobile (centered, first in the stack) so it doesn't need a
          large reserved top-padding gap to clear it; absolutely
          positioned in the top-right corner from md: up, where there's
          room beside the video for it to float free. */}
      <div className="relative z-10 mb-6 flex flex-col items-center gap-2 md:absolute md:right-10 md:top-10 md:mb-0 md:items-end">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
          style={{ borderColor: "var(--clr-border)" }}
        >
          <MessageCircle size={16} style={{ color: "var(--clr-text-2)" }} />
        </div>
        <div
          style={{ borderColor: "var(--clr-border)" }}
          className="w-55 rounded-2xl rounded-tr-sm border px-4 py-3 sm:w-70"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={bubbleIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={
                activeBubble.eyebrow
                  ? "text-[11px] font-medium tracking-[0.25em] uppercase"
                  : "text-[13px] leading-normal font-medium"
              }
              style={{ color: "var(--clr-primary)" }}
            >
              {activeBubble.text}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:gap-14 md:pt-4">
        {/* Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto h-70 w-full max-w-90 shrink-0 overflow-hidden rounded-2xl md:mx-0 md:h-125 md:w-90 md:rounded-none"
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

          <p className="mx-auto max-w-105 text-sm leading-[1.8] md:mx-0" style={{ color: "var(--clr-text-2)" }}>
            {t('home.showcase_body')}
          </p>

          <button
            onClick={goNext}
            className="mx-auto w-full max-w-70 rounded-full py-3.5 text-base font-semibold text-white transition hover:opacity-90 md:mx-0 md:w-fit md:px-9"
            style={{ background: "var(--clr-primary)" }}
          >
            {t('home.showcase_cta')}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
