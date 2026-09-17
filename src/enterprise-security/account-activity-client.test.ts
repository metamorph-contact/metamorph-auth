import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountSecurityActivityClient, accountSlotFromSearch } from './account-activity-client'

const ACCOUNT_SLOT = '018f3d2a-71c0-7a62-8f4a-222222222222'
const EVENT_ID = '018f3d2a-71c0-7a62-8f4a-333333333333'

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => vi.unstubAllGlobals())

describe('account security activity client', () => {
  it('accepts exactly one UUIDv7 account selection', () => {
    expect(accountSlotFromSearch(`?accountSlotId=${ACCOUNT_SLOT}`)).toBe(ACCOUNT_SLOT)
    expect(() => accountSlotFromSearch(`?accountSlotId=${ACCOUNT_SLOT}&accountSlotId=${EVENT_ID}`)).toThrow()
    expect(() => accountSlotFromSearch(`?accountSlotId=${ACCOUNT_SLOT}&userId=${EVENT_ID}`)).toThrow()
  })

  it('bootstraps and reads only the selected account on the current origin', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(json({
        kind: 'ordinary', schemaVersion: 1, regionId: 'local-a', accountSlotId: ACCOUNT_SLOT,
        session: { authenticatedAt: '2026-09-15T10:00:00Z', idleExpiresAt: '2026-09-15T11:00:00Z', absoluteExpiresAt: '2026-09-16T10:00:00Z' },
        principal: { displayName: 'Kiran', avatar: { kind: 'color', value: '#334455' } },
        csrfToken: 'c'.repeat(43), csrfEpoch: '1',
      }))
      .mockResolvedValueOnce(json({
        schemaVersion: 1,
        asOf: '2026-09-15T10:05:00Z',
        page: {
          items: [{
            eventId: EVENT_ID, occurredAt: '2026-09-15T10:01:00Z', kind: 'passkey', outcome: 'succeeded',
            reason: null, method: null, provider: null, regionId: 'local-a', countryCode: null, deviceClass: 'unknown',
          }],
          nextCursor: null,
          partialFailures: [],
        },
      }))
    vi.stubGlobal('fetch', fetch)

    const client = new AccountSecurityActivityClient()
    const session = await client.bootstrap(ACCOUNT_SLOT)
    const activity = await client.page(session)

    expect(activity.page.items[0]?.kind).toBe('passkey')
    expect(fetch).toHaveBeenCalledTimes(2)
    const activityRequest = fetch.mock.calls[1]?.[1] as RequestInit
    const headers = new Headers(activityRequest.headers)
    expect(headers.get('X-Metamorph-Account-Slot')).toBe(ACCOUNT_SLOT)
    expect(headers.get('X-Metamorph-CSRF')).toBe('c'.repeat(43))
  })

  it('rejects a bootstrap response for another account', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({
      kind: 'ordinary', schemaVersion: 1, regionId: 'local-a', accountSlotId: EVENT_ID,
      session: { authenticatedAt: '2026-09-15T10:00:00Z', idleExpiresAt: '2026-09-15T11:00:00Z', absoluteExpiresAt: '2026-09-16T10:00:00Z' },
      principal: { displayName: 'Other', avatar: { kind: 'color', value: '#334455' } },
      csrfToken: 'c'.repeat(43), csrfEpoch: '1',
    })))
    await expect(new AccountSecurityActivityClient().bootstrap(ACCOUNT_SLOT)).rejects.toThrow('another account')
  })
})
