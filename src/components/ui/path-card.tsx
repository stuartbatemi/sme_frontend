import type { CSSProperties } from "react"
import { cn } from "../../lib/utils"

interface PathCardProps {
  image: string
  title: string
  description?: string
  onClick?: () => void
  className?: string
  style?: CSSProperties
  /** Extra classes for the text-label block (e.g. an entrance animation,
   * so the label can "pop in" slightly after the card itself). */
  labelClassName?: string
  labelStyle?: CSSProperties
  /**
   * "reveal" — image-first, title chip only; full title+description
   *   fade in on hover/focus.
   * "static" — title + description always visible, no hover needed.
   *   Use this where someone is actively choosing between options
   *   right now (e.g. the Advisor selection screen) — they shouldn't
   *   have to hover to find out what a card means.
   * "image-only" — just the artwork, no text overlay at all. `title`
   *   is still required and used as the accessible label (aria-label)
   *   for screen readers and keyboard users, since a clickable card
   *   with no visible label otherwise gives them nothing to go on.
   */
  variant?: "reveal" | "static" | "image-only"
}

/**
 * Tall, vertical "poster" card: the path's illustration fills the
 * whole card as a background image.
 */
export function PathCard({
  image, title, description, onClick, className, style,
  labelClassName, labelStyle, variant = "reveal",
}: PathCardProps) {
  if (variant === "image-only") {
    return (
      <button
        onClick={onClick}
        aria-label={title}
        style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center", ...style }}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl",
          "aspect-[4/5] max-h-[420px] min-h-[260px]",
          "ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "transition-transform duration-300 hover:-translate-y-1",
          className
        )}
      />
    )
  }

  if (variant === "static") {
    return (
      <button
        onClick={onClick}
        style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center", ...style }}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl text-left",
          "aspect-[4/5] max-h-[420px] min-h-[260px]",
          "ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "transition-transform duration-300 hover:-translate-y-1",
          className
        )}
      >
        {/* Scrim — strong enough that the title+description are always
            legible, no hover required. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />

        <div
          style={labelStyle}
          className={cn("absolute inset-0 flex flex-col items-start justify-end gap-1.5 p-6 pb-7 overflow-hidden", labelClassName)}
        >
          <h3 className="font-display text-lg font-semibold leading-snug text-white drop-shadow-md sm:text-xl">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-white/90 drop-shadow">
            {description}
          </p>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl text-left",
        "aspect-[3/4] min-h-[280px]",
        "ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "transition-transform duration-300 hover:-translate-y-1",
        className
      )}
      style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Base scrim — keeps the bottom title chip legible even at rest */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/90 group-hover:via-black/55" />

      {/* Resting state: compact title chip, bottom-left */}
      <div className="absolute inset-x-0 bottom-0 p-5 transition-opacity duration-300 group-hover:opacity-0">
        <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {title}
        </span>
      </div>

      {/* Hover/focus reveal: full title + description */}
      <div className="absolute inset-0 flex flex-col items-start justify-end p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <h3 className="font-display text-2xl font-semibold text-white drop-shadow-md">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/90 drop-shadow">
          {description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
          Get started →
        </span>
      </div>
    </button>
  )
}
