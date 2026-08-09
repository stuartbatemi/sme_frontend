import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { useEffect, useRef, CSSProperties } from "react"

function RepelLetter({
  letter, mouseX, mouseY, radius, strength, mode,
  stiffness, damping, mass, fontSize, fontFamily, fontWeight, color, letterSpacing, lineHeight,
}: {
  letter: string; mouseX: MotionValue<number>; mouseY: MotionValue<number>
  radius: number; strength: number; mode: "repel" | "attract"
  stiffness: number; damping: number; mass: number
  fontSize?: string; fontFamily?: string; fontWeight?: number | string
  color?: string; letterSpacing?: string; lineHeight?: number | string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const originX = useRef(0)
  const originY = useRef(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness, damping, mass })
  const springY = useSpring(y, { stiffness, damping, mass })
  const rotate = useTransform(springX, (v) => v * 0.3)

  useEffect(() => {
    const capture = () => {
      if (!ref.current) return
      const container = ref.current.closest("[data-text-repel]")
      if (!container) return
      const cr = container.getBoundingClientRect()
      const lr = ref.current.getBoundingClientRect()
      originX.current = lr.left - cr.left + lr.width / 2
      originY.current = lr.top - cr.top + lr.height / 2
    }
    const raf = requestAnimationFrame(capture)
    window.addEventListener("resize", capture)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", capture) }
  }, [])

  useEffect(() => {
    const update = () => {
      const mx = mouseX.get(); const my = mouseY.get()
      const dx = originX.current - mx; const dy = originY.current - my
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < radius && distance > 0) {
        const force = ((1 - distance / radius) ** 2) * strength
        const angle = Math.atan2(dy, dx)
        const dir = mode === "attract" ? -1 : 1
        x.set(Math.cos(angle) * force * dir)
        y.set(Math.sin(angle) * force * dir)
      } else { x.set(0); y.set(0) }
    }
    const u1 = mouseX.on("change", update)
    const u2 = mouseY.on("change", update)
    return () => { u1(); u2() }
  }, [mouseX, mouseY, radius, strength, mode, x, y])

  if (letter === " ") {
    return (
      <span
        style={{ display: "inline-block", whiteSpace: "pre", fontSize, fontFamily, fontWeight, color, letterSpacing, lineHeight }}
      >&nbsp;</span>
    )
  }

  return (
    <motion.span
      ref={ref}
      style={{
        x: springX, y: springY, rotate,
        display: "inline-block",
        whiteSpace: "pre",
        willChange: "transform",
        fontSize, fontFamily, fontWeight, color, letterSpacing, lineHeight,
      }}
      aria-hidden
    >
      {letter}
    </motion.span>
  )
}

interface TextRepelProps {
  text: string
  className?: string
  style?: CSSProperties
  radius?: number
  strength?: number
  mode?: "repel" | "attract"
  stiffness?: number
  damping?: number
  mass?: number
}

export function TextRepel({
  text,
  className,
  style,
  radius = 120,
  strength = 45,
  mode = "repel",
  stiffness = 180,
  damping = 14,
  mass = 0.4,
}: TextRepelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(-9999)
  const mouseY = useMotionValue(-9999)

  // Pull font props from style so each letter inherits them
  const fontSize = style?.fontSize as string | undefined
  const fontFamily = style?.fontFamily as string | undefined
  const fontWeight = style?.fontWeight as number | string | undefined
  const color = style?.color as string | undefined
  const letterSpacing = style?.letterSpacing as string | undefined
  const lineHeight = style?.lineHeight as number | string | undefined

  return (
    <div
      ref={containerRef}
      data-text-repel
      aria-label={text}
      className={className}
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
        userSelect: "none",
        ...style,
      }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
      }}
      onMouseLeave={() => { mouseX.set(-9999); mouseY.set(-9999) }}
    >
      {text.split("").map((letter, i) => (
        <RepelLetter
          key={i}
          letter={letter}
          mouseX={mouseX}
          mouseY={mouseY}
          radius={radius}
          strength={strength}
          mode={mode}
          stiffness={stiffness}
          damping={damping}
          mass={mass}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          color={color}
          letterSpacing={letterSpacing}
          lineHeight={lineHeight}
        />
      ))}
    </div>
  )
}
