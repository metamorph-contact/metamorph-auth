import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const css = await readFile(resolve(root, 'src/presentation/identity-aa-overrides.css'), 'utf8')
const expected = [
  ['octamorph', 'iris', 'light', '#ffffff', '#f5f4f9'],
  ['octamorph', 'iris', 'dark', '#17171a', '#101013'],
  ['shadcn', 'neutral', 'light', '#ffffff', '#f5f5f5'],
  ['shadcn', 'neutral', 'dark', '#171717', '#101010'],
]

for (const [system, palette, mode, surface, subtle] of expected) {
  const selector = `\\[data-system='${system}'\\]\\[data-palette='${palette}'\\]\\[data-mode='${mode}'\\]\\s*\\{([^}]+)\\}`
  const match = css.match(new RegExp(selector, 'u'))
  if (match === null) throw new Error(`Missing identity AA override for ${system}-${palette}-${mode}`)
  const tokens = Object.fromEntries([...match[1].matchAll(/(--pm-[\w-]+):\s*(#[0-9a-f]{6});/gu)].map((item) => [item[1], item[2]]))
  for (const family of ['accent', 'danger']) {
    const background = family === 'accent' ? '--pm-accent-bg' : '--pm-danger-solid'
    const hover = `${background}-hover`
    const active = `${background}-active`
    const foreground = family === 'accent' ? '--pm-accent-contrast' : '--pm-danger-contrast'
    if (tokens[background] === undefined) continue
    for (const state of [background, hover, active]) {
      requireContrast(`${system}-${palette}-${mode} ${state} text`, tokens[foreground], tokens[state], 4.5)
      requireContrast(`${system}-${palette}-${mode} ${state} boundary`, tokens[state], surface, 3)
    }
  }
  requireContrast(`${system}-${palette}-${mode} field boundary`, tokens['--pm-border-field'], surface, 3)
  requireContrast(`${system}-${palette}-${mode} invalid field boundary`, tokens['--pm-danger-border'], surface, 3)
  requireContrast(`${system}-${palette}-${mode} muted text`, tokens['--pm-text-muted'], subtle, 4.5)
  if (tokens['--pm-text-secondary'] !== undefined) {
    requireContrast(`${system}-${palette}-${mode} secondary text`, tokens['--pm-text-secondary'], surface, 4.5)
  }
}

function requireContrast(label, foreground, background, minimum) {
  if (foreground === undefined || background === undefined) throw new Error(`${label} is missing a color token`)
  const ratio = contrast(foreground, background)
  if (ratio < minimum) throw new Error(`${label} contrast is ${ratio.toFixed(2)}; expected at least ${minimum}`)
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
