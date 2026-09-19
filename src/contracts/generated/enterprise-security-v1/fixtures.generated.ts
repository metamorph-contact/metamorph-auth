// Generated from metamorph-saas/crates/enterprise-security-contract::error::SecurityErrorV1, events, and profile.emails.list. Do not edit.
import type { SecurityApiErrorV1 } from './types/SecurityApiErrorV1';
import type { CustomerSecurityAuditEventV1 } from './types/CustomerSecurityAuditEventV1';
import type { SecurityIntegrationEventV1 } from './types/SecurityIntegrationEventV1';
import type { SelfPageRequestV1 } from './types/SelfPageRequestV1';
import type { ProfileEmailsPageV1 } from './types/ProfileEmailsPageV1';
const errorEnvelopes: SecurityApiErrorV1[] = [
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.assurance.required"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.assurance.phishing_resistance_required"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.assurance.recent_authentication_required"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.ceremony.expired"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.ceremony.mismatch"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.method.disabled"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.provider.unavailable"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.provider.not_ready"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.policy.changed"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.route.retry",
      "detail": {
        "catalogVersion": "development-1",
        "ownerRegionId": "fixture-region",
        "realmId": "fixture-realm",
        "routeEpoch": "1"
      }
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.recovery.limited"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.owner.unavailable",
      "detail": {
        "retryAfterSeconds": 1
      }
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.operation.partial_result",
      "detail": {
        "failedCount": 1,
        "operation": {
          "acceptedAt": "2026-01-01T00:00:00Z",
          "nextPollAfterSeconds": null,
          "operationId": "018f0000-0000-7000-8000-000000000001",
          "revision": "1",
          "state": "queued"
        }
      }
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.operation.conflict",
      "detail": {
        "currentRevision": "1"
      }
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.emergency.not_ready"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.request.invalid"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.request.unauthorized"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.request.forbidden"
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.request.rate_limited",
      "detail": {
        "retryAfterSeconds": 1
      }
    },
    "schemaVersion": 1
  },
  {
    "correlationId": "018f0000-0000-7000-8000-000000000001",
    "error": {
      "code": "security.dependency.unavailable",
      "detail": {
        "retryAfterSeconds": 1
      }
    },
    "schemaVersion": 1
  }
];
const auditEvent: CustomerSecurityAuditEventV1 = {
  "action": "execute",
  "actionAssuranceClass": null,
  "actor": {
    "identity": {
      "serviceId": "fixture-service"
    },
    "kind": "system"
  },
  "authenticationEvidenceRevision": null,
  "authorizationCatalogVersion": "development-7",
  "awareAt": null,
  "causationEventId": null,
  "clientId": null,
  "correlationId": "018f0000-0000-7000-8000-000000000001",
  "delegationId": null,
  "details": {
    "kind": "security_decision",
    "value": {
      "reason": "policy"
    }
  },
  "detectedAt": null,
  "eventCatalogVersion": "development-1",
  "eventCategory": "authentication",
  "eventId": "018f0000-0000-7000-8000-000000000001",
  "eventType": "authentication.security.denied",
  "initiator": null,
  "mutationId": "018f0000-0000-7000-8000-000000000001",
  "normalizedFilterDigest": null,
  "occurredAt": "2026-01-01T00:00:00Z",
  "operationKey": "admin.members.force_reset",
  "policyRevision": null,
  "productId": null,
  "providerRevision": null,
  "realmId": "fixture-realm",
  "reason": "policy",
  "regionId": "fixture-region",
  "requestId": null,
  "result": "denied",
  "schemaVersion": 2,
  "scopeKind": "user",
  "securityCatalogVersion": "development-1",
  "sourceIp": null,
  "sourceIpProvenance": null,
  "sourceKind": "internal_command",
  "sourceServiceId": "fixture-service",
  "subjectUserId": "018f0000-0000-7000-8000-000000000001",
  "surfaceId": null,
  "target": {
    "id": "018f0000-0000-7000-8000-000000000001",
    "kind": "user"
  },
  "targetParent": null,
  "tenantId": "018f0000-0000-7000-8000-000000000001"
};
const integrationEvent: SecurityIntegrationEventV1 = {
  "causationEventId": null,
  "eventId": "018f0000-0000-7000-8000-000000000001",
  "mutationId": "018f0000-0000-7000-8000-000000000001",
  "occurredAt": "2026-01-01T00:00:00Z",
  "operationKey": "runtime.session.revoke",
  "payload": {
    "data": {
      "alertId": "018f0000-0000-7000-8000-000000000001",
      "incidentId": null,
      "severity": "high"
    },
    "kind": "security_alert"
  },
  "realmId": "fixture-realm",
  "regionId": "fixture-region",
  "schemaVersion": 1,
  "sourceRevision": "1",
  "sourceServiceId": "fixture-service",
  "tenantId": "018f0000-0000-7000-8000-000000000001"
};
const operationRequest: SelfPageRequestV1 = {
  "page": {
    "cursor": null,
    "limit": 25
  },
  "schemaVersion": 1
};
const operationResponse: ProfileEmailsPageV1 = {
  "accountRevision": "1",
  "page": {
    "items": [],
    "nextCursor": null,
    "partialFailures": []
  },
  "schemaVersion": 1
};
export const securityEventWireLimits = { customerAudit: 16384, integration: 32768 } as const;
export function buildSecurityErrorEnvelope(index: number): SecurityApiErrorV1 {
  const value = errorEnvelopes[index];
  if (value === undefined) throw new RangeError('unknown security error fixture');
  return structuredClone(value);
}
export function buildCustomerAuditEvent(): CustomerSecurityAuditEventV1 { return structuredClone(auditEvent); }
export function buildSecurityIntegrationEvent(): SecurityIntegrationEventV1 { return structuredClone(integrationEvent); }
export function buildProfileEmailsListRequest(): SelfPageRequestV1 { return structuredClone(operationRequest); }
export function buildProfileEmailsListResponse(): ProfileEmailsPageV1 { return structuredClone(operationResponse); }
export const securityErrorFixtureCount = errorEnvelopes.length;
