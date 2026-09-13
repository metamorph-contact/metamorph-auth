import type { LoadedIdentityCatalog } from './runtime'
import type { ReturnPurposeV1 } from '../contracts/generated/ReturnPurposeV1'
import { AuthApi } from '../protocol/http'

const PRODUCT_RELAY_PATHS = new Set([
  '/api/auth/v1/relays/relocation',
  '/api/auth/v1/relays/preparation',
])

function exactOrigin(value: string): string {
  const url = new URL(value)
  if (url.href !== `${url.origin}/` || url.username || url.password || !['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Invalid catalog origin')
  }
  return url.origin
}

export function identityApiForRegion(
  catalog: LoadedIdentityCatalog,
  regionId: string,
  claimedOrigin?: string,
): AuthApi {
  const region = catalog.projection.regions.find((candidate) => candidate.regionId === regionId)
  if (region === undefined) throw new Error('Identity region is not admitted by the verified catalog')
  const expected = exactOrigin(region.identityOrigin)
  if (claimedOrigin !== undefined && exactOrigin(claimedOrigin) !== expected) {
    throw new Error('Identity origin does not match its catalog region')
  }
  return new AuthApi(expected)
}

export function admittedIdentityApi(catalog: LoadedIdentityCatalog, claimedOrigin: string): AuthApi {
  const origin = exactOrigin(claimedOrigin)
  if (!catalog.projection.regions.some((region) => exactOrigin(region.identityOrigin) === origin)) {
    throw new Error('Identity origin is not admitted by the verified catalog')
  }
  return new AuthApi(origin)
}

export function controllerApiForRegion(
  catalog: LoadedIdentityCatalog,
  regionId: string,
  claimedOrigin?: string,
): AuthApi {
  const region = catalog.projection.regions.find((candidate) => candidate.regionId === regionId)
  if (region === undefined) throw new Error('Controller region is not admitted by the verified catalog')
  const expected = exactOrigin(region.controllerOrigin)
  if (claimedOrigin !== undefined && exactOrigin(claimedOrigin) !== expected) {
    throw new Error('Controller origin does not match its catalog region')
  }
  return new AuthApi(expected)
}

export function catalogProductReturnUri(catalog: LoadedIdentityCatalog, purpose: ReturnPurposeV1): string {
  const registered = catalog.projection.registeredReturns.find((entry) => entry.purpose === purpose)
  if (registered === undefined) throw new Error(`Missing cataloged ${purpose} return`)
  return catalogNavigationUri(catalog, new URL(registered.path, catalog.projection.productUiOrigin).href)
}

/**
 * Validates server-built browser navigation against the signed projection.
 * Protocol continuations never use an arbitrary response-provided origin/path.
 */
export function catalogNavigationUri(catalog: LoadedIdentityCatalog, value: string): string {
  if (new TextEncoder().encode(value).byteLength > 32 * 1024) throw new Error('Navigation URI is too large')
  const url = new URL(value)
  if (url.username || url.password || !['http:', 'https:'].includes(url.protocol) || url.search !== '') {
    throw new Error('Unsafe navigation destination')
  }

  const commonOrigin = exactOrigin(catalog.projection.commonUiOrigin)
  if (url.origin === commonOrigin) {
    const suffixes = ['authorize', 'authorize/continue', 'verify-email', 'recover-password', 'logout']
    const validPath = catalog.projection.supportedLocales.some((locale) => {
      const base = `/${encodeURIComponent(locale)}/auth/${encodeURIComponent(catalog.projection.authProjectionId)}/${encodeURIComponent(catalog.projection.catalogVersion)}`
      return suffixes.some((suffix) => url.pathname === `${base}/${suffix}`)
    })
    if (validPath) return url.href
    throw new Error('Common identity navigation path is not cataloged')
  }

  if (url.origin === exactOrigin(catalog.projection.productUiOrigin)) {
    if (catalog.projection.registeredReturns.some((entry) => entry.path === url.pathname)) return url.href
    throw new Error('Product return path is not cataloged')
  }

  const callbackOrigins = catalog.projection.regions
    .filter((region) => exactOrigin(region.productApiOrigin) === url.origin)
  if (callbackOrigins.length > 0 && (
    PRODUCT_RELAY_PATHS.has(url.pathname) ||
    catalog.projection.registeredCallbacks.some((entry) => entry.path === url.pathname)
  )) {
    return url.href
  }
  throw new Error('Navigation destination is not admitted by the verified catalog')
}
