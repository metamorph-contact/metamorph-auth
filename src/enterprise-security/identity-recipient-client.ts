import type { RecipientInboxBootstrapResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInboxBootstrapResultV1'
import type { RecipientInvitationDecisionRequestV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationDecisionRequestV1'
import type { RecipientInvitationDetailResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationDetailResultV1'
import type { RecipientInvitationFilterV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationFilterV1'
import type { RecipientInvitationListResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationListResultV1'
import type { RecipientInvitationOperationV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationOperationV1'

export const recipientIdentityScreens = ['SCR-IDN-009'] as const
export type RecipientIdentityScreen = (typeof recipientIdentityScreens)[number]

export interface IdentityRecipientClient {
  bootstrap(signal: AbortSignal): Promise<RecipientInboxBootstrapResultV1>
  list(filter: RecipientInvitationFilterV1, signal: AbortSignal): Promise<RecipientInvitationListResultV1>
  detail(invitationId: string, signal: AbortSignal): Promise<RecipientInvitationDetailResultV1>
  accept(invitationId: string, request: RecipientInvitationDecisionRequestV1, signal: AbortSignal): Promise<RecipientInvitationOperationV1>
  reject(invitationId: string, request: RecipientInvitationDecisionRequestV1, signal: AbortSignal): Promise<RecipientInvitationOperationV1>
  status(operationId: string, signal: AbortSignal): Promise<RecipientInvitationOperationV1>
}

export class RecipientPreviewError extends Error {
  constructor(readonly code: string) { super(code); this.name = 'RecipientPreviewError' }
}

// The authorization owner will replace this boundary after VER-OWN-001.
// No production route invokes it while the guarded handlers remain absent.
export const liveIdentityRecipientClient: IdentityRecipientClient = {
  bootstrap: () => Promise.reject(new Error('Recipient inbox bootstrap is not wired')),
  list: () => Promise.reject(new Error('Recipient inbox list is not wired')),
  detail: () => Promise.reject(new Error('Recipient inbox detail is not wired')),
  accept: () => Promise.reject(new Error('Recipient inbox accept is not wired')),
  reject: () => Promise.reject(new Error('Recipient inbox reject is not wired')),
  status: () => Promise.reject(new Error('Recipient inbox status is not wired')),
}
