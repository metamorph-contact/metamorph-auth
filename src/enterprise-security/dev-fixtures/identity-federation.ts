import { buildSecurityErrorEnvelope } from '../../contracts/generated/enterprise-security-v1/fixtures.generated'
import type { ExternalIdentityStartRequestV1 } from '../../contracts/generated/enterprise-security-v1/types/ExternalIdentityStartRequestV1'
import type { ExternalIdentityStartV1 } from '../../contracts/generated/enterprise-security-v1/types/ExternalIdentityStartV1'
import type { IdentityAcceptedV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityAcceptedV1'
import type { IdentityCeremonyProgressV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityCeremonyProgressV1'
import type { IdentityIdpSamlHandoffRedeemResultV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityIdpSamlHandoffRedeemResultV1'
import type { IdentityMethodResolutionV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import { IdentityMethodPreviewError } from '../identity-client'
import { federationIdentityScreens, type FederationIdentityScreen, type IdentityFederationClient } from '../identity-federation-client'
import { identityPreviewStates, type IdentityPreviewState } from './identity-states'

export const identityFederationScenarios = federationIdentityScreens.flatMap((screenId) =>
  identityPreviewStates.map((state) => ({ screenId, state, id: `${screenId}:${state}` as const })))

const expiresAt = '2099-01-01T00:00:00Z'
const accepted: IdentityAcceptedV1 = {
  schemaVersion: 1, accepted: true, continuationId: 'fixture-continuation', expiresAt,
}
const progress = (nextStep: IdentityCeremonyProgressV1['nextStep']): IdentityCeremonyProgressV1 => ({
  schemaVersion: 1, continuationId: 'fixture-continuation', ceremonyRevision: '1',
  nextStep, subjectReproof: null, expiresAt,
})
const methods: IdentityMethodResolutionV1 = {
  schemaVersion: 1, continuationId: 'fixture-continuation', methods: ['federation'], expiresAt,
}
const handoff: IdentityIdpSamlHandoffRedeemResultV1 = {
  schemaVersion: 1, targetTenantId: 'fixture-tenant', providerId: 'fixture-provider',
  tenantDisplayName: 'Example Studio', providerDisplayName: 'Example IdP',
  continuation: progress('verify_factor'),
}

function wait(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return }
    const timer = globalThis.setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, 60)
    const abort = () => { globalThis.clearTimeout(timer); reject(signal.reason) }
    signal.addEventListener('abort', abort, { once: true })
  })
}

function waitUntilCancelled(signal: AbortSignal): Promise<never> {
  return new Promise((_resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return }
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

export function identityFederationFixture(state: IdentityPreviewState, protocol: 'saml' | 'oidc'): IdentityFederationClient {
  return {
    async load(screenId: FederationIdentityScreen, signal: AbortSignal) {
      if (!federationIdentityScreens.includes(screenId) || !identityPreviewStates.includes(state)) throw new Error('Unknown federation fixture')
      if (state === 'loading') return waitUntilCancelled(signal)
      await wait(signal)
      if (state === 'empty') return { kind: 'empty' }
      const errors: Partial<Record<IdentityPreviewState, number>> = {
        'retryable-error': 11, 'terminal-error': 15, 'stale-revision': 8,
        'read-only': 17, 'assurance-challenge': 0, 'regional-correction': 9, 'provider-outage': 6,
      }
      const index = errors[state]
      if (index !== undefined) throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(index))
      switch (screenId) {
        case 'SCR-IDN-006': {
          const request: ExternalIdentityStartRequestV1 = {
            schemaVersion: 1, flowId: 'fixture-flow', targetTenantId: 'fixture-tenant',
            providerId: 'fixture-provider', protocol, clientRegistrationId: 'octamorph-browser',
          }
          const start: ExternalIdentityStartV1 = {
            schemaVersion: 1, attemptId: 'fixture-attempt', providerId: request.providerId,
            redirectRegistrationId: 'fixture-redirect',
            navigationUri: 'https://idp.example.invalid/fixture-only', expiresAt,
          }
          return {
            kind: 'federation', request, start,
            handoff: protocol === 'saml' ? handoff : null,
            callback: progress(state === 'partial' ? 'verify_factor' : 'ready'),
          }
        }
        case 'SCR-IDN-007': return { kind: 'emergency', methods, entry: accepted }
        case 'SCR-IDN-008': return {
          kind: 'jit-profile', emailStart: accepted,
          verification: progress('verify_email'),
          completion: progress(state === 'partial' ? 'complete_profile' : 'ready'),
        }
        case 'SCR-IDN-018': return {
          kind: 'scim-activation', emailStart: accepted,
          verification: progress('verify_email'),
          activation: progress(state === 'partial' || state === 'async-progress' ? 'verify_email' : 'ready'),
        }
      }
    },
  }
}
