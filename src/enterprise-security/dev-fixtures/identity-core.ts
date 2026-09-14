import { buildSecurityErrorEnvelope } from '../../contracts/generated/enterprise-security-v1/fixtures.generated'
import type { DisplayAccountsResult } from '../../protocol/client'
import type { AuthorizationFinalizationResultV1 } from '../../contracts/generated/csi08/AuthorizationFinalizationResultV1'
import type { EmailLinkPreviewResultV1 } from '../../contracts/generated/csi11/EmailLinkPreviewResultV1'
import type { PasswordRecoveryAcceptedV1 } from '../../contracts/generated/csi11/PasswordRecoveryAcceptedV1'
import type { SignupProgressV1 } from '../../contracts/generated/csi11/SignupProgressV1'
import type { RuntimeTargetAdmitResultV1 } from '../../contracts/generated/enterprise-security-v1/types/RuntimeTargetAdmitResultV1'
import { IdentityMethodPreviewError } from '../identity-client'
import { coreIdentityScreens, type CoreIdentityClient, type CoreIdentityPayload, type CoreIdentityScreen } from '../identity-core-client'
import { identityPreviewStates, type IdentityPreviewState } from './identity-states'
import { identityMethodFixture } from './identity-methods'

export const identityCoreScenarios = coreIdentityScreens.flatMap((screenId) =>
  identityPreviewStates.map((state) => ({ screenId, state, id: `${screenId}:${state}` as const })))

const previewRequest = {
  schemaVersion: 1,
  flowId: '018f0000-0000-7000-8000-000000000002',
  realmId: 'fixture-realm',
  clientRegistrationId: 'octamorph-browser',
  routeHint: null,
} as const
const expiresAt = '2099-01-01T00:00:00Z'

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

const accounts: DisplayAccountsResult = {
  accounts: [
    {
      reference: { browserAccountId: 'fixture-account-a', capsuleGeneration: '1', homeRegionId: 'fixture-region', identityApiOrigin: 'https://identity.example.invalid', metadataCapability: 'fixture-only', expiresAt },
      summary: { browserAccountId: 'fixture-account-a', displayName: 'Alex Example', primaryEmail: 'alex@example.invalid', avatar: { kind: 'color', value: '#7c3aed' }, homeTenantLabel: 'Example Studio', homeTenantType: 'organization', homeRegionId: 'fixture-region', sessionExpiresAt: expiresAt, validationReceipt: 'fixture-only' },
    },
    {
      reference: { browserAccountId: 'fixture-account-b', capsuleGeneration: '1', homeRegionId: 'fixture-region', identityApiOrigin: 'https://identity.example.invalid', metadataCapability: 'fixture-only', expiresAt },
      summary: { browserAccountId: 'fixture-account-b', displayName: 'Morgan Example', primaryEmail: 'morgan@example.invalid', avatar: { kind: 'color', value: '#0369a1' }, homeTenantLabel: 'Personal', homeTenantType: 'individual', homeRegionId: 'fixture-region', sessionExpiresAt: expiresAt, validationReceipt: 'fixture-only' },
    },
  ],
  unavailableCount: 0,
}
const admission: RuntimeTargetAdmitResultV1 = {
  schemaVersion: 1,
  outcome: { disposition: 'active', leaseId: 'fixture-lease', leaseRevision: '1', expiresAt },
  decisionId: 'fixture-decision',
}
const signupPending: SignupProgressV1 = {
  kind: 'verificationPending', schemaVersion: 1, signupId: 'fixture-signup',
  nextStep: 'checkEmail', csrfToken: 'fixture-only', resendAvailableAt: '2026-01-01T00:00:00Z', expiresAt,
}
const organization: SignupProgressV1 = {
  kind: 'continue', schemaVersion: 1, signupId: 'fixture-signup',
  tenantResolution: 'organizationNew', nextStep: 'organizationDetails', csrfToken: 'fixture-only', expiresAt,
}
const verification: EmailLinkPreviewResultV1 = {
  kind: 'ready', schemaVersion: 1, challengeKind: 'signupVerification',
  email: 'alex@example.invalid', productNameMessageKey: 'product.octamorph', preview: 'fixture-only', expiresAt,
}
const recovery: PasswordRecoveryAcceptedV1 = { schemaVersion: 1, accepted: true }
const finalization: AuthorizationFinalizationResultV1 = {
  schemaVersion: 1, navigationUri: 'https://product.example.invalid/fixture-return', expiresAt,
}

export function identityCoreFixture(state: IdentityPreviewState): CoreIdentityClient {
  return {
    async load(screenId: CoreIdentityScreen, signal: AbortSignal): Promise<CoreIdentityPayload> {
      if (!coreIdentityScreens.includes(screenId) || !identityPreviewStates.includes(state)) throw new Error('Unknown identity fixture')
      if (state === 'loading') return waitUntilCancelled(signal)
      if (screenId === 'SCR-IDN-001') {
        const resolution = await identityMethodFixture(`${screenId}:${state}`).resolveMethods(previewRequest, signal)
        return { kind: 'entry', resolution }
      }
      await wait(signal)
      const errorIndex: Partial<Record<IdentityPreviewState, number>> = {
        'retryable-error': 11, 'terminal-error': 15, 'stale-revision': 8,
        'assurance-challenge': 0, 'regional-correction': 9, 'provider-outage': 6,
      }
      const index = errorIndex[state]
      if (index !== undefined) throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(index))
      if (state === 'empty' && screenId !== 'SCR-IDN-011') return { kind: 'empty' }
      switch (screenId) {
        case 'SCR-IDN-011': return {
          kind: 'accounts',
          accounts: state === 'empty' ? { accounts: [], unavailableCount: 0 }
            : state === 'partial' ? { accounts: accounts.accounts.slice(0, 1), unavailableCount: 1 } : accounts,
          admission,
        }
        case 'SCR-IDN-012': return { kind: 'signup', progress: signupPending }
        case 'SCR-IDN-013': return { kind: 'verification', preview: verification }
        case 'SCR-IDN-014': return { kind: 'organization', progress: organization }
        case 'SCR-IDN-015': return { kind: 'recovery', accepted: recovery }
        case 'SCR-IDN-016': return { kind: 'finalization', result: finalization }
        case 'SCR-IDN-017': return { kind: 'safe-error', code: state === 'empty' ? 'auth.flow.expired' : 'security.request.invalid' }
      }
    },
  }
}
