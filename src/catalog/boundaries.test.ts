import { describe, expect, it } from 'vitest'

import type { LoadedIdentityCatalog } from './runtime'
import { catalogNavigationUri, identityApiForRegion } from './boundaries'

const catalog = {
  projection: {
    commonUiOrigin: 'https://auth.example',
    productUiOrigin: 'https://octamorph.example',
    authProjectionId: 'octamorph-browser',
    catalogVersion: 'v1',
    supportedLocales: ['en'],
    registeredReturns: [{ purpose: 'productCompletion', path: '/en/auth/complete' }],
    registeredCallbacks: [{ purpose: 'authorizationResponse', path: '/api/auth/v1/relays/callback' }],
    regions: [{ regionId: 'eu', identityOrigin: 'https://identity.eu.example', controllerOrigin: 'https://controller.eu.example', productApiOrigin: 'https://api.eu.octamorph.example' }],
  },
} as unknown as LoadedIdentityCatalog

describe('signed catalog boundaries', () => {
  it('binds a claimed identity origin to its exact region', () => {
    expect(identityApiForRegion(catalog, 'eu', 'https://identity.eu.example').origin).toBe('https://identity.eu.example')
    expect(() => identityApiForRegion(catalog, 'eu', 'https://evil.example')).toThrow()
  })

  it('accepts only registered product and common identity navigation', () => {
    expect(catalogNavigationUri(catalog, 'https://octamorph.example/en/auth/complete#receipt')).toContain('/en/auth/complete')
    expect(catalogNavigationUri(catalog, 'https://auth.example/en/auth/octamorph-browser/v1/authorize#v=1')).toContain('/authorize')
    expect(() => catalogNavigationUri(catalog, 'https://evil.example/en/auth/complete#receipt')).toThrow()
    expect(() => catalogNavigationUri(catalog, 'https://octamorph.example/not-registered')).toThrow()
  })

  it('admits only a locale/catalog-bound non-bearer conditional nonce path with no extra input', () => {
    const base = 'https://auth.example/en/auth/octamorph-browser/v1/conditional-step-up/'
    const nonce = '018f0000-0000-7000-8000-000000000001'
    expect(catalogNavigationUri(catalog, base + nonce)).toBe(base + nonce)
    for (const suffix of [nonce + '#secret', nonce + '?account=other', nonce + '/extra', 'not-a-nonce']) {
      expect(() => catalogNavigationUri(catalog, base + suffix)).toThrow()
    }
    expect(() => catalogNavigationUri(catalog, base.replace('/en/', '/fr/') + nonce)).toThrow()
  })

  it('accepts only the three exact catalog-bound product relay documents', () => {
    for (const path of [
      '/api/auth/v1/relays/relocation',
      '/api/auth/v1/relays/preparation',
      '/api/auth/v1/relays/callback',
    ]) {
      expect(catalogNavigationUri(catalog, `https://api.eu.octamorph.example${path}#relay`)).toContain(path)
    }
    expect(() => catalogNavigationUri(catalog, 'https://api.eu.octamorph.example/api/auth/v1/callbacks')).toThrow()
    expect(() => catalogNavigationUri(catalog, 'https://api.other.octamorph.example/api/auth/v1/relays/preparation')).toThrow()
  })
})
