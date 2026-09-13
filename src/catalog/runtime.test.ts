import { afterEach, describe, expect, it, vi } from 'vitest'

import { CatalogUnavailableError, loadIdentityCatalog } from './runtime'

afterEach(() => vi.unstubAllGlobals())

describe('identity catalog response boundary', () => {
  it('rejects non-JSON MIME before decoding a signed projection', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://auth.example.test' } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })))
    await expect(loadIdentityCatalog({
      locale: 'en',
      authProjectionId: 'octamorph',
      catalogVersion: 'development-3',
      catalogDigest: 'x'.repeat(43),
    })).rejects.toBeInstanceOf(CatalogUnavailableError)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
