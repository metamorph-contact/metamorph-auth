import type { IdentityCeremonyProgressV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityCeremonyProgressV1'
import type { IdentityFederationProgressV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityFederationProgressV1'
import type { IdentityMethodResolutionV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import { transportedFederationClient } from '../federation-client'
import type { FederationTransport } from '../federation-contract'
import { fixtureFederationProviders } from './federation-providers'

export const JOURNEY_FIXTURE_FLOW = '01994000-0000-7000-8000-000000000010'
export const JOURNEY_FIXTURE_CALLBACK = '01994000-0000-7000-8000-000000000011'
export const JOURNEY_FIXTURE_CONTINUATION = '01994000-0000-7000-8000-000000000012'
export const JOURNEY_FIXTURE_CHALLENGE = '01994000-0000-7000-8000-000000000013'
export const JOURNEY_FIXTURE_PROOF = 'A'.repeat(43)
/** Development-only protocol return. It is never an actual IdP/test receipt
 * and cannot establish any CSI account, provider readiness or product access. */
export function federationJourneyFixture(
  options: {
    factor?: boolean
    collision?: boolean
    loseEmailResponse?: boolean
    loseProfileResponse?: boolean
    ttlMs?: number
  } = {},
) {
  const expiresAt = new Date(Date.now() + (options.ttlMs ?? 15 * 60_000)).toISOString()
  let revision = 1
  let email: string | undefined
  let verified = false
  let completed = false
  let lost = false
  let lostProfile = false
  const receipts = new Map<string, { body: string; result: unknown }>()
  function progress(nextStep: IdentityCeremonyProgressV1['nextStep']): IdentityCeremonyProgressV1 {
    return {
      schemaVersion: 1,
      continuationId: JOURNEY_FIXTURE_CONTINUATION,
      ceremonyRevision: String(revision),
      nextStep,
      subjectReproof: null,
      expiresAt,
    }
  }
  const resolution: IdentityMethodResolutionV1 = {
    schemaVersion: 1,
    continuationId: JOURNEY_FIXTURE_CONTINUATION,
    methods: ['password', 'federation'],
    federationProviders: structuredClone(fixtureFederationProviders),
    socialProviders: [],
    expiresAt,
  }
  const initial: IdentityFederationProgressV1 = {
    progress: progress(
      options.collision ? 'resolve_identity' : options.factor ? 'verify_factor' : 'verify_email',
    ),
    jitProfile: null,
  }
  const transport: FederationTransport = async (request, signal) => {
    signal.throwIfAborted()
    if (Date.now() >= Date.parse(expiresAt)) throw new Error('security.ceremony.expired')
    const id = request.contractHeaders['Idempotency-Key']
    const key = `${request.operation}/${id}`
    const prior = receipts.get(key)
    if (prior && prior.body !== request.body) throw new Error('security.operation.conflict')
    let result: unknown = prior?.result
    if (!prior) {
      const input = JSON.parse(request.body)
      if (input.flowId !== undefined && input.flowId !== JOURNEY_FIXTURE_FLOW)
        throw new Error('security.ceremony.mismatch')
      if (
        input.ceremony !== undefined &&
        (input.ceremony.continuationId !== JOURNEY_FIXTURE_CONTINUATION ||
          input.ceremony.expectedCeremonyRevision !== String(revision))
      )
        throw new Error('security.ceremony.mismatch')
      switch (request.operation) {
        case 'identity.methods.resolve':
          result = resolution
          break
        case 'identity.federation.start': {
          const provider = fixtureFederationProviders.find(
            (p) =>
              p.providerId === input.providerId &&
              p.targetTenantId === input.targetTenantId &&
              p.protocol === input.protocol,
          )
          if (!provider) throw new Error('security.ceremony.mismatch')
          result = {
            schemaVersion: 1,
            attemptId: JOURNEY_FIXTURE_CALLBACK,
            providerId: provider.providerId,
            redirectRegistrationId: 'fixture-only',
            navigationUri: 'https://idp.example.invalid/development-only',
            expiresAt,
          }
          break
        }
        case 'identity.federation.handoff.redeem': {
          if (input.handoffProof !== JOURNEY_FIXTURE_PROOF)
            throw new Error('security.ceremony.mismatch')
          const provider = fixtureFederationProviders[1]
          result = {
            schemaVersion: 1,
            callbackId: JOURNEY_FIXTURE_CALLBACK,
            targetTenantId: provider.targetTenantId,
            providerId: provider.providerId,
            tenantDisplayName: 'Example Studio',
            providerDisplayName: provider.providerDisplayName,
            continuation: progress('confirm_federation'),
          }
          break
        }
        case 'identity.federation.callback': {
          if (
            input.callbackId !== JOURNEY_FIXTURE_CALLBACK ||
            input.proof.kind !== 'saml_handoff_continue' ||
            input.proof.continuationId !== JOURNEY_FIXTURE_CONTINUATION ||
            input.proof.expectedCeremonyRevision !== String(revision)
          )
            throw new Error('security.ceremony.mismatch')
          revision++
          result = { ...initial, progress: progress(initial.progress.nextStep) }
          break
        }
        case 'identity.jit.primary_email.start': {
          if (verified || completed) throw new Error('security.ceremony.mismatch')
          email = input.submittedEmail
          revision++
          result = { progress: progress('verify_email'), challengeId: JOURNEY_FIXTURE_CHALLENGE }
          break
        }
        case 'identity.jit.primary_email.verify': {
          if (
            !email ||
            input.challengeId !== JOURNEY_FIXTURE_CHALLENGE ||
            input.proof !== JOURNEY_FIXTURE_PROOF
          )
            throw new Error('security.ceremony.mismatch')
          verified = true
          revision++
          result = {
            progress: progress('complete_profile'),
            jitProfile: {
              expectedProvisionalIdentityRevision: '19',
              primaryEmailChallengeId: JOURNEY_FIXTURE_CHALLENGE,
            },
          }
          break
        }
        case 'identity.jit.profile_complete': {
          if (
            !verified ||
            input.primaryEmailChallengeId !== JOURNEY_FIXTURE_CHALLENGE ||
            input.expectedProvisionalIdentityRevision !== '19'
          )
            throw new Error('security.ceremony.mismatch')
          completed = true
          revision++
          result = { progress: progress('accept_invitation'), jitProfile: null }
          break
        }
        default:
          throw new Error('Unsupported development journey operation')
      }
      receipts.set(key, { body: request.body, result: structuredClone(result) })
    }
    if (
      options.loseEmailResponse &&
      request.operation === 'identity.jit.primary_email.start' &&
      !lost
    ) {
      lost = true
      throw new TypeError('Simulated response loss')
    }
    if (
      options.loseProfileResponse &&
      request.operation === 'identity.jit.profile_complete' &&
      !lostProfile
    ) {
      lostProfile = true
      throw new TypeError('Simulated profile response loss')
    }
    return {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(result),
      headers: {},
    }
  }
  return {
    client: transportedFederationClient(transport),
    resolution,
    initial,
    controlledFactor: async (
      _progress: IdentityCeremonyProgressV1,
      signal: AbortSignal,
    ): Promise<IdentityFederationProgressV1> => {
      signal.throwIfAborted()
      revision++
      return { progress: progress('verify_email'), jitProfile: null }
    },
    inspect: () => ({ email, verified, completed, commands: receipts.size }),
  }
}
