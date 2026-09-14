import { buildSecurityErrorEnvelope } from '../../contracts/generated/enterprise-security-v1/fixtures.generated'
import type { IdentityCeremonyProgressV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityCeremonyProgressV1'
import type { IdentityCeremonyRefV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityCeremonyRefV1'
import type { IdentityFactorRecoveryStatusV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityFactorRecoveryStatusV1'
import type { IdentityPasskeyAssertResultV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityPasskeyAssertResultV1'
import type { IdentityPasskeyRegisterResultV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityPasskeyRegisterResultV1'
import type { IdentityStepUpStartRequestV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityStepUpStartRequestV1'
import type { IdentityStepUpStartResultV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityStepUpStartResultV1'
import type { IdentityTotpEnrollResultV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityTotpEnrollResultV1'
import { IdentityMethodPreviewError } from '../identity-client'
import { ceremonyIdentityScreens, type CeremonyIdentityScreen, type IdentityCeremonyClient, type PasskeyBrowserAdapter } from '../identity-ceremony-client'
import { identityPreviewStates, type IdentityPreviewState } from './identity-states'

export const identityCeremonyScenarios = ceremonyIdentityScreens.flatMap((screenId) =>
  identityPreviewStates.map((state) => ({ screenId, state, id: `${screenId}:${state}` as const })))

const expiresAt = '2099-01-01T00:00:00Z'
const ceremony: IdentityCeremonyRefV1 = {
  schemaVersion: 1, attemptId: 'fixture-attempt', continuationId: 'fixture-continuation', expectedCeremonyRevision: '1',
}
const verifyFactor: IdentityCeremonyProgressV1 = {
  schemaVersion: 1, continuationId: ceremony.continuationId, ceremonyRevision: '1',
  nextStep: 'verify_factor', subjectReproof: null, expiresAt,
}
const firstLogin: IdentityCeremonyProgressV1 = {
  ...verifyFactor, nextStep: 'first_login_enrollment',
}
const assertion: Extract<IdentityPasskeyAssertResultV1, { kind: 'challenge' }> = {
  kind: 'challenge', schemaVersion: 1, ceremonyId: 'fixture-ceremony',
  rpId: 'example.invalid', challenge: 'fixture-challenge', userVerification: 'required', expiresAt,
}
const registration: Extract<IdentityPasskeyRegisterResultV1, { kind: 'challenge' }> = {
  kind: 'challenge', schemaVersion: 1, ceremonyId: 'fixture-ceremony', expiresAt,
  options: {
    rpId: 'example.invalid', rpName: 'Fixture identity', userHandle: 'fixture-user',
    userName: 'fixture@example.invalid', userDisplayName: 'Fixture person', challenge: 'fixture-challenge',
    algorithmProfile: 'es256', timeoutMs: 60_000, residentKey: 'preferred',
    userVerification: 'required', attachment: null, attestation: 'none',
  },
}
const unavailableTotp: IdentityTotpEnrollResultV1 = {
  kind: 'material_unavailable', schemaVersion: 1, ceremonyId: 'fixture-ceremony', expiresAt,
}
const firstDisplayTotp: IdentityTotpEnrollResultV1 = {
  kind: 'first_display', schemaVersion: 1, ceremonyId: 'fixture-ceremony', expiresAt,
  options: {
    seed: 'FIXTUREONLYNOTASECRET', issuer: 'Fixture identity', accountName: 'fixture@example.invalid',
    algorithm: 'sha1', digits: 6, periodSeconds: 30,
  },
}
const stepUpRequest: IdentityStepUpStartRequestV1 = {
  schemaVersion: 1, attemptId: 'fixture-action-attempt', operationKey: 'admin.authentication.apply',
  targetDigest: 'fixture-target-digest', expectedSessionRevision: '1', requestedMethod: { kind: 'passkey' },
}
const stepUpStart: IdentityStepUpStartResultV1 = { kind: 'local', progress: verifyFactor }

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

function recoveryStatus(state: IdentityPreviewState): IdentityFactorRecoveryStatusV1 {
  return {
    schemaVersion: 1, recoveryId: 'fixture-recovery',
    state: state === 'partial' ? 'awaiting_approval' : state === 'async-progress' ? 'waiting_period'
      : state === 'read-only' ? 'repudiated' : state === 'terminal-error' ? 'expired' : 'ready',
    revision: '1', earliestCompletionAt: state === 'async-progress' ? '2099-01-01T00:00:00Z' : null, expiresAt,
  }
}

export function identityCeremonyFixture(state: IdentityPreviewState): IdentityCeremonyClient {
  let firstDisplayConsumed = false
  return {
    async load(screenId: CeremonyIdentityScreen, signal: AbortSignal) {
      if (!ceremonyIdentityScreens.includes(screenId) || !identityPreviewStates.includes(state)) throw new Error('Unknown ceremony fixture')
      if (state === 'loading') return waitUntilCancelled(signal)
      await wait(signal)
      if (state === 'empty') return { kind: 'empty' }
      if (screenId === 'SCR-IDN-010' && (state === 'terminal-error' || state === 'read-only')) {
        return { kind: 'factor-recovery', status: recoveryStatus(state) }
      }
      const errors: Partial<Record<IdentityPreviewState, number>> = {
        'retryable-error': 11, 'terminal-error': 3, 'stale-revision': 4,
        'read-only': 17, 'assurance-challenge': 0, 'regional-correction': 9, 'provider-outage': 6,
      }
      const index = errors[state]
      if (index !== undefined) throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(index))
      switch (screenId) {
        case 'SCR-IDN-002': return { kind: 'passkey', assertion, registration }
        case 'SCR-IDN-003': return { kind: 'totp', enrollment: unavailableTotp, ceremony }
        case 'SCR-IDN-004': return { kind: 'recovery-code', progress: verifyFactor, ceremony }
        case 'SCR-IDN-005': return { kind: 'step-up', request: stepUpRequest, start: stepUpStart, enrollment: firstLogin }
        case 'SCR-IDN-010': return { kind: 'factor-recovery', status: recoveryStatus(state) }
      }
    },
    async firstDisplayTotp(request: IdentityCeremonyRefV1, signal: AbortSignal) {
      if (request.continuationId !== ceremony.continuationId || request.expectedCeremonyRevision !== ceremony.expectedCeremonyRevision) {
        throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(4))
      }
      await wait(signal)
      if (firstDisplayConsumed) return unavailableTotp
      firstDisplayConsumed = true
      return firstDisplayTotp
    },
    async verifyTotp(request, signal) {
      if (request.ceremony.continuationId !== ceremony.continuationId || request.ceremony.expectedCeremonyRevision !== ceremony.expectedCeremonyRevision) {
        throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(4))
      }
      if (!/^\d{6}$/u.test(request.code)) throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(15))
      await wait(signal)
      throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(4))
    },
    async redeemRecoveryCode(request, signal) {
      if (request.ceremony.continuationId !== ceremony.continuationId || request.ceremony.expectedCeremonyRevision !== ceremony.expectedCeremonyRevision) {
        throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(4))
      }
      if (!/^[A-Za-z0-9-]{8,64}$/u.test(request.code)) throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(15))
      await wait(signal)
      throw new IdentityMethodPreviewError(buildSecurityErrorEnvelope(4))
    },
  }
}

// A preview never calls navigator.credentials or fabricates a WebAuthn result.
export const previewPasskeyBrowserAdapter: PasskeyBrowserAdapter = {
  assert: () => Promise.reject(new Error('Passkey browser ceremony is unavailable in preview')),
  register: () => Promise.reject(new Error('Passkey browser ceremony is unavailable in preview')),
}
