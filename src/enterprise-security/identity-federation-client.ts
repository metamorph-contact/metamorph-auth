import type { ExternalIdentityStartRequestV1 } from '../contracts/generated/enterprise-security-v1/types/ExternalIdentityStartRequestV1'
import type { ExternalIdentityStartV1 } from '../contracts/generated/enterprise-security-v1/types/ExternalIdentityStartV1'
import type { IdentityAcceptedV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityAcceptedV1'
import type { IdentityCeremonyProgressV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityCeremonyProgressV1'
import type { IdentityIdpSamlHandoffRedeemResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityIdpSamlHandoffRedeemResultV1'
import type { IdentityMethodResolutionV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import type { IdentityProfileCompleteRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityProfileCompleteRequestV1'

export const federationIdentityScreens = [
  'SCR-IDN-006', 'SCR-IDN-007', 'SCR-IDN-008', 'SCR-IDN-018',
] as const
export type FederationIdentityScreen = (typeof federationIdentityScreens)[number]

export type FederationPayload =
  | { kind: 'empty' }
  | { kind: 'federation'; request: ExternalIdentityStartRequestV1; start: ExternalIdentityStartV1; handoff: IdentityIdpSamlHandoffRedeemResultV1 | null; callback: IdentityCeremonyProgressV1 }
  | { kind: 'emergency'; methods: IdentityMethodResolutionV1; entry: IdentityAcceptedV1 }
  | { kind: 'jit-profile'; emailStart: IdentityAcceptedV1; verification: IdentityCeremonyProgressV1; profileRequest: IdentityProfileCompleteRequestV1; completion: IdentityCeremonyProgressV1 }
  | { kind: 'scim-activation'; emailStart: IdentityAcceptedV1; verification: IdentityCeremonyProgressV1; activation: IdentityCeremonyProgressV1 }

export interface IdentityFederationClient {
  load(screenId: FederationIdentityScreen, signal: AbortSignal): Promise<FederationPayload>
}

// The future guarded enterprise client replaces this fail-closed seam.
export const liveIdentityFederationClient: IdentityFederationClient = {
  load: () => Promise.reject(new Error('Enterprise federation is not wired')),
}
