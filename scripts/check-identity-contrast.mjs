import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Cascade order, as src/presentation/theme.ts imports them: a later file's
// declaration wins, so the gate judges the values that actually ship.
const sheets = await Promise.all([
  'src/presentation/identity-aa-overrides.css',
  'src/presentation/octamorph-register-pins.css',
].map((path) => readFile(resolve(root, path), 'utf8')))
const expected = [
  ['octamorph', 'iris', 'light', '#ffffff', '#f5f4f9', ['accent', 'danger']],
  ['octamorph', 'iris', 'dark', '#17171a', '#101013', ['accent', 'danger']],
  ['shadcn', 'neutral', 'light', '#ffffff', '#f5f5f5', ['danger']],
  ['shadcn', 'neutral', 'dark', '#171717', '#101010', ['danger']],
]

for (const [system, palette, mode, surface, subtle, requiredFamilies] of expected) {
  const pairing = `${system}-${palette}-${mode}`
  const tokens = cascadedTokens(system, palette, mode)
  if (tokens === null) throw new Error(`Missing identity AA override for ${pairing}`)
  for (const family of ['accent', 'danger']) {
    const background = family === 'accent' ? '--pm-accent-bg' : '--pm-danger-solid'
    const hover = `${background}-hover`
    const active = `${background}-active`
    const foreground = family === 'accent' ? '--pm-accent-contrast' : '--pm-danger-contrast'
    if (tokens[background] === undefined) {
      if (requiredFamilies.includes(family)) throw new Error(`${pairing} ${family} fills are not pinned`)
      continue
    }
    for (const state of [background, hover, active]) {
      requireContrast(`${pairing} ${state} text`, tokens[foreground], tokens[state], 4.5)
      requireIdentifiable(`${pairing} ${state}`, tokens[state], tokens[foreground], surface)
    }
  }
  requireContrast(`${pairing} field boundary`, tokens['--pm-border-field'], surface, 3)
  requireContrast(`${pairing} invalid field boundary`, tokens['--pm-danger-border'], surface, 3)
  requireContrast(`${pairing} focus indicator`, tokens['--pm-border-focus-solid'], surface, 3)
  requireContrast(`${pairing} muted text`, tokens['--pm-text-muted'], subtle, 4.5)
  if (tokens['--pm-text-secondary'] !== undefined) {
    requireContrast(`${pairing} secondary text`, tokens['--pm-text-secondary'], surface, 4.5)
  }
}

function cascadedTokens(system, palette, mode) {
  const selector = `\\[data-system='${system}'\\]\\[data-palette='${palette}'\\]\\[data-mode='${mode}'\\]\\s*\\{([^}]+)\\}`
  const blocks = sheets.flatMap((css) => [...css.matchAll(new RegExp(selector, 'gu'))])
  if (blocks.length === 0) return null
  return Object.fromEntries(blocks.flatMap((block) =>
    [...block[1].matchAll(/(--pm-[\w-]+):\s*(#[0-9a-f]{6});/gu)].map((item) => [item[1], item[2]])))
}

function requireContrast(label, foreground, background, minimum) {
  if (foreground === undefined || background === undefined) throw new Error(`${label} is missing a color token`)
  const ratio = contrast(foreground, background)
  if (ratio < minimum) throw new Error(`${label} contrast is ${ratio.toFixed(2)}; expected at least ${minimum}`)
}

// WCAG 2.2 SC 1.4.11 asks 3:1 of the visual information *required to identify*
// a control, and its Understanding text is explicit that a button whose text is
// visible needs no boundary of its own. So a fill either separates from the
// surface at 3:1, or is identified by its label — which already clears 4.5:1 on
// the fill, and must then clear 4.5:1 against the surface the fill blends into.
// A product's pinned brand fill (Octamorph's #4e1fd3 on a dark page) is the
// case this admits; an unlabelled indicator has no such fallback, which is why
// the focus indicator above is held to 3:1 unconditionally.
function requireIdentifiable(label, fill, foreground, surface) {
  if (fill === undefined || surface === undefined) throw new Error(`${label} is missing a color token`)
  const boundary = contrast(fill, surface)
  if (boundary >= 3) return
  requireContrast(`${label} boundary is ${boundary.toFixed(2)}, so its label against the surface`, foreground, surface, 4.5)
}

function contrast(left, right) {
  const [bright, dark] = [luminance(left), luminance(right)].sort((a, b) => b - a)
  return (bright + 0.05) / (dark + 0.05)
}

function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}
