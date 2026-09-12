import { readMotionEnvironment } from '@polymorph/core/motion'

import type { LoadedIdentityCatalog } from '../catalog/runtime'
import { catalogNavigationUri } from '../catalog/boundaries'

export async function afterPageFade(setLeaving: (value: boolean) => void, commit: () => void): Promise<void> {
  const environment = readMotionEnvironment(document.documentElement)
  setLeaving(true)
  if (!environment.reducedMotion && environment.durations.surfaceExit > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, environment.durations.surfaceExit))
  }
  commit()
  requestAnimationFrame(() => setLeaving(false))
}

export async function navigateAfterFade(
  catalog: LoadedIdentityCatalog,
  uri: string,
  setLeaving: (value: boolean) => void,
): Promise<void> {
  const destination = catalogNavigationUri(catalog, uri)
  await afterPageFade(setLeaving, () => window.location.replace(destination))
}
