import { describe, expect, it } from 'vitest'

import { coreIdentityScreens, coreIdentityStates } from '../identity-core-client'
import { identityCoreFixture, identityCoreScenarios } from './identity-core'

describe('EA-01I core identity previews', () => {
  it('registers every core screen and deterministic state exactly once', () => {
    expect(identityCoreScenarios).toHaveLength(coreIdentityScreens.length * coreIdentityStates.length)
    expect(new Set(identityCoreScenarios.map((scenario) => scenario.id)).size).toBe(identityCoreScenarios.length)
  })

  it('keeps method availability flow-scoped and account selection separate', async () => {
    const entry = await identityCoreFixture('ready').load('SCR-IDN-001', new AbortController().signal)
    expect(entry).toMatchObject({ kind: 'entry', resolution: { methods: ['password', 'passkey', 'federation', 'social'] } })
    expect(JSON.stringify(entry)).not.toContain('alex@example.invalid')
    const account = await identityCoreFixture('partial').load('SCR-IDN-011', new AbortController().signal)
    expect(account).toMatchObject({ kind: 'accounts', accounts: { unavailableCount: 1 } })
    expect(JSON.stringify(account)).not.toContain('firstDisplayBearer')
  })

  it('uses existing CSI response shapes without treating a preview as a credential result', async () => {
    const client = identityCoreFixture('ready')
    expect(await client.load('SCR-IDN-012', new AbortController().signal))
      .toMatchObject({ kind: 'signup', progress: { kind: 'verificationPending', nextStep: 'checkEmail' } })
    expect(await client.load('SCR-IDN-013', new AbortController().signal))
      .toMatchObject({ kind: 'verification', preview: { challengeKind: 'signupVerification' } })
    expect(await client.load('SCR-IDN-014', new AbortController().signal))
      .toMatchObject({ kind: 'organization', progress: { tenantResolution: 'organizationNew', nextStep: 'organizationDetails' } })
    expect(await client.load('SCR-IDN-015', new AbortController().signal))
      .toMatchObject({ kind: 'recovery', accepted: { accepted: true } })
    expect(await client.load('SCR-IDN-016', new AbortController().signal))
      .toMatchObject({ kind: 'finalization', result: { navigationUri: 'https://product.example.invalid/fixture-return' } })
  })

  it('distinguishes retryable, terminal, regional, and provider failures', async () => {
    for (const [state, code] of [
      ['retryable-error', 'security.owner.unavailable'],
      ['terminal-error', 'security.request.invalid'],
      ['regional-correction', 'security.route.retry'],
      ['provider-outage', 'security.provider.unavailable'],
    ] as const) {
      await expect(identityCoreFixture(state).load('SCR-IDN-017', new AbortController().signal))
        .rejects.toMatchObject({ envelope: { error: { code } } })
    }
  })

  it('cancels pending work when the screen or scenario changes', async () => {
    const controller = new AbortController()
    const pending = identityCoreFixture('loading').load('SCR-IDN-011', controller.signal)
    controller.abort('preview changed')
    await expect(pending).rejects.toBe('preview changed')
  })
})
