import { describe, expect, it, vi } from 'vitest'
import {
  FederationJourney,
  allowedProvider,
  nextFederationState,
  leaveFederationInbox,
} from './federation-journey'
import {
  federationJourneyFixture,
  JOURNEY_FIXTURE_FLOW,
  JOURNEY_FIXTURE_PROOF,
  JOURNEY_FIXTURE_CALLBACK,
  JOURNEY_FIXTURE_CHALLENGE,
} from './dev-fixtures/federation-journey'
import { prepareFederationRequest } from './federation-contract'
import { decodeFederationResponse } from './federation-decode'
import { fixtureFederationProviders } from './dev-fixtures/federation-providers'
import { __test } from '../security/fragment'
function setup(options = {}) {
  const fixture = federationJourneyFixture(options)
  const journey = new FederationJourney(
    JOURNEY_FIXTURE_FLOW,
    'octamorph-browser',
    fixture.client,
    fixture.resolution.expiresAt,
  )
  return { fixture, journey }
}
describe('owned federation browser journey', () => {
  it('uses exact current provider choices and keeps external callback tokens server-owned', async () => {
    const { fixture, journey } = setup()
    await expect(journey.start(fixture.resolution, fixtureFederationProviders[0])).resolves.toBe(
      'https://idp.example.invalid/development-only',
    )
    expect(() =>
      allowedProvider(fixture.resolution, {
        ...fixtureFederationProviders[0],
        providerRevision: '2',
      }),
    ).toThrow('security.ceremony.mismatch')
    const request = {
      schemaVersion: 1 as const,
      callbackId: JOURNEY_FIXTURE_CALLBACK,
      providerId: fixtureFederationProviders[0].providerId,
      proof: {
        kind: 'oidc' as const,
        state: JOURNEY_FIXTURE_PROOF,
        authorizationCode: 'opaque-provider-code',
      },
    }
    expect(() =>
      prepareFederationRequest('identity.federation.callback', request, JOURNEY_FIXTURE_FLOW),
    ).toThrow('Browser callbacks cannot submit protocol proofs')
  })
  it('redeems without confirmation, then submits the original callback ID only after confirmation', async () => {
    const { fixture, journey } = setup()
    const state = await journey.redeem(JOURNEY_FIXTURE_PROOF)
    expect(state.kind).toBe('confirm')
    expect(fixture.inspect().verified).toBe(false)
    if (state.kind !== 'confirm') throw new Error('missing handoff')
    expect(state.handoff.callbackId).toBe(JOURNEY_FIXTURE_CALLBACK)
    expect(state.handoff.callbackId).not.toBe(JOURNEY_FIXTURE_FLOW)
    expect((await journey.confirm(state)).kind).toBe('verify-email')
  })
  it('preserves exact request and command after an email-start response is lost', async () => {
    const { fixture, journey } = setup({ loseEmailResponse: true })
    const initial = nextFederationState(fixture.initial)
    if (initial.kind !== 'verify-email') throw new Error('wrong initial')
    await expect(journey.email(initial, 'chosen@example.com')).rejects.toThrow(
      'Simulated response loss',
    )
    await expect(journey.email(initial, 'different@example.com')).rejects.toThrow(
      'security.operation.conflict',
    )
    const started = await journey.email(initial, 'chosen@example.com')
    expect(fixture.inspect().commands).toBe(1)
    expect(started.kind).toBe('verify-email')
    if (started.kind !== 'verify-email') throw new Error('wrong state')
    expect(started.challengeId).toBe(JOURNEY_FIXTURE_CHALLENGE)
    expect(started.challengeId).not.toBe(started.progress.continuationId)
  })
  it('independently verifies the chosen primary email and pins the separate provisional revision', async () => {
    const { fixture, journey } = setup()
    const initial = nextFederationState(fixture.initial)
    if (initial.kind !== 'verify-email') throw new Error('wrong state')
    const email = await journey.email(initial, 'chosen@example.com')
    if (email.kind !== 'verify-email') throw new Error('wrong state')
    const profile = await journey.verify(email, JOURNEY_FIXTURE_PROOF)
    if (profile.kind !== 'profile') throw new Error('wrong state')
    expect(profile.provisionalRevision).toBe('19')
    expect(profile.provisionalRevision).not.toBe(profile.progress.ceremonyRevision)
    const inbox = await journey.profile(
      profile,
      {
        handle: 'alex-example',
        firstName: 'Alex',
        lastName: null,
        avatarColor: '#7c3aed',
        approvedPictureRefId: null,
      },
      null,
    )
    expect(inbox.kind).toBe('invitations')
    expect(fixture.inspect()).toMatchObject({
      email: 'chosen@example.com',
      verified: true,
      completed: true,
    })
    if (inbox.kind !== 'invitations') throw new Error('wrong state')
    expect(leaveFederationInbox(inbox).kind).toBe('ready')
    const owner = { establishment: vi.fn(), continueAccount: vi.fn() }
    // A runtime caller cannot bypass the explicit inbox departure.
    await expect(journey.finish(inbox as never, owner)).rejects.toThrow(
      'security.ceremony.mismatch',
    )
    expect(owner.establishment).not.toHaveBeenCalled()
  })
  it('refuses malformed owner profile context and unknown choices', () => {
    const { fixture } = setup()
    expect(() =>
      nextFederationState({
        progress: { ...fixture.initial.progress, nextStep: 'complete_profile' },
        jitProfile: null,
      }),
    ).toThrow('security.ceremony.mismatch')
    const invalid = { ...fixture.resolution, federationProviders: [], methods: ['federation'] }
    expect(() =>
      decodeFederationResponse('identity.methods.resolve', JSON.stringify(invalid)),
    ).toThrow('Invalid federation choices')
    expect(() =>
      decodeFederationResponse(
        'identity.methods.resolve',
        JSON.stringify({
          ...fixture.resolution,
          federationProviders: [fixtureFederationProviders[0], fixtureFederationProviders[0]],
        }),
      ),
    ).toThrow('Invalid federation choices')
  })
  it('never conflates collisions or controlled-factor requirements with readiness', () => {
    expect(nextFederationState(setup({ collision: true }).fixture.initial).kind).toBe('collision')
    expect(nextFederationState(setup({ factor: true }).fixture.initial).kind).toBe('factor')
  })
  it('erases command ownership on stop and refuses late work', async () => {
    const { fixture, journey } = setup()
    journey.stop()
    await expect(journey.start(fixture.resolution, fixtureFederationProviders[0])).rejects.toThrow(
      'security.ceremony.expired',
    )
    expect(fixture.inspect().commands).toBe(0)
  })
  it('rejects expired method resolution and a mismatched ceremony/header command', () => {
    const { fixture } = setup()
    expect(() =>
      allowedProvider(
        { ...fixture.resolution, expiresAt: '2000-01-01T00:00:00Z' },
        fixtureFederationProviders[0],
      ),
    ).toThrow('security.ceremony.expired')
    expect(() =>
      prepareFederationRequest(
        'identity.jit.primary_email.start',
        {
          ceremony: {
            schemaVersion: 1,
            attemptId: JOURNEY_FIXTURE_CALLBACK,
            continuationId: fixture.initial.progress.continuationId,
            expectedCeremonyRevision: '1',
          },
          submittedEmail: 'chosen@example.com',
        },
        JOURNEY_FIXTURE_FLOW,
      ),
    ).toThrow('Invalid Plan 06 idempotency binding')
  })
  it('accepts only the exact server SAML fragment and refuses copy/tamper fields', () => {
    expect(
      __test.parseFragment(`#saml_handoff=${JOURNEY_FIXTURE_PROOF}&provider_region=local-a`),
    ).toEqual({
      kind: 'samlHandoff',
      handoffProof: JOURNEY_FIXTURE_PROOF,
      providerRegionId: 'local-a',
    })
    for (const hash of [
      `#saml_handoff=${JOURNEY_FIXTURE_PROOF}&provider_region=local-a&extra=1`,
      `#provider_region=local-a&saml_handoff=${JOURNEY_FIXTURE_PROOF}`,
      `#saml_handoff=x&provider_region=local-a`,
      `#saml_handoff=${JOURNEY_FIXTURE_PROOF}&provider_region=https://evil.example`,
    ])
      expect(() => __test.parseFragment(hash)).toThrow()
  })
})
it.each(['verify_email', 'resolve_identity'] as const)(
  'admits new D-purpose %s after SAML confirmation under the original CSI flow deadline',
  async (nextStep) => {
    const fixture = federationJourneyFixture()
    const client = {
      call: vi.fn(async (op: string) =>
        op === 'identity.federation.handoff.redeem'
          ? {
              schemaVersion: 1,
              callbackId: JOURNEY_FIXTURE_CALLBACK,
              targetTenantId: fixtureFederationProviders[1].targetTenantId,
              providerId: fixtureFederationProviders[1].providerId,
              tenantDisplayName: 'Studio',
              providerDisplayName: 'Provider',
              continuation: {
                ...fixture.initial.progress,
                nextStep: 'confirm_federation',
                expiresAt: new Date(Date.now() + 60_000).toISOString(),
              },
            }
          : {
              progress: {
                ...fixture.initial.progress,
                continuationId: JOURNEY_FIXTURE_CHALLENGE,
                nextStep,
              },
              jitProfile: null,
            },
      ),
    }
    const journey = new FederationJourney(
      JOURNEY_FIXTURE_FLOW,
      'octamorph-browser',
      client as never,
      fixture.resolution.expiresAt,
    )
    const state = await journey.redeem(JOURNEY_FIXTURE_PROOF)
    if (state.kind !== 'confirm') throw new Error('wrong state')
    expect((await journey.confirm(state)).kind).toBe(
      nextStep === 'verify_email' ? 'verify-email' : 'collision',
    )
    client.call.mockResolvedValueOnce({
      progress: {
        ...fixture.initial.progress,
        continuationId: JOURNEY_FIXTURE_CHALLENGE,
        expiresAt: new Date(Date.now() + 16 * 60_000).toISOString(),
      },
      jitProfile: null,
    } as never)
    await expect(journey.confirm(state)).rejects.toThrow('security.ceremony.mismatch')
  },
)
