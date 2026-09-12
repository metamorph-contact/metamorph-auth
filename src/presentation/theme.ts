import {
  setMode,
  setPalette,
  setSystem,
} from '@polymorph/theme/runtime'

import './generated-themes.css'
import './identity-aa-overrides.css'

const PAIRINGS = Object.freeze({
  'octamorph-iris': { system: 'octamorph', palette: 'iris' },
  'shadcn-neutral': { system: 'shadcn', palette: 'neutral' },
} as const)

export function installPresentationTheme(pairingId: string): void {
  const pairing = PAIRINGS[pairingId as keyof typeof PAIRINGS]
  if (pairing === undefined) throw new Error('Unknown presentation theme')
  setSystem(pairing.system)
  setPalette(pairing.palette)
  // The common identity surface never overrides the operating-system choice.
  setMode('system')
}
