// Generated from metamorph-saas/docs/features/authentication/contracts/enterprise-security-catalog-v1.json and metamorph-saas/docs/features/authentication/contracts/enterprise-security-event-effects-v1.json. Do not edit.
export const enterpriseSecurityCatalog = {
  "catalog": {
    "actionAssuranceClasses": [
      {
        "intent": "ceremony_bound",
        "key": "public_ceremony",
        "maxAuthenticationAgeSeconds": null,
        "minimumAuthentication": "none",
        "phishingResistant": false
      },
      {
        "intent": "ceremony_bound",
        "key": "emergency_entry",
        "maxAuthenticationAgeSeconds": 300,
        "minimumAuthentication": "aal2",
        "phishingResistant": false
      },
      {
        "intent": "signed_purpose",
        "key": "machine_exact",
        "maxAuthenticationAgeSeconds": null,
        "minimumAuthentication": "none",
        "phishingResistant": false
      },
      {
        "intent": "none",
        "key": "session",
        "maxAuthenticationAgeSeconds": 43200,
        "minimumAuthentication": "aal1",
        "phishingResistant": false
      },
      {
        "intent": "action_bound",
        "key": "recent",
        "maxAuthenticationAgeSeconds": 900,
        "minimumAuthentication": "aal1",
        "phishingResistant": false
      },
      {
        "intent": "action_bound",
        "key": "strong",
        "maxAuthenticationAgeSeconds": 300,
        "minimumAuthentication": "aal2",
        "phishingResistant": false
      },
      {
        "intent": "action_bound",
        "key": "phishing_resistant",
        "maxAuthenticationAgeSeconds": 300,
        "minimumAuthentication": "aal2",
        "phishingResistant": true
      }
    ],
    "actionAssuranceRules": [
      "The class is a floor; the current realm baseline and target-tenant compiled policy may require a stronger permitted class but cannot weaken it. Recovery-limited evidence cannot satisfy recent, strong or phishing_resistant without a separate fresh qualifying authentication.",
      "The age clock uses the verified human authentication or step-up time at identity home, not session creation, refresh, projection, or remembered-device time.",
      "Action-bound challenges bind actor, target, canonical action digest, tenant, original RBAC decision context, purpose, expiry and nonce. Resume re-enters CSI identity verification, target admission, sole RBAC evaluation and the assurance gate; no old permit is reused.",
      "Public ceremonies require their own single-use purpose/origin/state/nonce proof and never inherit interactive-session authorization. Machine_exact requires exact-purpose credential validation and cannot use a broad PAT."
    ],
    "assuranceDimensions": {
      "authentication": [
        "none",
        "aal1",
        "aal2",
        "aal3"
      ],
      "federation": [
        "none",
        "fal1",
        "fal2",
        "fal3"
      ],
      "identity": [
        "unassessed",
        "ial1",
        "ial2"
      ],
      "recovery": [
        "none",
        "email_hold_limited",
        "independent_reproof"
      ],
      "rules": [
        "Levels are evidence outcomes, not product certification claims. Unknown, missing, or unmapped claims never satisfy a stronger level.",
        "Identity proofing, authenticator proof, federation proof, phishing resistance, hardware binding, user verification, and recovery result are independent fields; do not infer one from another.",
        "Federation assertions do not raise identity or authentication assurance without an explicit tested provider mapping bound to the provider revision and verified proof.",
        "Email-only recovery and administrative assistance cannot assert AAL2, phishing resistance, or the assurance of a prior session."
      ]
    },
    "authenticatorClasses": [
      {
        "factorRole": "knowledge",
        "hardwareBoundByClass": false,
        "key": "password",
        "phishingResistant": false
      },
      {
        "factorRole": "possession",
        "hardwareBoundByClass": false,
        "key": "webauthn_synced",
        "phishingResistant": true
      },
      {
        "factorRole": "possession",
        "hardwareBoundByClass": false,
        "key": "webauthn_device_bound",
        "phishingResistant": true
      },
      {
        "factorRole": "possession",
        "hardwareBoundByClass": true,
        "key": "webauthn_attested_hardware",
        "phishingResistant": true
      },
      {
        "factorRole": "possession",
        "hardwareBoundByClass": false,
        "key": "totp",
        "phishingResistant": false
      },
      {
        "factorRole": "recovery",
        "hardwareBoundByClass": false,
        "key": "recovery_code",
        "phishingResistant": false
      },
      {
        "factorRole": "mapped_external",
        "hardwareBoundByClass": false,
        "key": "enterprise_federation",
        "phishingResistant": false
      },
      {
        "factorRole": "external_login",
        "hardwareBoundByClass": false,
        "key": "social_federation",
        "phishingResistant": false
      }
    ],
    "authenticatorRules": [
      "A WebAuthn ceremony must verify the exact realm RP ID, origin, challenge, user verification requirement and credential. The device-bound class still requires per-credential evidence; a transport or label is not hardware proof.",
      "An enterprise provider may assert stronger properties only through an explicit, tested, revision-bound assurance mapping. Social login is not MFA or phishing-resistant evidence by default.",
      "A recovery code is a limited recovery proof, not a reusable second factor or a fresh intent for an unrelated action. A remembered-device grant is not an authenticator.",
      "Password alone is at most AAL1. Password plus verified TOTP may satisfy AAL2 but is not phishing resistant. Verified user-verifying WebAuthn may satisfy AAL2 and phishing resistance; an attested hardware key does not automatically assert AAL3. External provider outcomes remain capped by explicit tested mapping and initiation mode."
    ],
    "authorizationCatalog": {
      "catalogVersion": "development-7",
      "path": "config/authorization-catalog.json",
      "rule": "References below are lookups into the sole RBAC catalog, never copied scope definitions. Profile references are UI feature references only and cannot grant access."
    },
    "catalogIds": {
      "actionAssuranceClasses": "CAT-SEC-003",
      "assuranceDimensions": "CAT-SEC-001",
      "authenticatorClasses": "CAT-SEC-002",
      "authorizationReferences": "CAT-SEC-008",
      "conditionalVocabulary": "CAT-SEC-006",
      "localizationKeys": "CAT-SEC-009",
      "operationClassifications": "CAT-SEC-007",
      "policyBounds": "CAT-SEC-004",
      "providerVocabulary": "CAT-SEC-005"
    },
    "catalogVersion": "development-1",
    "conditionalActions": [
      "allow",
      "require_recent",
      "require_mfa",
      "require_sso",
      "require_phishing_resistant",
      "block"
    ],
    "conditionalInputs": [
      "tenant_membership",
      "tenant_team_membership",
      "method",
      "provider",
      "verified_domain",
      "achieved_assurance",
      "phishing_resistance",
      "authentication_age",
      "network_zone",
      "country",
      "device_posture",
      "risk_signal",
      "emergency_context",
      "action_class"
    ],
    "conditionalRules": [
      "One immutable compiled tenant-policy revision owns ordered rule evaluation. Explicit block wins. Tenant team membership is a signed bounded fact from the authorization owner; role names or role-derived grants are not conditional inputs. Unknown required posture/network/risk evidence fails closed; browser headers are not trusted producer evidence.",
      "A conditional action may strengthen the central action class, never lower it or grant RBAC permission. require_sso additionally requires a current eligible enterprise-provider derivation bound to this target tenant and its active policy; it cannot be satisfied by a generic social login or provider-discovery hint. Multiple requirements compose conjunctively, explicit block wins, and an unavailable route denies without an infinite challenge loop. Simulation is side-effect-free and cannot produce an access permit."
    ],
    "federationInitiationModes": [
      "sp_initiated",
      "idp_dashboard_saml"
    ],
    "localization": {
      "displayKeyPrefixes": {
        "actionAssuranceClasses": "authentication.security.action_assurance",
        "authenticationAssurance": "authentication.security.authentication_assurance",
        "authenticatorClasses": "authentication.security.authenticators",
        "conditionalActions": "authentication.security.actions",
        "conditionalInputs": "authentication.security.conditions",
        "federationAssurance": "authentication.security.federation_assurance",
        "federationInitiationModes": "authentication.security.federation_initiation",
        "identityAssurance": "authentication.security.identity_assurance",
        "operations": "authentication.security.operations",
        "policyBounds": "authentication.security.policy",
        "providerProtocols": "authentication.security.provider_protocols",
        "providerStates": "authentication.security.provider_states",
        "recoveryAssurance": "authentication.security.recovery_assurance",
        "socialProviders": "authentication.security.social_providers",
        "tenantMethodModes": "authentication.security.tenant_method_modes"
      },
      "errorDisplayKeys": {
        "assurance_required": "authentication.security.errors.assurance_required",
        "ceremony_expired": "authentication.security.errors.ceremony_expired",
        "ceremony_mismatch": "authentication.security.errors.ceremony_mismatch",
        "dependency_unavailable": "authentication.security.errors.dependency_unavailable",
        "emergency_not_ready": "authentication.security.errors.emergency_not_ready",
        "forbidden": "authentication.security.errors.forbidden",
        "invalid_request": "authentication.security.errors.invalid_request",
        "method_disabled": "authentication.security.errors.method_disabled",
        "operation_conflict": "authentication.security.errors.operation_conflict",
        "owner_unavailable": "authentication.security.errors.owner_unavailable",
        "partial_result": "authentication.security.errors.partial_result",
        "phishing_resistance_required": "authentication.security.errors.phishing_resistance_required",
        "policy_changed": "authentication.security.errors.policy_changed",
        "provider_not_ready": "authentication.security.errors.provider_not_ready",
        "provider_unavailable": "authentication.security.errors.provider_unavailable",
        "rate_limited": "authentication.security.errors.rate_limited",
        "recent_authentication_required": "authentication.security.errors.recent_authentication_required",
        "recovery_limited": "authentication.security.errors.recovery_limited",
        "route_retry": "authentication.security.errors.route_retry",
        "unauthorized": "authentication.security.errors.unauthorized"
      },
      "rule": "For every named term, the exact display key is its section prefix plus '.' plus its catalog key; no caller formats a human-readable label from an ID. Operation keys use the operations prefix plus '.' plus the full operation key. EA-00G binds exact safe wire-error codes to these stable display categories and defines fallback text; an unknown key uses a generic non-enumerating fallback, never raw server details."
    },
    "operationGroups": [
      {
        "access": {
          "capability": "read",
          "feature": "email_addresses",
          "kind": "self"
        },
        "assurance": "session",
        "operations": [
          "profile.emails.list"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "notification_preferences",
          "kind": "self"
        },
        "assurance": "session",
        "operations": [
          "profile.notifications.list"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "authenticators",
          "kind": "self"
        },
        "assurance": "session",
        "operations": [
          "profile.authenticators.list"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "recovery_methods",
          "kind": "self"
        },
        "assurance": "session",
        "operations": [
          "profile.recovery.readiness"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "sessions",
          "kind": "self"
        },
        "assurance": "session",
        "operations": [
          "profile.sessions.list"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "devices",
          "kind": "self"
        },
        "assurance": "session",
        "operations": [
          "profile.devices.list"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "security_activity",
          "kind": "self"
        },
        "assurance": "session",
        "operations": [
          "profile.activity.list"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "connected_identities",
          "kind": "self"
        },
        "assurance": "session",
        "operations": [
          "profile.identities.list"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "email_addresses",
          "kind": "self"
        },
        "assurance": "recent",
        "operations": [
          "profile.emails.add",
          "profile.emails.verify"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "notification_preferences",
          "kind": "self"
        },
        "assurance": "recent",
        "operations": [
          "profile.notifications.add",
          "profile.notifications.verify"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "email_addresses",
          "kind": "self"
        },
        "assurance": "strong",
        "operations": [
          "profile.emails.promote"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "email_addresses",
          "kind": "self"
        },
        "assurance": "strong",
        "operations": [
          "profile.emails.remove"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "notification_preferences",
          "kind": "self"
        },
        "assurance": "strong",
        "operations": [
          "profile.notifications.remove"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "password",
          "kind": "self"
        },
        "assurance": "recent",
        "operations": [
          "profile.password.change"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "authenticators",
          "kind": "self"
        },
        "assurance": "recent",
        "operations": [
          "profile.authenticators.enroll",
          "profile.authenticators.confirm"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "authenticators",
          "kind": "self"
        },
        "assurance": "recent",
        "operations": [
          "profile.authenticators.rename"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "authenticators",
          "kind": "self"
        },
        "assurance": "strong",
        "operations": [
          "profile.authenticators.remove",
          "profile.authenticators.replace"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "recovery_methods",
          "kind": "self"
        },
        "assurance": "strong",
        "operations": [
          "profile.recovery_codes.regenerate"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "sessions",
          "kind": "self"
        },
        "assurance": "recent",
        "operations": [
          "profile.sessions.revoke",
          "profile.sessions.revoke_others"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "devices",
          "kind": "self"
        },
        "assurance": "recent",
        "operations": [
          "profile.devices.rename"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "devices",
          "kind": "self"
        },
        "assurance": "strong",
        "operations": [
          "profile.devices.revoke"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "connected_identities",
          "kind": "self"
        },
        "assurance": "strong",
        "operations": [
          "profile.identities.link"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "connected_identities",
          "kind": "self"
        },
        "assurance": "strong",
        "operations": [
          "profile.identities.unlink"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "authentication_policy",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.authentication.read",
          "admin.authentication.preview",
          "admin.authentication.simulate"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "authentication_policy",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.authentication.draft",
          "admin.authentication.validate",
          "admin.authentication.apply",
          "admin.authentication.rollback",
          "admin.authentication.rollout"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "password_policy",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.password_policy.read"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "mfa_policy",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.mfa_policy.read"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "session_policy",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.session_policy.read"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "password_policy",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.password_policy.apply"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "mfa_policy",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.mfa_policy.apply"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "session_policy",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.session_policy.apply"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "authentication_policy",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.social_policy.apply"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "member_sessions",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.members.sessions.list"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "member_devices",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.members.devices.list"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "member_security",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.members.security.read",
          "admin.members.factor_recovery.status",
          "admin.members.bulk.progress"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "member_security",
          "kind": "rbac"
        },
        "assurance": "recent",
        "operations": [
          "admin.members.bulk.preview"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "member_sessions",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.members.sessions.revoke"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "member_devices",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.members.devices.revoke"
        ]
      },
      {
        "access": {
          "capability": "execute",
          "feature": "member_security",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.members.mfa_grace.extend",
          "admin.members.force_reset",
          "admin.members.factor_recovery.invite",
          "admin.members.factor_recovery.approve",
          "admin.members.factor_recovery.deny",
          "admin.members.home_identity.suspend",
          "admin.members.home_identity.reactivate",
          "admin.members.home_identity.compromise",
          "admin.members.target_access.suspend",
          "admin.members.bulk.execute",
          "admin.members.bulk.cancel"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "verified_domains",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.domains.list",
          "admin.domains.read"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "verified_domains",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.domains.add"
        ]
      },
      {
        "access": {
          "capability": "execute",
          "feature": "verified_domains",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.domains.verify",
          "admin.domains.recheck",
          "admin.domains.renew",
          "admin.domains.bind",
          "admin.domains.unbind",
          "admin.domains.routing.update",
          "admin.domains.transfer.initiate",
          "admin.domains.transfer.accept",
          "admin.domains.transfer.reject",
          "admin.domains.transfer.cancel"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "verified_domains",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.domains.transfer.status",
          "admin.domains.conflict.read"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "verified_domains",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.domains.remove",
          "admin.domains.release"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "identity_providers",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.providers.list",
          "admin.providers.read",
          "admin.providers.health"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "identity_providers",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.providers.create",
          "admin.providers.discovery_import"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "identity_providers",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.providers.update",
          "admin.providers.rotate_secret",
          "admin.providers.rotate_certificate",
          "admin.providers.assurance_mapping"
        ]
      },
      {
        "access": {
          "capability": "execute",
          "feature": "identity_providers",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.providers.configuration_probe",
          "admin.providers.runtime_test",
          "admin.providers.enable",
          "admin.providers.disable"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "identity_providers",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.providers.delete"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "emergency_access",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.emergency.read",
          "admin.emergency.readiness",
          "admin.emergency.alert_test.read"
        ]
      },
      {
        "access": {
          "capability": "execute",
          "feature": "emergency_access",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.emergency.alert_test.start"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "emergency_access",
          "kind": "rbac"
        },
        "assurance": "phishing_resistant",
        "operations": [
          "admin.emergency.setup"
        ]
      },
      {
        "access": {
          "capability": "execute",
          "feature": "emergency_access",
          "kind": "rbac"
        },
        "assurance": "phishing_resistant",
        "operations": [
          "admin.emergency.test",
          "admin.emergency.revoke",
          "admin.emergency.review"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "directory_provisioning",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.scim.read",
          "admin.scim.users.list",
          "admin.scim.groups.list",
          "admin.scim.activations.list",
          "admin.scim.invitations.list",
          "admin.scim.reconciliation.read",
          "admin.scim.drift.read",
          "admin.scim.progress.read"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "directory_provisioning",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.scim.provisioner.create",
          "admin.scim.token.create"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "directory_provisioning",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.scim.mapping.preview",
          "admin.scim.mapping.apply",
          "admin.scim.token.rotate",
          "admin.scim.provisioner.update"
        ]
      },
      {
        "access": {
          "capability": "execute",
          "feature": "directory_provisioning",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.scim.reconcile",
          "admin.scim.reconciliation.retry",
          "admin.scim.reconciliation.cancel",
          "admin.scim.provisioner.enable",
          "admin.scim.provisioner.disable"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "directory_provisioning",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.scim.token.revoke",
          "admin.scim.provisioner.delete"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "conditional_access",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.conditional.read",
          "admin.conditional.simulate",
          "admin.conditional.explain"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "conditional_access",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.conditional.rule.create"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "conditional_access",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.conditional.rule.update",
          "admin.conditional.rule.reorder"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "conditional_access",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.conditional.rule.delete"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "network_access",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.network.read",
          "admin.posture.read"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "network_access",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.network.source.create",
          "admin.posture.source.create"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "network_access",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.network.source.update",
          "admin.posture.source.update"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "network_access",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.network.source.delete",
          "admin.posture.source.delete"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "security_alerts",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.alerts.list",
          "admin.alerts.read"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "security_alerts",
          "kind": "rbac"
        },
        "assurance": "recent",
        "operations": [
          "admin.alerts.acknowledge",
          "admin.alerts.assign",
          "admin.alerts.escalate",
          "admin.alerts.resolve"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "security_contacts",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.contacts.list"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "security_contacts",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.contacts.create"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "security_contacts",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.contacts.update"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "security_contacts",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.contacts.delete"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "integrations",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.signals.streams.list",
          "admin.signals.streams.health",
          "admin.signals.transmitters.list"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "integrations",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.signals.transmitters.create",
          "admin.signals.streams.create"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "integrations",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.signals.transmitters.update",
          "admin.signals.keys.rotate",
          "admin.signals.streams.update",
          "admin.signals.streams.pause",
          "admin.signals.streams.resume"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "integrations",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.signals.transmitters.delete",
          "admin.signals.keys.revoke",
          "admin.signals.streams.delete"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "audit_logs",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.audit.search",
          "admin.audit.stream_status"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "audit_retention",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.audit.retention.read"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "audit_retention",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.audit.retention.update"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "legal_holds",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.audit.legal_holds.list"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "legal_holds",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.audit.legal_holds.create"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "legal_holds",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.audit.legal_holds.release"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "audit_exports",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.audit.export.create"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "audit_exports",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.audit.export.status"
        ]
      },
      {
        "access": {
          "capability": "delete",
          "feature": "audit_exports",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.audit.export.cancel"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "audit_exports",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.audit.export.download.authorize"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "audit_exports",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.audit.export.download"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "integrations",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.audit.siem.configure"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "integrations",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.audit.siem.status"
        ]
      },
      {
        "access": {
          "capability": "update",
          "feature": "integrations",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.audit.siem.replay"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "integrations",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.audit.siem.dead_letters.read"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "compliance_evidence",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.compliance.evidence.read"
        ]
      },
      {
        "access": {
          "capability": "create",
          "feature": "compliance_evidence",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.compliance.evidence.create"
        ]
      },
      {
        "access": {
          "capability": "read",
          "feature": "compliance_evidence",
          "kind": "rbac"
        },
        "assurance": "session",
        "operations": [
          "admin.compliance.evidence.status",
          "admin.compliance.report.status"
        ]
      },
      {
        "access": {
          "capability": "execute",
          "feature": "compliance_evidence",
          "kind": "rbac"
        },
        "assurance": "strong",
        "operations": [
          "admin.compliance.report.run"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "anonymous_entry"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.password_recovery.start",
          "identity.factor_recovery.start"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "csi_flow"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.methods.resolve",
          "identity.federation.start",
          "identity.social.start"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "login_or_stepup_ticket"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.passkey.assert",
          "identity.totp.verify",
          "identity.recovery_code.redeem"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "verified_account_session"
        },
        "assurance": "recent",
        "operations": [
          "identity.passkey.register",
          "identity.totp.enroll",
          "identity.totp.confirm"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "first_login_capability"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.passkey.register_first_login",
          "identity.totp.enroll_first_login",
          "identity.totp.confirm_first_login"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "recovery_enrollment_capability"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.passkey.register_recovery",
          "identity.totp.enroll_recovery",
          "identity.totp.confirm_recovery"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "password_recovery_challenge"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.password_recovery.complete"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "recovery_case"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.factor_recovery.status",
          "identity.factor_recovery.complete",
          "identity.factor_recovery.repudiate",
          "identity.factor_recovery.invitation.accept"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "verified_account_session"
        },
        "assurance": "session",
        "operations": [
          "identity.step_up.start"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "action_stepup_challenge"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.step_up.complete"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "federation_transaction"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.federation.callback",
          "identity.jit.primary_email.start",
          "identity.jit.primary_email.verify",
          "identity.jit.profile_complete",
          "identity.jit.privacy.acknowledge"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "idp_saml_handoff"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.federation.handoff.redeem"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "account_bound_federation_transaction"
        },
        "assurance": "session",
        "operations": [
          "identity.federation.step_up"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "scim_activation_capability"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.scim.primary_email.start"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "scim_email_challenge"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.scim.primary_email.verify"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "scim_verified_activation"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.scim.activation.complete"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "idp_dashboard_launch_proof"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.federation.dashboard_launch"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "social_transaction"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.social.callback"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "social_signup_journey"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.social.continue"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "social_handoff_token"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.social.handoff"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "account_bound_social_transaction"
        },
        "assurance": "strong",
        "operations": [
          "identity.social.link_callback"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "first_login_capability"
        },
        "assurance": "public_ceremony",
        "operations": [
          "identity.mfa.first_login_enroll"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "emergency_csi_flow"
        },
        "assurance": "emergency_entry",
        "operations": [
          "identity.emergency.entry",
          "identity.emergency.factor_test.start"
        ]
      },
      {
        "access": {
          "kind": "public_ceremony",
          "priorProof": "emergency_ceremony_ticket"
        },
        "assurance": "emergency_entry",
        "operations": [
          "identity.emergency.activate",
          "identity.emergency.factor_test.complete"
        ]
      },
      {
        "access": {
          "kind": "provider_logout"
        },
        "assurance": "machine_exact",
        "operations": [
          "identity.provider.logout"
        ]
      },
      {
        "access": {
          "kind": "signal_transmitter"
        },
        "assurance": "machine_exact",
        "operations": [
          "identity.signal.receive"
        ]
      },
      {
        "access": {
          "kind": "posture_producer"
        },
        "assurance": "machine_exact",
        "operations": [
          "identity.posture.receive"
        ]
      },
      {
        "access": {
          "kind": "provisioner"
        },
        "assurance": "machine_exact",
        "operations": [
          "scim.discovery",
          "scim.users.list",
          "scim.users.read",
          "scim.users.create",
          "scim.users.replace",
          "scim.users.patch",
          "scim.users.delete",
          "scim.groups.list",
          "scim.groups.read",
          "scim.groups.create",
          "scim.groups.replace",
          "scim.groups.patch",
          "scim.groups.delete"
        ]
      },
      {
        "access": {
          "kind": "internal_workload"
        },
        "assurance": "machine_exact",
        "operations": [
          "runtime.session.refresh",
          "runtime.session.revoke",
          "runtime.target_admit",
          "runtime.product_child.issue",
          "runtime.product_child.revoke",
          "runtime.policy.publish",
          "runtime.freshness.challenge",
          "runtime.authority_freshness.prove",
          "runtime.provider_derivation.reserve",
          "runtime.provider_derivation.activate",
          "runtime.signal.poll"
        ]
      },
      {
        "access": {
          "kind": "product_decision"
        },
        "assurance": "session",
        "operations": [
          "product.protected_request"
        ]
      }
    ],
    "operationRules": [
      "Each operation key occurs exactly once. This registry is the closed planned surface for Plans 01–11; EA-00G assigns DTOs and errors, while EA-00H assigns exact paths and methods, without inventing unclassified operations. A new operation requires a catalog change and holistic consumer review.",
      "For rbac, sectionKey is always admin and feature/capability resolve against the pinned authorization catalog. For self, the feature/capability is only a UI reference; the actual guard is verified exact identity-home user equality, never an admin impersonation or RBAC grant.",
      "A public_ceremony endpoint is not anonymous authorization: its required priorProof subtype is verified before work, alongside purpose, origin, one-use state/nonce and rate budget. anonymous_entry means enumeration-resistant start only; it never authorizes a completion. A verified_account_session or account_bound transaction binds the exact actor and account session. Social and enterprise link callback branches require the reserved profile.identities.link strong action proof, verified provider proof, and exact current CSI actor/account-session equality; a generic sign-in callback branch cannot satisfy this link guard. First-login enrollment and post-recovery/admin-invitation enrollment use distinct one-use capabilities binding exact user, permitted factor class, challenge, expiry and source policy/case; neither is a reusable session. TOTP confirmation activates only the seed created under that same capability; enrollment completion does not inherit prior assurance. Emergency entry/activation additionally proves the designated emergency identity's fresh MFA, reason, readiness and one-hour-maximum window; emergency_entry is a completion-result floor, not pre-authentication for the public start. The tenant phishing-resistant toggle strengthens this floor. A later window is a new activation with fresh proof, reason and ID, never a renewal of the prior row. Provisioner, provider_logout, signal_transmitter, posture_producer and internal_workload use distinct exact-purpose trust authorities and cannot substitute one another.",
      "SCIM human activation is not a federation transaction or a provisioner request. The initial capability is issued only for the exact pending resource, human recipient, tenant/provisioner/source revision, provisional identity and expiry; the email challenge is purpose- and candidate-bound, and verification issues a distinct one-use activation completion proof. A verified SSO route may issue that completion proof only after independently binding the existing account or the new-account preaccount primary-email requirement. None of these proofs grants a session, tenant membership or team role; TX-SCM-003 and authorization invitation acceptance remain separate authorities.",
      "runtime.signal.poll is an outbound stream-scoped SSF fetch worker with an exact configured transmitter/stream/key. It advances the exact stream cursor by lease/epoch CAS only after a stable bounded page receipt plus durable per-SET receipts/action intents or safe invalid-item digest dispositions. An uncheckpointed page replays by validated JTI or page/item digest; a malformed page envelope or conflicting response quarantines without cursor advance. It never accepts an interactive session, provider logout proof, SCIM bearer or generic PAT. Verified provider logout writes its exact subject/session logout floor before derivation enumeration; a pre-reservation JIT callback cannot bypass that floor.",
      "product.protected_request denotes a dynamic centrally cataloged action class. CSI-13 identity and target admission precede CSI-14's sole consuming RBAC decision, followed by the stronger of this catalog's class floor and current target policy; the session entry is only a minimum, not a blanket authorization.",
      "Guest admin member operations can affect only the target tenant's access lease, not the guest's identity-home credential, factor or private account-session inventory. Home-identity mutations require the actor's tenant to own the user's identity home and exact authorization; otherwise deny or use a separately classified tenant-access action.",
      "An emergency exception never bypasses RBAC or action assurance. It requires independent readiness, alerting and exact identity credential proof; its own runtime use is classified with the relevant protected action, not a generic emergency grant."
    ],
    "policyBounds": [
      {
        "default": 3600,
        "key": "session_idle_seconds",
        "maximum": 2592000,
        "minimum": 300
      },
      {
        "default": 43200,
        "key": "session_absolute_seconds",
        "maximum": 2592000,
        "minimum": 900
      },
      {
        "default": 900,
        "key": "action_recent_seconds",
        "maximum": 900,
        "minimum": 60
      },
      {
        "default": 300,
        "key": "action_strong_seconds",
        "maximum": 300,
        "minimum": 60
      },
      {
        "default": 15,
        "key": "password_minimum_characters",
        "maximum": 128,
        "minimum": 15
      },
      {
        "default": 128,
        "key": "password_maximum_characters",
        "maximum": 1024,
        "minimum": 64
      },
      {
        "default": 1024,
        "key": "password_maximum_utf8_bytes",
        "maximum": 16384,
        "minimum": 1024
      },
      {
        "default": null,
        "key": "active_account_session_cap",
        "maximum": 100,
        "minimum": 1
      },
      {
        "default": null,
        "key": "active_target_guest_session_cap",
        "maximum": 100,
        "minimum": 1
      },
      {
        "default": null,
        "key": "remembered_device_seconds",
        "maximum": 7776000,
        "minimum": 86400
      },
      {
        "default": 1209600,
        "key": "mfa_rollout_grace_seconds",
        "maximum": 2592000,
        "minimum": 0
      },
      {
        "default": 0,
        "key": "conditional_rules_per_revision",
        "maximum": 100,
        "minimum": 0
      },
      {
        "default": 0,
        "key": "trusted_network_sources",
        "maximum": 100,
        "minimum": 0
      },
      {
        "default": 0,
        "key": "posture_sources",
        "maximum": 16,
        "minimum": 0
      },
      {
        "default": 0,
        "key": "security_notification_destinations",
        "maximum": 10,
        "minimum": 0
      }
    ],
    "policyRules": [
      "Bounds constrain configured tenant overrides; mandatory realm baseline values may be stronger. The password-only minimum of 15 characters matches CSI's live lower bound. Other defaults are development product choices, not an assertion that the current CSI runtime already enforces them.",
      "The compiler validates the whole effective policy after realm/tenant merging: password_minimum_characters must not exceed password_maximum_characters; session_idle_seconds must not exceed session_absolute_seconds; action_strong_seconds must not exceed action_recent_seconds. Reject an incoherent candidate with a distinct typed ordering issue before publication rather than silently clamping, swapping or accepting its individually in-range values. Effective action age is the minimum of the named class, realm baseline and target policy. A null session-cap default means unlimited until an administrator explicitly configures a numeric cap; it is not zero. A null remembered-device duration means off by default; a configured duration is 1–90 days, with no sub-day enabled value.",
      "Password maximum characters and maximum NFC UTF-8 bytes are separate limits. CSI signup, recovery and sign-in now admit a bounded 16-KiB raw password. Identity home applies NFC and effective length policy when creating a verifier, and NFC with the fixed wire bound when verifying an existing one so later policy tightening cannot lock out a valid password. Plan 03 must still implement profile password change and Plan 04 must publish effective tenant overrides before a higher tenant limit becomes selectable. Password composition, periodic expiry, routine password history, raw token-lifetime controls, attacker-triggerable permanent locks and security questions are not supported.",
      "Existing users may enter bounded MFA rollout grace; first-login enrollment applies to new users, and grace never satisfies a separately sensitive action.",
      "separateMetamorphFactorAfterSso defaults false. When true, a verified SSO proof and a separate fresh Metamorph-controlled factor proof are both required; provider-reported MFA/AAL cannot satisfy the local-factor conjunct. The effective evidence records both sources, timestamps and revisions."
    ],
    "providerProtocols": [
      "saml",
      "oidc"
    ],
    "providerRules": [
      "SSO-only is a tenant-wide compiled allowed-method policy, never a provider-owned switch. Activating sso_only requires at least one eligible enabled provider with exact revision-bound real-provider callback testing, domain readiness and independent emergency/alert readiness. Configuration-ready or metadata-only tests are insufficient.",
      "IdP-dashboard SAML is an explicitly enabled, signed, replay-protected launch with no arbitrary RelayState, unsolicited account link, or claim of RP-initiated assertion-injection protection or FAL2/FAL3.",
      "Provider disable and verified logout revoke every exact active or pending provider derivation, including each contributing provider in a multi-provider account session.",
      "A provider purpose has one primary and at most one overlap secret/certificate/JWKS binding. The old binding expires no later than 30 days after overlap starts and earlier if its own validity ends; compromise ends acceptance immediately. The ceiling is a server rule, not a tenant policy override.",
      "Google, Microsoft and GitHub social login are allowed by default only when the adapter is available in the signed realm catalog; every other social provider defaults denied. The tenant compiled policy may deny an available adapter. Microsoft social is not tenant Entra SSO, and GitHub OAuth profile proof is not an OIDC ID token."
    ],
    "providerStates": [
      "draft",
      "configuration_ready",
      "runtime_tested",
      "enabled",
      "degraded",
      "disabled",
      "retired"
    ],
    "providerTrustOverlapMaxSeconds": 2592000,
    "schemaVersion": 1,
    "socialProviders": [
      {
        "key": "google",
        "protocol": "oidc",
        "realmAvailableDefaultAllowed": true
      },
      {
        "key": "microsoft",
        "protocol": "oidc",
        "realmAvailableDefaultAllowed": true
      },
      {
        "key": "github",
        "protocol": "oauth_profile",
        "realmAvailableDefaultAllowed": true
      }
    ],
    "tenantMethodModes": [
      "mixed",
      "sso_only"
    ],
    "unlistedSocialProviderDefaultAllowed": false
  },
  "eventCatalog": [
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-001",
      "owner": "common_audit",
      "wireType": "authentication.product_session.established"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-002",
      "owner": "common_audit",
      "wireType": "authentication.product_session.logged_out"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-003",
      "owner": "common_audit",
      "wireType": "authentication.account_session.logged_out"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-004",
      "owner": "common_audit",
      "wireType": "authentication.password_recovery.completed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-005",
      "owner": "common_audit",
      "wireType": "authentication.profile.contact.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-006",
      "owner": "common_audit",
      "wireType": "authentication.profile.authenticator.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-007",
      "owner": "common_audit",
      "wireType": "authentication.profile.identity.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-008",
      "owner": "common_audit",
      "wireType": "authentication.account_session.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-009",
      "owner": "common_audit",
      "wireType": "authentication.target_access.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-010",
      "owner": "common_audit",
      "wireType": "authentication.policy.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-011",
      "owner": "common_audit",
      "wireType": "authentication.member_security.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-012",
      "owner": "common_audit",
      "wireType": "authentication.domain.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-013",
      "owner": "common_audit",
      "wireType": "authentication.provider.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-014",
      "owner": "common_audit",
      "wireType": "authentication.federation.completed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-015",
      "owner": "common_audit",
      "wireType": "authentication.emergency.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-016",
      "owner": "common_audit",
      "wireType": "authentication.scim.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-017",
      "owner": "common_audit",
      "wireType": "authentication.conditional.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-018",
      "owner": "common_audit",
      "wireType": "authentication.network_posture.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-019",
      "owner": "common_audit",
      "wireType": "authentication.signal.configuration.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-020",
      "owner": "common_audit",
      "wireType": "authentication.signal.received"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-021",
      "owner": "common_audit",
      "wireType": "authentication.signal.action"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-022",
      "owner": "common_audit",
      "wireType": "authentication.alert.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-023",
      "owner": "common_audit",
      "wireType": "authentication.audit.accessed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-024",
      "owner": "common_audit",
      "wireType": "authentication.compliance.requested"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-025",
      "owner": "common_audit",
      "wireType": "authentication.identity.ceremony.completed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-026",
      "owner": "common_audit",
      "wireType": "authentication.security.denied"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-027",
      "owner": "common_audit",
      "wireType": "authentication.security.failed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-028",
      "owner": "common_audit",
      "wireType": "authentication.provider.logout"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-029",
      "owner": "common_audit",
      "wireType": "authentication.async_operation.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-030",
      "owner": "common_audit",
      "wireType": "authentication.provider.health.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-031",
      "owner": "common_audit",
      "wireType": "authentication.recovery.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-032",
      "owner": "common_audit",
      "wireType": "authentication.device.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-033",
      "owner": "common_audit",
      "wireType": "authentication.audit.integration.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-034",
      "owner": "common_audit",
      "wireType": "authentication.security_contact.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-035",
      "owner": "common_audit",
      "wireType": "authentication.posture.evidence.accepted"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-036",
      "owner": "common_audit",
      "wireType": "authentication.security.sensitive_read"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-037",
      "owner": "common_audit",
      "wireType": "authentication.security.preview_prepared"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-038",
      "owner": "common_audit",
      "wireType": "authentication.audit.retention.changed"
    },
    {
      "channel": "customer_audit",
      "consumer": "lodestone_append",
      "id": "EVT-AUD-039",
      "owner": "common_audit",
      "wireType": "authentication.audit.legal_hold.changed"
    },
    {
      "channel": "integration",
      "consumer": "notifications",
      "id": "EVT-INT-001",
      "owner": "source_transaction",
      "wireType": "notification_intent"
    },
    {
      "channel": "integration",
      "consumer": "regional_projector",
      "id": "EVT-INT-002",
      "owner": "source_transaction",
      "wireType": "projection_publication"
    },
    {
      "channel": "integration",
      "consumer": "authority_cache",
      "id": "EVT-INT-003",
      "owner": "source_transaction",
      "wireType": "cache_invalidation"
    },
    {
      "channel": "integration",
      "consumer": "owner_cleanup",
      "id": "EVT-INT-004",
      "owner": "source_transaction",
      "wireType": "lifecycle_cleanup"
    },
    {
      "channel": "integration",
      "consumer": "tenant_signal_service",
      "id": "EVT-INT-005",
      "owner": "source_transaction",
      "wireType": "signal_outcome"
    },
    {
      "channel": "integration",
      "consumer": "provider_health_service",
      "id": "EVT-INT-006",
      "owner": "source_transaction",
      "wireType": "provider_health"
    },
    {
      "channel": "integration",
      "consumer": "operation_pollers",
      "id": "EVT-INT-007",
      "owner": "source_transaction",
      "wireType": "async_progress"
    },
    {
      "channel": "integration",
      "consumer": "exact_destination_owner",
      "id": "EVT-INT-008",
      "owner": "source_transaction",
      "wireType": "regional_command"
    },
    {
      "channel": "integration",
      "consumer": "source_owner",
      "id": "EVT-INT-009",
      "owner": "destination_transaction",
      "wireType": "regional_receipt"
    },
    {
      "channel": "integration",
      "consumer": "tenant_security_operations",
      "id": "EVT-INT-010",
      "owner": "source_transaction",
      "wireType": "security_alert"
    }
  ],
  "eventEffectRules": [
    {
      "destinationEventId": "EVT-INT-009",
      "producer": "exact_destination_owner",
      "requiredBefore": "command_reply_or_source_pending_clear",
      "whenEventId": "EVT-INT-008"
    }
  ],
  "source": "metamorph-saas/docs/features/authentication/contracts/enterprise-security-catalog-v1.json"
} as const;
