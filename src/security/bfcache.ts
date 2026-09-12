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
    document.querySelectorAll('input[type="password"]').forEach((element) => {
      if (element instanceof HTMLInputElement) element.value = ''
    })
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
