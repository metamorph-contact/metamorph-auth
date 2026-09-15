import { fixtureFederationProviders } from './federation-providers'
import { buildSecurityErrorEnvelope } from '../../contracts/generated/enterprise-security-v1/fixtures.generated'
import type { IdentityEntryRequestV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityEntryRequestV1'
import type { IdentityMethodResolutionV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import { IdentityMethodPreviewError, type IdentityMethodClient } from '../identity-client'
import { identityPreviewStates, type IdentityPreviewState } from './identity-states'

export const IDENTITY_FIXTURE_MARKER = 'EA01_FIXTURE_ONLY'
export const identityPreviewScenarios = identityPreviewStates.map((state) => ({
  id: `SCR-IDN-001:${state}` as const,
  state,
}))
export type IdentityPreviewScenario = (typeof identityPreviewScenarios)[number]['id']

const continuationId = '018f0000-0000-7000-8000-000000000001'

function wait(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return }
    const timer = globalThis.setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, 80)
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

export function identityMethodFixture(scenario: IdentityPreviewScenario): IdentityMethodClient {
  return {
    async resolveMethods(request: IdentityEntryRequestV1, signal: AbortSignal): Promise<IdentityMethodResolutionV1> {
      if (request.schemaVersion !== 1 || request.flowId.length === 0 || request.realmId.length === 0) {
        throw new Error('Invalid method-resolution fixture request')
      }
      const state: IdentityPreviewState = scenario.slice('SCR-IDN-001:'.length) as IdentityPreviewState
      if (!identityPreviewStates.includes(state)) throw new Error('Unknown method fixture scenario')
      if (state === 'loading') return waitUntilCancelled(signal)
      await wait(signal)
      const errors: Partial<Record<IdentityPreviewState, number>> = {
        'retryable-error': 11, 'terminal-error': 15, 'stale-revision': 8,
        'assurance-challenge': 0, 'regional-correction': 9, 'provider-outage': 6,
      }
      const index = errors[state]
      if (index !== undefined) throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(index))
      return {
        schemaVersion: 1,
        continuationId,
        federationProviders: state === 'empty' ? [] : fixtureFederationProviders,
        methods: state === 'empty' ? [] : state === 'partial' ? ['password', 'federation'] : ['password', 'passkey', 'federation', 'social'],
        expiresAt: '2099-01-01T00:00:00Z',
      }
    },
  }
}
