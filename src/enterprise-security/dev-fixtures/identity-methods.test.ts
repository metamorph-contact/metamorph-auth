import { describe, expect, it } from 'vitest'

import type { IdentityEntryRequestV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityEntryRequestV1'
import { identityMethodFixture } from './identity-methods'

const request: IdentityEntryRequestV1 = {
  schemaVersion: 1,
  flowId: '018f0000-0000-7000-8000-000000000002',
  realmId: 'fixture-realm',
  clientRegistrationId: 'octamorph-browser',
  routeHint: null,
}

describe('EA-01A identity method fixtures', () => {
  it('returns typed deterministic ready and empty states', async () => {
    const signal = new AbortController().signal
    expect((await identityMethodFixture('SCR-IDN-001:ready').resolveMethods(request, signal)).methods)
      .toEqual(['password', 'passkey', 'federation', 'social'])
    expect((await identityMethodFixture('SCR-IDN-001:empty').resolveMethods(request, signal)).methods)
      .toEqual([])
  })

  it('uses a generated stable error and cancels stale work', async () => {
    await expect(identityMethodFixture('SCR-IDN-001:retryable-error').resolveMethods(request, new AbortController().signal))
      .rejects.toMatchObject({
        envelope: { error: { code: 'security.owner.unavailable' } },
      })
    const controller = new AbortController()
    const pending = identityMethodFixture('SCR-IDN-001:loading').resolveMethods(request, controller.signal)
    controller.abort('scope changed')
    await expect(pending).rejects.toBe('scope changed')
  })
})
