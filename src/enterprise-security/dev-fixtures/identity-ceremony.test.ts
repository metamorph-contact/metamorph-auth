import { describe, expect, it } from 'vitest'

import { ceremonyIdentityScreens } from '../identity-ceremony-client'
import { identityCeremonyFixture, identityCeremonyScenarios, previewPasskeyBrowserAdapter } from './identity-ceremony'
import { identityPreviewStates } from './identity-states'

describe('EA-01J ceremony fixtures', () => {
  it('registers each ceremony screen and scenario exactly once', () => {
    expect(identityCeremonyScenarios).toHaveLength(ceremonyIdentityScreens.length * identityPreviewStates.length)
    expect(new Set(identityCeremonyScenarios.map((scenario) => scenario.id)).size).toBe(identityCeremonyScenarios.length)
  })

  it('returns typed challenges and never fabricates passkey verification', async () => {
    const client = identityCeremonyFixture('ready')
    const payload = await client.load('SCR-IDN-002', new AbortController().signal)
    expect(payload).toMatchObject({ kind: 'passkey', assertion: { kind: 'challenge' }, registration: { kind: 'challenge' } })
    if (payload.kind !== 'passkey') throw new Error('Wrong fixture payload')
    await expect(previewPasskeyBrowserAdapter.assert(payload.assertion, new AbortController().signal)).rejects.toThrow()
    await expect(previewPasskeyBrowserAdapter.register(payload.registration, new AbortController().signal)).rejects.toThrow()
  })

  it('shows manual TOTP material once and rejects a fabricated code', async () => {
    const client = identityCeremonyFixture('ready')
    const payload = await client.load('SCR-IDN-003', new AbortController().signal)
    if (payload.kind !== 'totp') throw new Error('Wrong fixture payload')
    expect(payload.enrollment.kind).toBe('material_unavailable')
    expect((await client.firstDisplayTotp(payload.ceremony, new AbortController().signal)).kind).toBe('first_display')
    expect((await client.firstDisplayTotp(payload.ceremony, new AbortController().signal)).kind).toBe('material_unavailable')
    await expect(client.verifyTotp({ ceremony: payload.ceremony, code: '123456' }, new AbortController().signal))
      .rejects.toMatchObject({ envelope: { error: { code: 'security.ceremony.mismatch' } } })
  })

  it('keeps recovery-code and step-up proof server-owned', async () => {
    const client = identityCeremonyFixture('ready')
    const challenge = await client.load('SCR-IDN-004', new AbortController().signal)
    if (challenge.kind !== 'recovery-code') throw new Error('Wrong fixture payload')
    await expect(client.redeemRecoveryCode({ ceremony: challenge.ceremony, code: 'ABCD-1234' }, new AbortController().signal))
      .rejects.toMatchObject({ envelope: { error: { code: 'security.ceremony.mismatch' } } })
    const stepUp = await client.load('SCR-IDN-005', new AbortController().signal)
    expect(stepUp).toMatchObject({ kind: 'step-up', request: { operationKey: 'admin.authentication.apply' }, enrollment: { nextStep: 'first_login_enrollment' } })
    expect(JSON.stringify(stepUp)).not.toContain('actionProof')
  })

  it('distinguishes hold, repudiation, expiry, timeout, and replay', async () => {
    const getStatus = async (state: 'partial' | 'async-progress' | 'read-only' | 'terminal-error') => {
      const payload = await identityCeremonyFixture(state).load('SCR-IDN-010', new AbortController().signal)
      if (payload.kind !== 'factor-recovery') throw new Error('Wrong fixture payload')
      return payload.status.state
    }
    expect(await getStatus('partial')).toBe('awaiting_approval')
    expect(await getStatus('async-progress')).toBe('waiting_period')
    expect(await getStatus('read-only')).toBe('repudiated')
    expect(await getStatus('terminal-error')).toBe('expired')
    await expect(identityCeremonyFixture('terminal-error').load('SCR-IDN-002', new AbortController().signal))
      .rejects.toMatchObject({ envelope: { error: { code: 'security.ceremony.expired' } } })
    await expect(identityCeremonyFixture('stale-revision').load('SCR-IDN-002', new AbortController().signal))
      .rejects.toMatchObject({ envelope: { error: { code: 'security.ceremony.mismatch' } } })
  })

  it('cancels pending ceremony work on screen or scenario changes', async () => {
    const controller = new AbortController()
    const pending = identityCeremonyFixture('loading').load('SCR-IDN-002', controller.signal)
    controller.abort('screen changed')
    await expect(pending).rejects.toBe('screen changed')
  })
})
