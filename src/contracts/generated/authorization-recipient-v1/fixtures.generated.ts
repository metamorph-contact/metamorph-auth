// Generated from metamorph-saas/crates/authorization-recipient-contract typed synthetic fixtures. Do not edit.
import type { RecipientInboxBootstrapResultV1 } from './types/RecipientInboxBootstrapResultV1';
import type { RecipientInvitationListResultV1 } from './types/RecipientInvitationListResultV1';
import type { RecipientInvitationOperationV1 } from './types/RecipientInvitationOperationV1';
export const recipientFixtures: { bootstrap: RecipientInboxBootstrapResultV1; pinned: RecipientInvitationListResultV1; claimRequired: RecipientInvitationListResultV1; emailedLink: { invitationId: string; invitationVersion: string; emailedToken: string }; history: RecipientInvitationListResultV1; rejectedHistory: RecipientInvitationListResultV1; pending: RecipientInvitationOperationV1; completed: RecipientInvitationOperationV1; rejected: RecipientInvitationOperationV1 } = {
  "bootstrap": {
    "csrfToken": "fixtureonlycsrftoken000000000000000000000000000000",
    "expiresAt": "2099-01-01T00:01:00Z",
    "recipientCapability": "fixtureonlyrecipientcapability00000000000000000000",
    "route": {
      "homeRegionId": "example-region",
      "identityApiOrigin": "https://identity-home.example.test",
      "routeEpoch": "1",
      "signedRoute": "fixtureonlysignedroute000000000000000000000000000000"
    },
    "schemaVersion": 1
  },
  "claimRequired": {
    "backfillPending": false,
    "items": [
      {
        "kind": "claim_required",
        "teaser": {
          "claimHandle": "fixtureonlyclaimhandle0000000000000000000000000",
          "expiresAt": "2099-02-01T00:00:00Z"
        }
      }
    ],
    "nextCursor": null,
    "schemaVersion": 1,
    "snapshotVersion": "5"
  },
  "completed": {
    "invitationId": "0198f1cb-5661-7c52-90b7-2c0000000001",
    "operationId": "0198f1cb-5661-7c52-90b7-2c0000000004",
    "schemaVersion": 1,
    "state": "completed"
  },
  "emailedLink": {
    "emailedToken": "fixtureonlycompleteemailedtoken00000000000000000000",
    "invitationId": "0198f1cb-5661-7c52-90b7-2c0000000007",
    "invitationVersion": "3"
  },
  "history": {
    "backfillPending": false,
    "items": [
      {
        "invitation": {
          "claimRequired": false,
          "createdAt": "2099-01-01T00:00:00Z",
          "expiresAt": "2099-02-01T00:00:00Z",
          "invitationId": "0198f1cb-5661-7c52-90b7-2c0000000001",
          "invitationKind": "home_role",
          "invitationVersion": "3",
          "inviterDisplay": "Example inviter",
          "operationId": "0198f1cb-5661-7c52-90b7-2c0000000004",
          "state": "completed",
          "statusUncertain": false,
          "target": {
            "kind": "spaceRole",
            "resourceDisplay": "Example workspace",
            "roleDisplay": "Viewer"
          },
          "tenantDisplay": "Example Studio",
          "tenantId": "0198f1cb-5661-7c52-90b7-2c0000000002"
        },
        "kind": "full"
      }
    ],
    "nextCursor": null,
    "schemaVersion": 1,
    "snapshotVersion": "6"
  },
  "pending": {
    "invitationId": "0198f1cb-5661-7c52-90b7-2c0000000001",
    "operationId": "0198f1cb-5661-7c52-90b7-2c0000000004",
    "schemaVersion": 1,
    "state": "pending"
  },
  "pinned": {
    "backfillPending": false,
    "items": [
      {
        "invitation": {
          "claimRequired": false,
          "createdAt": "2099-01-01T00:00:00Z",
          "expiresAt": "2099-02-01T00:00:00Z",
          "invitationId": "0198f1cb-5661-7c52-90b7-2c0000000001",
          "invitationKind": "home_role",
          "invitationVersion": "3",
          "inviterDisplay": "Example inviter",
          "state": "pending",
          "statusUncertain": false,
          "target": {
            "kind": "spaceRole",
            "resourceDisplay": "Example workspace",
            "roleDisplay": "Viewer"
          },
          "tenantDisplay": "Example Studio",
          "tenantId": "0198f1cb-5661-7c52-90b7-2c0000000002"
        },
        "kind": "full"
      }
    ],
    "nextCursor": null,
    "schemaVersion": 1,
    "snapshotVersion": "5"
  },
  "rejected": {
    "invitationId": "0198f1cb-5661-7c52-90b7-2c0000000001",
    "operationId": "0198f1cb-5661-7c52-90b7-2c0000000004",
    "schemaVersion": 1,
    "state": "completed"
  },
  "rejectedHistory": {
    "backfillPending": false,
    "items": [
      {
        "invitation": {
          "claimRequired": false,
          "createdAt": "2099-01-01T00:00:00Z",
          "expiresAt": "2099-02-01T00:00:00Z",
          "invitationId": "0198f1cb-5661-7c52-90b7-2c0000000001",
          "invitationKind": "home_role",
          "invitationVersion": "3",
          "inviterDisplay": "Example inviter",
          "state": "revoked",
          "statusUncertain": false,
          "target": {
            "kind": "spaceRole",
            "resourceDisplay": "Example workspace",
            "roleDisplay": "Viewer"
          },
          "tenantDisplay": "Example Studio",
          "tenantId": "0198f1cb-5661-7c52-90b7-2c0000000002",
          "terminalReason": "recipient_rejected"
        },
        "kind": "full"
      }
    ],
    "nextCursor": null,
    "schemaVersion": 1,
    "snapshotVersion": "6"
  }
}
export function buildRecipientFixtures() { return structuredClone(recipientFixtures) }
