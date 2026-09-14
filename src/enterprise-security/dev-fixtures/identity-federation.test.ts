import { describe, expect, it } from 'vitest'

import { federationIdentityScreens } from '../identity-federation-client'
import { identityFederationFixture, identityFederationScenarios } from './identity-federation'
import { identityPreviewStates } from './identity-states'

describe('EA-01K federation and activation fixtures', () => {
  it('registers every assigned screen and scenario exactly once', () => {
    expect(identityFederationScenarios).toHaveLength(federationIdentityScreens.length * identityPreviewStates.length)
    expect(new Set(identityFederationScenarios.map((scenario) => scenario.id)).size).toBe(identityFederationScenarios.length)
  })

  it('keeps SAML handoff distinct from OIDC and never returns a callback proof', async () => {
    const saml = await identityFederationFixture('ready', 'saml').load('SCR-IDN-006', new AbortController().signal)
    const oidc = await identityFederationFixture('ready', 'oidc').load('SCR-IDN-006', new AbortController().signal)
    expect(saml).toMatchObject({ kind: 'federation', request: { protocol: 'saml' }, handoff: { continuation: { nextStep: 'verify_factor' } } })
    expect(oidc).toMatchObject({ kind: 'federation', request: { protocol: 'oidc' }, handoff: null })
    expect(JSON.stringify(saml)).not.toContain('authorizationCode')
    expect(JSON.stringify(saml)).not.toContain('relayState')
  })

  it('presents SSO-only and emergency request acceptance without activation', async () => {
    const result = await identityFederationFixture('ready', 'saml').load('SCR-IDN-007', new AbortController().signal)
    expect(result).toMatchObject({ kind: 'emergency', methods: { methods: ['federation'] }, entry: { accepted: true } })
    expect(JSON.stringify(result)).not.toContain('activationId')
  })

  it('keeps verified email, identity completion, and target access distinct', async () => {
    const client = identityFederationFixture('ready', 'saml')
    expect(await client.load('SCR-IDN-008', new AbortController().signal))
      .toMatchObject({ kind: 'jit-profile', verification: { nextStep: 'verify_email' }, profileRequest: { profile: { handle: 'alex-example', firstName: 'Alex', avatarColor: '#7c3aed', approvedPictureRefId: null }, privacyAcknowledgement: null }, completion: { nextStep: 'ready' } })
    expect(await client.load('SCR-IDN-018', new AbortController().signal))
      .toMatchObject({ kind: 'scim-activation', verification: { nextStep: 'verify_email' }, activation: { nextStep: 'ready' } })
    const pending = await identityFederationFixture('partial', 'saml').load('SCR-IDN-018', new AbortController().signal)
    expect(pending).toMatchObject({ kind: 'scim-activation', activation: { nextStep: 'verify_email' } })
    expect(JSON.stringify(pending)).not.toContain('targetAccessRevision')
  })

  it('distinguishes provider outage, stale routing, and cancellation', async () => {
    await expect(identityFederationFixture('provider-outage', 'saml').load('SCR-IDN-006', new AbortController().signal))
      .rejects.toMatchObject({ envelope: { error: { code: 'security.provider.unavailable' } } })
    await expect(identityFederationFixture('regional-correction', 'saml').load('SCR-IDN-006', new AbortController().signal))
      .rejects.toMatchObject({ envelope: { error: { code: 'security.route.retry' } } })
    const controller = new AbortController()
    const result = identityFederationFixture('loading', 'saml').load('SCR-IDN-006', controller.signal)
    controller.abort('route changed')
    await expect(result).rejects.toBe('route changed')
  })
})
