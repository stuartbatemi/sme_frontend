import { useState, type CSSProperties } from "react"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
//
// items         Gallery entries — image src and optional alt
// cardWidth     Card width in px
// cardHeight    Card height in px
// cornerRadius  Border radius in px
// className     Styles for the outer shell
//
type GalleryItem = {
  image: { src: string; alt?: string }
}

type ArchGalleryProps = {
  items?: GalleryItem[]
  cardWidth?: number
  cardHeight?: number
  cornerRadius?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Defaults — real Dar es Salaam street/market scenes
// ---------------------------------------------------------------------------
import darStreetScene from "@/assets/gallery/dar-street-scene.jpg"
import trafficDaladala from "@/assets/gallery/traffic-daladala.jpg"
import businessDistrict from "@/assets/gallery/business-district-street.jpg"
import kariakooMarket from "@/assets/gallery/kariakoo-mitumba-market.jpg"

const DEFAULT_ITEMS: GalleryItem[] = [
  { image: { src: kariakooMarket, alt: "Kariakoo mitumba market, Dar es Salaam" } },
  { image: { src: darStreetScene, alt: "Street scene in Dar es Salaam" } },
  { image: { src: businessDistrict, alt: "Business district street, Dar es Salaam" } },
  { image: { src: trafficDaladala, alt: "Daladala and motorbike traffic, Dar es Salaam" } },
]

const ROTATE_STEP = 6
const Y_STEP = 18
const OVERLAP = 0.58
const HOVER_SCALE = 1.08
const HOVER_LIFT = 16

export function ArchGallery({
  items = DEFAULT_ITEMS,
  cardWidth = 150,
  cardHeight = 200,
  cornerRadius = 18,
  className = "",
}: ArchGalleryProps) {
  const deck = items.length ? items : DEFAULT_ITEMS
  const total = deck.length
  const mid = (total - 1) / 2
  const [hovered, setHovered] = useState<number | null>(null)

  const stageWidth = cardWidth + Math.abs(mid) * 2 * cardWidth * OVERLAP + cardWidth * 0.2
  const stageHeight = cardHeight + Math.abs(mid) * Y_STEP + 48

  return (
    <div
      className={["flex w-full items-center justify-center py-6", className]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label="Gallery of small businesses on Fursa"
    >
      <div
        className="relative max-w-full"
        style={{ width: stageWidth, height: stageHeight }}
      >
        {deck.map((entry, index) => {
          const offset = index - mid
          const rotate = offset * ROTATE_STEP
          const translateY = Math.abs(offset) * Y_STEP
          const translateX = offset * cardWidth * OVERLAP
          const baseZ = total - Math.abs(offset)
          const isHovered = hovered === index

          const cardStyle: CSSProperties = {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: cardWidth,
            height: cardHeight,
            marginLeft: -cardWidth / 2,
            marginTop: -cardHeight / 2,
            borderRadius: cornerRadius,
            overflow: "hidden",
            transformOrigin: "center center",
            transform: isHovered
              ? `translate(${translateX}px, ${translateY - HOVER_LIFT}px) rotate(0deg) scale(${HOVER_SCALE})`
              : `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(1)`,
            zIndex: isHovered ? total + 1 : baseZ,
            transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), z-index 0ms",
            boxShadow: "0 12px 28px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
            cursor: "pointer",
            backgroundColor: "#f3f4f6",
          }

          return (
            <div
              key={`${entry.image.src}-${index}`}
              style={cardStyle}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              aria-label={entry.image.alt || `Photo ${index + 1}`}
            >
              <img
                src={entry.image.src}
                alt={entry.image.alt || ""}
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
