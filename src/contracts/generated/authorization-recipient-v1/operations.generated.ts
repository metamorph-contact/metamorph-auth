// Generated from metamorph-saas/crates/authorization-recipient-contract and the authorization HTTP contract. Do not edit.
export const recipientOperations = {
  "accept": {
    "method": "POST",
    "path": "/api/authorization/v1/me/invitations/{invitationId}/accept",
    "requestType": "RecipientInvitationDecisionRequestV1",
    "responseType": "RecipientInvitationOperationV1"
  },
  "bootstrap": {
    "method": "POST",
    "path": "/api/auth/v1/recipient-inbox/bootstrap",
    "requestType": "RecipientInboxBootstrapRequestV1",
    "responseType": "RecipientInboxBootstrapResultV1"
  },
  "detail": {
    "method": "GET",
    "path": "/api/authorization/v1/me/invitations/{invitationId}",
    "requestType": "RecipientInvitationDetailRequestV1",
    "responseType": "RecipientInvitationDetailResultV1"
  },
  "list": {
    "method": "GET",
    "path": "/api/authorization/v1/me/invitations",
    "requestType": "RecipientInvitationListRequestV1",
    "responseType": "RecipientInvitationListResultV1"
  },
  "reject": {
    "method": "POST",
    "path": "/api/authorization/v1/me/invitations/{invitationId}/reject",
    "requestType": "RecipientInvitationDecisionRequestV1",
    "responseType": "RecipientInvitationOperationV1"
  },
  "status": {
    "method": "GET",
    "path": "/api/authorization/v1/me/invitation-operations/{operationId}",
    "requestType": "RecipientInvitationOperationRequestV1",
    "responseType": "RecipientInvitationOperationV1"
  }
} as const;
