/**
 * Recharts renders props like `stroke`, `fill`, and `tick={{ fill }}`
 * as raw SVG presentation attributes (e.g. `<line stroke="...">`), not
 * as CSS. A CSS custom property reference such as "var(--clr-border)"
 * only resolves inside an actual CSS value (a `style` attribute or a
 * stylesheet rule) — browsers don't substitute it inside a plain XML
 * attribute string, so passing it straight into `stroke`/`fill` used
 * to silently produce invisible (stroke) or black (fill) chart lines.
 *
 * This resolves the custom property to its current real value once,
 * at render time, so charts stay theme-aware (grey/light/dark) while
 * still being valid SVG attribute values — and safe to snapshot for
 * PDF export, which reads the live DOM rather than a stylesheet.
 */
export function resolveCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") return fallback;
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}
