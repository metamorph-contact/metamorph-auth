import release from '../../catalog/identity-ui-release.development.json'
import { decodeSignedAuthProjectionText, decodeSignedBrowserVerificationKeySetText } from '../contracts/decode'
import { AUTH_PROJECTION_PRODUCTS, AUTH_REGION_MESSAGE_KEYS } from '../contracts/generated/release-trust'
import type { PresentationManifestV1 } from '../contracts/generated/PresentationManifestV1'
import { verifyCatalogPair, type DeepReadonly, type VerifiedCatalogPair } from '../contracts/verify'

const MAX_PROJECTION_BYTES = 256 * 1024
const MAX_KEYSET_BYTES = 128 * 1024
const CATALOG_TIMEOUT_MS = 10_000

export class CatalogUnavailableError extends Error {
  constructor() {
    super('Identity catalog is unavailable')
    this.name = 'CatalogUnavailableError'
  }
}

export interface LoadedIdentityCatalog extends VerifiedCatalogPair {
  readonly locale: string
  readonly presentation: DeepReadonly<PresentationManifestV1>
  readonly assetUrl: (assetId: string) => string
  readonly regionMessageKey: (regionId: string) => string
}

async function boundedText(url: URL, maxBytes: number): Promise<string> {
  if (url.origin !== window.location.origin) throw new Error('Catalog URL is not same-origin')
  let response: Response
  try {
    response = await fetch(url, {
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-cache',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    })
  } catch {
    throw new CatalogUnavailableError()
  }
  if (!response.ok || response.type === 'opaque') throw new CatalogUnavailableError()
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error('Identity catalog exceeds its byte limit')
  if (response.body === null) throw new Error('Identity catalog response is empty')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBytes) {
        await reader.cancel()
        throw new Error('Identity catalog exceeds its byte limit')
      }
      chunks.push(value)
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Identity catalog exceeds its byte limit') throw error
    throw new CatalogUnavailableError()
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function trustedProduct(authProjectionId: string): string {
  const product = (AUTH_PROJECTION_PRODUCTS as Readonly<Record<string, string>>)[authProjectionId]
  if (product === undefined) throw new Error('Unknown authentication projection')
  return product
}

function assetResolver(immutableAssetOrigin: string): (assetId: string) => string {
  const assets = new Map(release.assets.map((asset) => [asset.assetId, asset.relativePath] as const))
  return (assetId) => {
    const path = assets.get(assetId)
    if (path === undefined) throw new Error('Unknown presentation asset')
    const url = new URL(path.replace(/^public\//u, '/'), immutableAssetOrigin)
    if (url.origin !== immutableAssetOrigin) throw new Error('Presentation asset origin mismatch')
    return url.href
  }
}

function regionMessageKey(regionId: string): string {
  const messageKey = (AUTH_REGION_MESSAGE_KEYS as Readonly<Record<string, string>>)[regionId]
  if (messageKey === undefined) throw new Error('Unknown region message key')
  return messageKey
}

export async function loadIdentityCatalog(input: Readonly<{
  locale: string
  authProjectionId: string
  catalogVersion: string
  catalogDigest: string
}>): Promise<LoadedIdentityCatalog> {
  const encodedLocale = encodeURIComponent(input.locale)
  const encodedProjection = encodeURIComponent(input.authProjectionId)
  const encodedVersion = encodeURIComponent(input.catalogVersion)
  const projectionUrl = new URL(
    `/${encodedLocale}/auth-catalogs/${encodedProjection}/${encodedVersion}.json`,
    window.location.origin,
  )
  const signedProjection = decodeSignedAuthProjectionText(
    await boundedText(projectionUrl, MAX_PROJECTION_BYTES),
  )
  const keySetUrl = new URL(signedProjection.payload.verificationKeySetUri, window.location.origin)
  const signedKeySet = decodeSignedBrowserVerificationKeySetText(
    await boundedText(keySetUrl, MAX_KEYSET_BYTES),
  )
  const verified = await verifyCatalogPair(signedProjection, signedKeySet, {
    catalogVersion: input.catalogVersion,
    realmCatalogDigest: input.catalogDigest,
    authProjectionId: input.authProjectionId,
    productId: trustedProduct(input.authProjectionId),
    now: new Date(),
  })
  if (verified.projection.commonUiOrigin !== window.location.origin) {
    throw new Error('Authentication projection targets a different UI origin')
  }
  const presentation = verified.projection.presentation
  const trustedPresentation = release.presentations.find(
    (candidate) => candidate.presentationId === presentation.presentationId &&
      candidate.presentationVersion === presentation.presentationVersion,
  )
  if (trustedPresentation === undefined ||
      trustedPresentation.productNameMessageKey !== presentation.productNameMessageKey ||
      trustedPresentation.themePairingId !== presentation.themePairingId ||
      trustedPresentation.layout !== presentation.layout ||
      JSON.stringify(trustedPresentation.logoAssets) !== JSON.stringify(presentation.logoAssets) ||
      trustedPresentation.artworkAssetId !== presentation.artworkAssetId) {
    throw new Error('Presentation is not part of this identity UI release')
  }
  return Object.freeze({
    ...verified,
    locale: input.locale,
    presentation,
    assetUrl: assetResolver(verified.projection.immutableAssetOrigin),
    regionMessageKey,
  })
}
