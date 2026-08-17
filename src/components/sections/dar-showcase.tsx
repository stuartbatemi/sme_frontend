import { motion, AnimatePresence } from "framer-motion"
import { PanelRightOpen, PanelRightClose, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useLanguage } from "../../context/LanguageContext"
import { ArchGallery } from "../ui/arch-gallery"

/**
 * Homepage showcase section.
 *
 * Layout: a photo gallery of real Dar es Salaam street/market scenes
 * sits alongside a short headline + "Get started" button — no video,
 * no long intro paragraph cluttering the first screen. All the
 * "about the app" copy (previously a rotating message bubble) now
 * lives inside a small pull-out card anchored to the top-right
 * corner: tap the tab, the card slides in from the right; tap again,
 * the X, click outside, or press Escape to close it.
 */
export function DarShowcase() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const goNext = () => (user ? navigate("/advisor") : navigate("/register"))

  const [aboutOpen, setAboutOpen] = useState(false)

  // Close on Escape, regardless of what has focus.
  useEffect(() => {
    if (!aboutOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAboutOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [aboutOpen])

  // Gallery card size scales down on small screens so the fanned
  // stack never overflows a phone viewport.
  const [cardSize, setCardSize] = useState({ width: 150, height: 200 })
  useEffect(() => {
    const computeSize = () => {
      const vw = window.innerWidth
      if (vw < 400) setCardSize({ width: 92, height: 122 })
      else if (vw < 640) setCardSize({ width: 108, height: 144 })
      else if (vw < 1024) setCardSize({ width: 140, height: 186 })
      else setCardSize({ width: 168, height: 224 })
    }
    computeSize()
    window.addEventListener("resize", computeSize)
    return () => window.removeEventListener("resize", computeSize)
  }, [])

  const aboutParagraphs = [
    t("home.showcase_intro"),
    t("home.showcase_question1"),
    t("home.showcase_question2"),
  ]

  return (
    <section
      style={{ background: "var(--clr-bg)" }}
      className="relative overflow-hidden px-6 pt-16 pb-10 md:px-10 md:py-24"
    >
      {/* About-Fursa pull tab, pinned top-right */}
      <div className="absolute top-6 right-6 z-20 md:top-10 md:right-10">
        <button
          type="button"
          onClick={() => setAboutOpen((v) => !v)}
          aria-expanded={aboutOpen}
          aria-controls="about-fursa-panel"
          aria-label={t("home.showcase_about_toggle")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition hover:opacity-80"
          style={{ borderColor: "var(--clr-border)", background: "var(--clr-bg)" }}
        >
          {aboutOpen ? (
            <PanelRightClose size={16} style={{ color: "var(--clr-text-2)" }} />
          ) : (
            <PanelRightOpen size={16} style={{ color: "var(--clr-text-2)" }} />
          )}
        </button>
      </div>

      {/* Click-outside catcher, only present while the panel is open */}
      <AnimatePresence>
        {aboutOpen && (
          <motion.div
            key="about-backdrop"
            className="fixed inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAboutOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* About-Fursa pull-out card — slides in from the right edge */}
      <AnimatePresence>
        {aboutOpen && (
          <motion.div
            key="about-panel"
            id="about-fursa-panel"
            role="dialog"
            aria-label={t("home.showcase_about_toggle")}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-20 right-4 left-4 z-30 rounded-2xl border p-5 shadow-lg sm:right-10 sm:left-auto sm:w-90 md:top-24 md:right-10"
            style={{ borderColor: "var(--clr-border)", background: "var(--clr-bg)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p
                className="text-[11px] font-medium tracking-[0.25em] uppercase"
                style={{ color: "var(--clr-primary)" }}
              >
                {t("home.showcase_eyebrow")}
              </p>
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                aria-label={t("home.showcase_about_close")}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition hover:opacity-80"
                style={{ borderColor: "var(--clr-border)" }}
              >
                <X size={13} style={{ color: "var(--clr-text-2)" }} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {aboutParagraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[13px] leading-[1.7]"
                  style={{ color: i === aboutParagraphs.length - 1 ? "var(--clr-text-2)" : "var(--clr-text)" }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:gap-14 md:pt-4">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full shrink-0 md:mx-0 md:w-auto"
        >
          <ArchGallery cardWidth={cardSize.width} cardHeight={cardSize.height} cornerRadius={16} />
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
            {t("home.showcase_title_line1")}
            <br />
            <span className="font-normal">{t("home.showcase_title_line2")}</span>
          </p>

          <p
            className="mx-auto max-w-105 text-sm leading-[1.8] md:mx-0"
            style={{ color: "var(--clr-text-2)" }}
          >
            {t("home.showcase_body")}
          </p>

          <button
            onClick={goNext}
            className="mx-auto w-full max-w-70 rounded-full py-3.5 text-base font-semibold text-white transition hover:opacity-90 md:mx-0 md:w-fit md:px-9"
            style={{ background: "var(--clr-primary)" }}
          >
            {t("home.showcase_cta")}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
