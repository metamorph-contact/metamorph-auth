import { afterEach, describe, expect, it, vi } from 'vitest'
import register from '../../../metamorph-saas/docs/features/authentication/contracts/enterprise-security-http-routes-v1.json'
import { AuthApi } from '../protocol/http'
import { ScimIdentityClient } from './scim-client'
import { scimIdentityContracts } from './scim-contract.generated'
import { consumeScimFragment, parseScimFragment } from './scim-fragment'

const id = '01994200-0000-7000-8000-000000000001'
export const entry = {
  schemaVersion: 1 as const,
  sourceRegionId: 'region-a',
  activationId: id,
  provisionerId: id,
  scimUserId: id,
  ceremony: {
    schemaVersion: 1 as const,
    attemptId: id,
    continuationId: id,
    expectedCeremonyRevision: '1',
  },
  privacyPolicy: null,
  expiresAt: '2099-01-01T00:00:00Z',
  startCapability: btoa('protected-start').replace(/=+$/u, ''),
}
const request = {
  ceremony: entry.ceremony,
  submittedEmail: 'person@example.com',
  profile: {
    handle: 'person_handle',
    firstName: 'Person',
    lastName: null,
    avatarColor: '#7c3aed',
    approvedPictureRefId: null,
  },
  acknowledgedPrivacyPolicy: null,
  startCapability: entry.startCapability,
}
const accepted = {
  schemaVersion: 1,
  accepted: true,
  continuationId: id,
  expiresAt: entry.expiresAt,
}
const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
}
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers })
const client = new ScimIdentityClient(
  new AuthApi('https://identity.example.com'),
)
const signal = new AbortController().signal
const fragment = (value: unknown) =>
  '#scim=' +
  btoa(JSON.stringify(value))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
afterEach(() => {
  vi.unstubAllGlobals()
  delete window.__MM_AUTH_FRAGMENT_V1__
})
describe('Plan 09 protected activation transport', () => {
  it('matches all three exact source routes and byte bounds', () => {
    const routes = register.routes.filter((r) =>
      r.operationKey.startsWith('identity.scim.'),
    )
    expect(Object.keys(scimIdentityContracts)).toEqual(
      routes.map((r) => r.operationKey),
    )
    for (const route of routes)
      expect(
        scimIdentityContracts[
          route.operationKey as keyof typeof scimIdentityContracts
        ],
      ).toMatchObject({
        path: route.path,
        maxRequestBytes: route.maxRequestBytes,
        maxResponseBytes: route.maxResponseBytes,
      })
  })
  it('sends a protected request without cookies or browser authority', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(accepted))
    vi.stubGlobal('fetch', fetcher)
    expect(
      await client.call(
        'identity.scim.primary_email.start',
        request,
        id,
        signal,
      ),
    ).toEqual(accepted)
    const [url, init] = fetcher.mock.calls[0]
    expect(String(url)).toBe(
      'https://identity.example.com/api/auth/v1/security/identity/scim/primary-email/start',
    )
    expect(init).toMatchObject({
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    })
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      'Idempotency-Key': id,
    })
  })
  it('rejects untyped requests before dispatch and mismatched or duplicate responses', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(accepted))
    vi.stubGlobal('fetch', fetcher)
    await expect(
      client.call(
        'identity.scim.primary_email.start',
        { ...request, cookie: 'authority' } as never,
        id,
        signal,
      ),
    ).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
    fetcher.mockResolvedValueOnce(
      response({
        ...accepted,
        continuationId: '01994200-0000-7000-8000-000000000002',
      }),
    )
    await expect(
      client.call('identity.scim.primary_email.start', request, id, signal),
    ).rejects.toThrow()
    fetcher.mockResolvedValueOnce(
      new Response(
        JSON.stringify(accepted).replace(
          '"accepted":',
          '"accepted":false,"accepted":',
        ),
        { headers },
      ),
    )
    await expect(
      client.call('identity.scim.primary_email.start', request, id, signal),
    ).rejects.toThrow()
  })
  it('rejects a false or expired acceptance response', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response({ ...accepted, accepted: false }))
      .mockResolvedValueOnce(
        response({ ...accepted, expiresAt: '2000-01-01T00:00:00Z' }),
      )
    vi.stubGlobal('fetch', fetcher)
    await expect(
      client.call('identity.scim.primary_email.start', request, id, signal),
    ).rejects.toMatchObject({ retryable: false })
    await expect(
      client.call('identity.scim.primary_email.start', request, id, signal),
    ).rejects.toMatchObject({ retryable: false })
  })
  it('preserves retryability when response streaming fails after dispatch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(c) {
              c.error(new TypeError('connection lost'))
            },
          }),
          { headers },
        ),
      ),
    )
    await expect(
      client.call('identity.scim.primary_email.start', request, id, signal),
    ).rejects.toMatchObject({ retryable: true })
  })
  it('cancels an oversized stream and never follows a route correction', async () => {
    const cancel = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(new Uint8Array(65_537))
            },
            cancel,
          }),
          { headers },
        ),
      ),
    )
    await expect(
      client.call('identity.scim.primary_email.start', request, id, signal),
    ).rejects.toThrow()
    expect(cancel).toHaveBeenCalledOnce()
  })
})
describe('Plan 09 activation fragment custody', () => {
  it('accepts only a closed generated entry and typed email challenge', () => {
    const value = {
      entry,
      catalogDigest: 'A'.repeat(43),
      challenge: { challengeId: id, proof: 'A'.repeat(43) },
    }
    expect(parseScimFragment(fragment(value))).toEqual(value)
    for (const candidate of [
      { ...value, apiOrigin: 'https://other.example.com' },
      { ...value, entry: { ...entry, email: 'assertion@example.com' } },
      { ...value, challenge: { ...value.challenge, admin: true } },
    ])
      expect(() => parseScimFragment(fragment(candidate))).toThrow()
  })
  it('consumes and scrubs the fragment before any asynchronous work', () => {
    const value = { entry, catalogDigest: 'A'.repeat(43) }
    Object.defineProperty(window, '__MM_AUTH_FRAGMENT_V1__', {
      value: fragment(value),
      configurable: true,
    })
    window.history.replaceState(
      null,
      '',
      '/en/auth/projection/version/scim/activate#discard',
    )
    expect(consumeScimFragment()).toEqual(value)
    expect(window.location.hash).toBe('')
    expect(window.__MM_AUTH_FRAGMENT_V1__).toBeUndefined()
    expect(() => consumeScimFragment()).toThrow()
  })
})
