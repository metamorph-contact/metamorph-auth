import { buildSecurityErrorEnvelope } from '../../contracts/generated/enterprise-security-v1/fixtures.generated'
import type { IdentityEntryRequestV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityEntryRequestV1'
import type { IdentityMethodResolutionV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import { IdentityMethodPreviewError, type IdentityMethodClient } from '../identity-client'

export const IDENTITY_FIXTURE_MARKER = 'EA01_FIXTURE_ONLY'
export const identityPreviewScenarios = [
  { id: 'SCR-IDN-001:ready', state: 'ready' },
  { id: 'SCR-IDN-001:empty', state: 'empty' },
  { id: 'SCR-IDN-001:loading', state: 'loading' },
  { id: 'SCR-IDN-001:retryable-error', state: 'retryable-error' },
] as const
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
      if (scenario === 'SCR-IDN-001:loading') return waitUntilCancelled(signal)
      await wait(signal)
      if (scenario === 'SCR-IDN-001:retryable-error') throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(11))
      return {
        schemaVersion: 1,
        continuationId,
        methods: scenario === 'SCR-IDN-001:empty' ? [] : ['password', 'passkey', 'federation'],
        expiresAt: '2099-01-01T00:00:00Z',
      }
    },
  }
}
