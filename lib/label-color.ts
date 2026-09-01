/**
 * Accessible rendering for GitHub label colors.
 *
 * Templates carry arbitrary, author-chosen label colors (raw GitHub label
 * hex values, e.g. "FFFF00"). The label chips render that color as a tinted
 * background with matching-hue text, GitHub-style. Rendered directly, many
 * of those hues (bright yellow, white, cyan, ...) fail WCAG AA text
 * contrast against their own tint - this module nudges only the *lightness*
 * of the foreground (keeping hue and saturation, so the chip still reads as
 * "this label's color") until the rendered pair clears 4.5:1, computed with
 * the real WCAG relative-luminance formula against the exact background the
 * chip renders on in each color scheme.
 */

export interface RGB {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "")
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean
  const num = parseInt(full, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function srgbChannelToLinear(c: number): number {
  const cs = c / 255
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
}

/** WCAG relative luminance, 0 (black) - 1 (white). */
export function relativeLuminance(rgb: RGB): number {
  const r = srgbChannelToLinear(rgb.r)
  const g = srgbChannelToLinear(rgb.g)
  const b = srgbChannelToLinear(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two colors, 1 - 21. */
export function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Alpha-composite `fg` over `bg` (both opaque colors), alpha in [0, 1]. */
export function alphaBlend(fg: RGB, bg: RGB, alpha: number): RGB {
  return {
    r: alpha * fg.r + (1 - alpha) * bg.r,
    g: alpha * fg.g + (1 - alpha) * bg.g,
    b: alpha * fg.b + (1 - alpha) * bg.b,
  }
}

interface HSL {
  h: number
  s: number
  l: number
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0)
      break
    case gn:
      h = (bn - rn) / d + 2
      break
    default:
      h = (rn - gn) / d + 4
  }
  return { h: h / 6, s, l }
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let tt = t
  if (tt < 0) tt += 1
  if (tt > 1) tt -= 1
  if (tt < 1 / 6) return p + (q - p) * 6 * tt
  if (tt < 1 / 2) return q
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
  return p
}

function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const v = l * 255
    return { r: v, g: v, b: v }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: hueToRgbChannel(p, q, h + 1 / 3) * 255,
    g: hueToRgbChannel(p, q, h) * 255,
    b: hueToRgbChannel(p, q, h - 1 / 3) * 255,
  }
}

/**
 * Returns a color with the same hue/saturation as `hex` but with lightness
 * adjusted (searched in 0.5%-lightness steps) until its contrast against
 * `backgroundHex` is >= minRatio. Searches both darkening and lightening and
 * keeps whichever reaches the target with the smaller change in lightness;
 * if neither direction can reach it (only possible for backgrounds near
 * 50% gray), falls back to pure black or white, whichever contrasts more.
 */
export function ensureTextContrast(
  hex: string,
  backgroundHex: string,
  minRatio = 4.5
): string {
  const bg = hexToRgb(backgroundHex)
  const original = hexToRgb(hex)

  if (contrastRatio(original, bg) >= minRatio) return rgbToHex(original)

  const { h, s, l: originalL } = rgbToHsl(original)
  const STEP = 0.005

  // Round each candidate to the actual integer sRGB byte values it will
  // render as (hexToRgb(rgbToHex(...))) before measuring contrast - a
  // fractional HSL->RGB value can clear the threshold in continuous space
  // but land a hair under it once rounded to a real, renderable color.
  const searchFrom = (direction: -1 | 1): { l: number; ratio: number } | null => {
    for (let l = originalL; l >= 0 && l <= 1; l += direction * STEP) {
      const candidate = hexToRgb(rgbToHex(hslToRgb({ h, s, l })))
      const ratio = contrastRatio(candidate, bg)
      if (ratio >= minRatio) return { l, ratio }
    }
    return null
  }

  const darker = searchFrom(-1)
  const lighter = searchFrom(1)

  let best: { l: number } | null = null
  if (darker && lighter) {
    best = Math.abs(darker.l - originalL) <= Math.abs(lighter.l - originalL) ? darker : lighter
  } else {
    best = darker ?? lighter
  }

  if (best) return rgbToHex(hslToRgb({ h, s, l: best.l }))

  // Extremely rare fallback (background is right around 50% gray): pick
  // whichever pure black/white contrasts more.
  const black: RGB = { r: 0, g: 0, b: 0 }
  const white: RGB = { r: 255, g: 255, b: 255 }
  return contrastRatio(black, bg) >= contrastRatio(white, bg) ? "#000000" : "#ffffff"
}

/**
 * Nudges `bgHex`'s lightness (same hue/saturation) until its contrast
 * against `textHex` clears minRatio. Used for solid-fill chips where the
 * label color is the background and the text color is fixed (black/white).
 */
export function ensureBackgroundContrast(
  bgHex: string,
  textHex: string,
  minRatio = 4.5
): string {
  const text = hexToRgb(textHex)
  const original = hexToRgb(bgHex)
  if (contrastRatio(original, text) >= minRatio) return rgbToHex(original)

  const { h, s, l: originalL } = rgbToHsl(original)
  const STEP = 0.005
  const textIsLight = relativeLuminance(text) > 0.5

  // If the text is light (white), we need a darker background, and vice
  // versa - search only in that direction, which is both correct and
  // faster than searching both ways.
  const direction: 1 | -1 = textIsLight ? -1 : 1
  for (let l = originalL; l >= 0 && l <= 1; l += direction * STEP) {
    const candidateHex = rgbToHex(hslToRgb({ h, s, l }))
    if (contrastRatio(hexToRgb(candidateHex), text) >= minRatio) {
      return candidateHex
    }
  }
  return textIsLight ? "#000000" : "#ffffff"
}

/** Picks whichever of pure black/white contrasts more against `bgHex`. */
export function bestTextOn(bgHex: string): "#000000" | "#ffffff" {
  const bg = hexToRgb(bgHex)
  const black: RGB = { r: 0, g: 0, b: 0 }
  const white: RGB = { r: 255, g: 255, b: 255 }
  return contrastRatio(black, bg) >= contrastRatio(white, bg) ? "#000000" : "#ffffff"
}

const TINT_ALPHA = 0x20 / 255
const CARD_BG_LIGHT = "#ffffff"
const CARD_BG_DARK = "#1f2937" // Tailwind gray-800, the dark card background these chips sit on

export interface LabelChipColors {
  background: string
  text: string
  border: string
}

/**
 * Computes the tinted-chip colors (background tint, accessible text,
 * border) for a raw GitHub label hex, for both color schemes.
 *
 * `cardBg` should match the actual light/dark background of the container
 * the chip is rendered on (the tint is a translucent overlay, so the real
 * rendered background - and therefore the contrast the text needs to clear
 * - depends on what's underneath it). Defaults to this app's white / gray-800
 * card surfaces.
 */
export function getLabelChipColors(
  labelHex: string,
  cardBg: { light: string; dark: string } = { light: CARD_BG_LIGHT, dark: CARD_BG_DARK }
): {
  light: LabelChipColors
  dark: LabelChipColors
} {
  const hex = labelHex.startsWith("#") ? labelHex : `#${labelHex}`
  const raw = hexToRgb(hex)

  const lightBg = rgbToHex(alphaBlend(raw, hexToRgb(cardBg.light), TINT_ALPHA))
  const darkBg = rgbToHex(alphaBlend(raw, hexToRgb(cardBg.dark), TINT_ALPHA))

  return {
    light: {
      background: lightBg,
      text: ensureTextContrast(hex, lightBg),
      border: rgbToHex(alphaBlend(raw, hexToRgb(cardBg.light), 0x40 / 255)),
    },
    dark: {
      background: darkBg,
      text: ensureTextContrast(hex, darkBg),
      border: rgbToHex(alphaBlend(raw, hexToRgb(cardBg.dark), 0x40 / 255)),
    },
  }
}

/**
 * Computes solid-fill chip colors (used for a "selected" state): background
 * is the raw label color, text is black or white, nudging the background's
 * lightness only if neither pure black nor white reaches 4.5:1 against it.
 */
export function getSolidChipColors(labelHex: string): { background: string; text: string } {
  const hex = labelHex.startsWith("#") ? labelHex : `#${labelHex}`
  const text = bestTextOn(hex)
  const background = ensureBackgroundContrast(hex, text)
  return { background, text }
}

/**
 * Convenience wrapper: returns a ready-to-spread inline `style` object
 * (the 6 CSS custom properties the `.label-chip` rule in globals.css reads)
 * for a raw label hex. Pair with `className="label-chip ... border"`.
 */
export function labelChipStyle(
  labelHex: string,
  cardBg?: { light: string; dark: string }
): Record<string, string> {
  const chip = getLabelChipColors(labelHex, cardBg)
  return {
    "--label-chip-bg-light": chip.light.background,
    "--label-chip-fg-light": chip.light.text,
    "--label-chip-border-light": chip.light.border,
    "--label-chip-bg-dark": chip.dark.background,
    "--label-chip-fg-dark": chip.dark.text,
    "--label-chip-border-dark": chip.dark.border,
  }
}

/** The `bg-gray-50 dark:bg-gray-900` surface used for several label chip containers. */
export const GRAY_50_900_CARD_BG = { light: "#f9fafb", dark: "#111827" }
