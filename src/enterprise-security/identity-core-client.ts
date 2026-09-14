import type { DisplayAccountsResult } from '../protocol/client'
import type { AuthorizationFinalizationResultV1 } from '../contracts/generated/csi08/AuthorizationFinalizationResultV1'
import type { EmailLinkPreviewResultV1 } from '../contracts/generated/csi11/EmailLinkPreviewResultV1'
import type { PasswordRecoveryAcceptedV1 } from '../contracts/generated/csi11/PasswordRecoveryAcceptedV1'
import type { SignupProgressV1 } from '../contracts/generated/csi11/SignupProgressV1'
import type { IdentityMethodResolutionV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import type { RuntimeTargetAdmitResultV1 } from '../contracts/generated/enterprise-security-v1/types/RuntimeTargetAdmitResultV1'

export const coreIdentityScreens = [
  'SCR-IDN-001', 'SCR-IDN-011', 'SCR-IDN-012', 'SCR-IDN-013',
  'SCR-IDN-014', 'SCR-IDN-015', 'SCR-IDN-016', 'SCR-IDN-017',
] as const
export type CoreIdentityScreen = (typeof coreIdentityScreens)[number]

export const coreIdentityStates = [
  'ready', 'empty', 'loading', 'retryable-error', 'terminal-error',
  'partial', 'stale-revision', 'read-only', 'assurance-challenge',
  'regional-correction', 'provider-outage', 'async-progress',
] as const
export type CoreIdentityState = (typeof coreIdentityStates)[number]

export type CoreIdentityPayload =
  | { kind: 'empty' }
  | { kind: 'entry'; resolution: IdentityMethodResolutionV1 }
  | { kind: 'accounts'; accounts: DisplayAccountsResult; admission: RuntimeTargetAdmitResultV1 }
  | { kind: 'signup' | 'organization'; progress: SignupProgressV1 }
  | { kind: 'verification'; preview: EmailLinkPreviewResultV1 }
  | { kind: 'recovery'; accepted: PasswordRecoveryAcceptedV1 }
  | { kind: 'finalization'; result: AuthorizationFinalizationResultV1 }
  | { kind: 'safe-error'; code: string }

export interface CoreIdentityClient {
  load(screenId: CoreIdentityScreen, signal: AbortSignal): Promise<CoreIdentityPayload>
}

// Plans 06/07 wire the guarded enterprise operations. Existing CSI routes
// retain their own live client; the preview never substitutes for it.
export const liveCoreIdentityClient: CoreIdentityClient = {
  load: () => Promise.reject(new Error('Enterprise identity preview is not a live identity client')),
}
