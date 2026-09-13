import type { LoadedIdentityCatalog } from '../catalog/runtime'
import { catalogProductReturnUri } from '../catalog/boundaries'
import { discardConsumedAuthFragment } from './fragment'

let recoveryUri: string | undefined
let installed = false

export function installBfcacheGuard(): void {
  if (installed) return
  installed = true
  window.addEventListener('pagehide', () => {
    discardConsumedAuthFragment()
    document.querySelectorAll('input, textarea, select').forEach((element) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) element.value = ''
      if (element instanceof HTMLSelectElement) element.selectedIndex = -1
    })
    document.querySelectorAll('img[src^="blob:"]').forEach((element) => {
      if (element instanceof HTMLImageElement) URL.revokeObjectURL(element.src)
    })
    // A BFCache entry retains its DOM and JS heap. Conceal all rendered PII
    // synchronously; a persisted pageshow always leaves through recovery.
    document.documentElement.style.visibility = 'hidden'
  })
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return
    window.location.replace(recoveryUri ?? `${window.location.pathname}${window.location.search}`)
  })
}

export function armBfcacheRecovery(catalog: LoadedIdentityCatalog): void {
  recoveryUri = catalogProductReturnUri(catalog, 'authStartRecovery')
  installBfcacheGuard()
}
