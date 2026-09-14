import type { IdentityCeremonyProgressV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityCeremonyProgressV1'
import type { IdentityCeremonyRefV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityCeremonyRefV1'
import type { IdentityFactorRecoveryStatusV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityFactorRecoveryStatusV1'
import type { IdentityPasskeyAssertResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityPasskeyAssertResultV1'
import type { IdentityPasskeyRegisterResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityPasskeyRegisterResultV1'
import type { IdentityRecoveryCodeRedeemRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityRecoveryCodeRedeemRequestV1'
import type { IdentityStepUpStartRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityStepUpStartRequestV1'
import type { IdentityStepUpStartResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityStepUpStartResultV1'
import type { IdentityTotpEnrollResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityTotpEnrollResultV1'
import type { IdentityTotpVerifyRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityTotpVerifyRequestV1'
import type { WebAuthnAssertionV1 } from '../contracts/generated/enterprise-security-v1/types/WebAuthnAssertionV1'
import type { WebAuthnRegistrationResponseV1 } from '../contracts/generated/enterprise-security-v1/types/WebAuthnRegistrationResponseV1'

export const ceremonyIdentityScreens = [
  'SCR-IDN-002', 'SCR-IDN-003', 'SCR-IDN-004', 'SCR-IDN-005', 'SCR-IDN-010',
] as const
export type CeremonyIdentityScreen = (typeof ceremonyIdentityScreens)[number]

export type CeremonyPayload =
  | { kind: 'empty' }
  | { kind: 'passkey'; assertion: Extract<IdentityPasskeyAssertResultV1, { kind: 'challenge' }>; registration: Extract<IdentityPasskeyRegisterResultV1, { kind: 'challenge' }> }
  | { kind: 'totp'; enrollment: IdentityTotpEnrollResultV1; ceremony: IdentityCeremonyRefV1 }
  | { kind: 'recovery-code'; progress: IdentityCeremonyProgressV1; ceremony: IdentityCeremonyRefV1 }
  | { kind: 'step-up'; request: IdentityStepUpStartRequestV1; start: IdentityStepUpStartResultV1; enrollment: IdentityCeremonyProgressV1 }
  | { kind: 'factor-recovery'; status: IdentityFactorRecoveryStatusV1 }

export interface IdentityCeremonyClient {
  load(screenId: CeremonyIdentityScreen, signal: AbortSignal): Promise<CeremonyPayload>
  firstDisplayTotp(ceremony: IdentityCeremonyRefV1, signal: AbortSignal): Promise<IdentityTotpEnrollResultV1>
  verifyTotp(request: IdentityTotpVerifyRequestV1, signal: AbortSignal): Promise<IdentityCeremonyProgressV1>
  redeemRecoveryCode(request: IdentityRecoveryCodeRedeemRequestV1, signal: AbortSignal): Promise<IdentityCeremonyProgressV1>
}

export interface PasskeyBrowserAdapter {
  assert(challenge: Extract<IdentityPasskeyAssertResultV1, { kind: 'challenge' }>, signal: AbortSignal): Promise<WebAuthnAssertionV1>
  register(challenge: Extract<IdentityPasskeyRegisterResultV1, { kind: 'challenge' }>, signal: AbortSignal): Promise<WebAuthnRegistrationResponseV1>
}

const unavailable = () => Promise.reject(new Error('Identity ceremony is not wired'))
export const liveIdentityCeremonyClient: IdentityCeremonyClient = {
  load: unavailable,
  firstDisplayTotp: unavailable,
  verifyTotp: unavailable,
  redeemRecoveryCode: unavailable,
}
