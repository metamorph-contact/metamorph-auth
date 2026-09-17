// Generated from metamorph-saas/crates/enterprise-security-contract::OPERATION_CONTRACT_FAMILIES. Do not edit.
export const enterpriseSecurityOperations = {
  "admin.alerts.acknowledge": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.alerts.acknowledge.request.schema.json",
    "requestType": "AlertCommandRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.alerts.acknowledge.response.schema.json",
    "responseType": "AlertMutationResultV1"
  },
  "admin.alerts.assign": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.alerts.assign.request.schema.json",
    "requestType": "AlertAssignRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.alerts.assign.response.schema.json",
    "responseType": "AlertMutationResultV1"
  },
  "admin.alerts.escalate": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.alerts.escalate.request.schema.json",
    "requestType": "AlertCommandRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.alerts.escalate.response.schema.json",
    "responseType": "AlertMutationResultV1"
  },
  "admin.alerts.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.alerts.list.request.schema.json",
    "requestType": "SecurityOpsPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.alerts.list.response.schema.json",
    "responseType": "PageResultV1<SecurityAlertV1>"
  },
  "admin.alerts.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.alerts.read.request.schema.json",
    "requestType": "SecurityOpsItemRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.alerts.read.response.schema.json",
    "responseType": "SecurityAlertV1"
  },
  "admin.alerts.resolve": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.alerts.resolve.request.schema.json",
    "requestType": "AlertCommandRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.alerts.resolve.response.schema.json",
    "responseType": "AlertMutationResultV1"
  },
  "admin.audit.export.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.export.create.request.schema.json",
    "requestType": "AuditExportRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.export.create.response.schema.json",
    "responseType": "SecurityAsyncResultV1"
  },
  "admin.audit.export.status": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.export.status.request.schema.json",
    "requestType": "SecurityAsyncStatusRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.export.status.response.schema.json",
    "responseType": "SecurityAsyncResultV1"
  },
  "admin.audit.legal_holds.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.legal_holds.create.request.schema.json",
    "requestType": "AuditLegalHoldCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.legal_holds.create.response.schema.json",
    "responseType": "AuditLegalHoldMutationResultV1"
  },
  "admin.audit.legal_holds.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.legal_holds.list.request.schema.json",
    "requestType": "AuditLegalHoldsListRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.legal_holds.list.response.schema.json",
    "responseType": "AuditLegalHoldsListV1"
  },
  "admin.audit.legal_holds.release": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.legal_holds.release.request.schema.json",
    "requestType": "AuditLegalHoldReleaseRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.legal_holds.release.response.schema.json",
    "responseType": "AuditLegalHoldMutationResultV1"
  },
  "admin.audit.retention.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.retention.read.request.schema.json",
    "requestType": "AuditRetentionStatusRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.retention.read.response.schema.json",
    "responseType": "AuditRetentionStatusV1"
  },
  "admin.audit.retention.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.retention.update.request.schema.json",
    "requestType": "AuditRetentionUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.retention.update.response.schema.json",
    "responseType": "AuditRetentionMutationResultV1"
  },
  "admin.audit.search": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.search.request.schema.json",
    "requestType": "AuditSearchRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.search.response.schema.json",
    "responseType": "PageResultV1<SecurityAuditEventV1>"
  },
  "admin.audit.siem.configure": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.siem.configure.request.schema.json",
    "requestType": "AuditSiemConfigureRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.siem.configure.response.schema.json",
    "responseType": "SecurityAsyncResultV1"
  },
  "admin.audit.siem.status": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.siem.status.request.schema.json",
    "requestType": "SecurityAsyncStatusRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.siem.status.response.schema.json",
    "responseType": "SecurityAsyncResultV1"
  },
  "admin.audit.stream_status": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.audit.stream_status.request.schema.json",
    "requestType": "SecurityOpsItemRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.audit.stream_status.response.schema.json",
    "responseType": "AuditStreamStatusV1"
  },
  "admin.authentication.apply": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.authentication.apply.request.schema.json",
    "requestType": "AdminAuthenticationApplyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.authentication.apply.response.schema.json",
    "responseType": "AdminPolicySectionApplyResultV1"
  },
  "admin.authentication.draft": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.authentication.draft.request.schema.json",
    "requestType": "AdminAuthenticationDraftRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.authentication.draft.response.schema.json",
    "responseType": "AdminAuthenticationDraftResultV1"
  },
  "admin.authentication.preview": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.authentication.preview.request.schema.json",
    "requestType": "AdminAuthenticationPreviewRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.authentication.preview.response.schema.json",
    "responseType": "AdminAuthenticationPreviewResultV1"
  },
  "admin.authentication.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.authentication.read.request.schema.json",
    "requestType": "AdminPolicySectionReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.authentication.read.response.schema.json",
    "responseType": "AdminAuthenticationWorkspaceV1"
  },
  "admin.authentication.rollback": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.authentication.rollback.request.schema.json",
    "requestType": "AdminAuthenticationRollbackRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.authentication.rollback.response.schema.json",
    "responseType": "AdminPolicySectionApplyResultV1"
  },
  "admin.authentication.rollout": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.authentication.rollout.request.schema.json",
    "requestType": "AdminAuthenticationRolloutRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.authentication.rollout.response.schema.json",
    "responseType": "AdminAuthenticationRolloutResultV1"
  },
  "admin.authentication.simulate": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.authentication.simulate.request.schema.json",
    "requestType": "AdminAuthenticationSimulateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.authentication.simulate.response.schema.json",
    "responseType": "AdminAuthenticationSimulationResultV1"
  },
  "admin.authentication.validate": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.authentication.validate.request.schema.json",
    "requestType": "AdminAuthenticationValidateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.authentication.validate.response.schema.json",
    "responseType": "AdminAuthenticationValidationResultV1"
  },
  "admin.compliance.evidence.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.compliance.evidence.create.request.schema.json",
    "requestType": "ComplianceEvidenceCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.compliance.evidence.create.response.schema.json",
    "responseType": "SecurityAsyncResultV1"
  },
  "admin.compliance.evidence.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.compliance.evidence.read.request.schema.json",
    "requestType": "ComplianceEvidenceRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.compliance.evidence.read.response.schema.json",
    "responseType": "ComplianceEvidenceV1"
  },
  "admin.compliance.evidence.status": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.compliance.evidence.status.request.schema.json",
    "requestType": "SecurityAsyncStatusRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.compliance.evidence.status.response.schema.json",
    "responseType": "SecurityAsyncResultV1"
  },
  "admin.compliance.report.run": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.compliance.report.run.request.schema.json",
    "requestType": "ComplianceReportRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.compliance.report.run.response.schema.json",
    "responseType": "SecurityAsyncResultV1"
  },
  "admin.compliance.report.status": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.compliance.report.status.request.schema.json",
    "requestType": "SecurityAsyncStatusRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.compliance.report.status.response.schema.json",
    "responseType": "SecurityAsyncResultV1"
  },
  "admin.conditional.explain": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.conditional.explain.request.schema.json",
    "requestType": "ConditionalExplainRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.conditional.explain.response.schema.json",
    "responseType": "ConditionalExplanationV1"
  },
  "admin.conditional.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.conditional.read.request.schema.json",
    "requestType": "ConditionalReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.conditional.read.response.schema.json",
    "responseType": "ConditionalWorkspaceV1"
  },
  "admin.conditional.rule.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.conditional.rule.create.request.schema.json",
    "requestType": "ConditionalRuleCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.conditional.rule.create.response.schema.json",
    "responseType": "ConditionalMutationResultV1"
  },
  "admin.conditional.rule.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.conditional.rule.delete.request.schema.json",
    "requestType": "ConditionalRuleDeleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.conditional.rule.delete.response.schema.json",
    "responseType": "ConditionalMutationResultV1"
  },
  "admin.conditional.rule.reorder": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.conditional.rule.reorder.request.schema.json",
    "requestType": "ConditionalRuleReorderRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.conditional.rule.reorder.response.schema.json",
    "responseType": "ConditionalMutationResultV1"
  },
  "admin.conditional.rule.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.conditional.rule.update.request.schema.json",
    "requestType": "ConditionalRuleUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.conditional.rule.update.response.schema.json",
    "responseType": "ConditionalMutationResultV1"
  },
  "admin.conditional.simulate": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.conditional.simulate.request.schema.json",
    "requestType": "ConditionalSimulationRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.conditional.simulate.response.schema.json",
    "responseType": "ConditionalExplanationV1"
  },
  "admin.contacts.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.contacts.create.request.schema.json",
    "requestType": "SecurityContactCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.contacts.create.response.schema.json",
    "responseType": "SecurityContactResultV1"
  },
  "admin.contacts.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.contacts.delete.request.schema.json",
    "requestType": "SecurityContactDeleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.contacts.delete.response.schema.json",
    "responseType": "SecurityContactResultV1"
  },
  "admin.contacts.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.contacts.list.request.schema.json",
    "requestType": "SecurityOpsPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.contacts.list.response.schema.json",
    "responseType": "PageResultV1<SecurityContactV1>"
  },
  "admin.contacts.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.contacts.update.request.schema.json",
    "requestType": "SecurityContactUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.contacts.update.response.schema.json",
    "responseType": "SecurityContactResultV1"
  },
  "admin.domains.add": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.add.request.schema.json",
    "requestType": "AdminDomainAddRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.add.response.schema.json",
    "responseType": "AdminDomainAddResultV1"
  },
  "admin.domains.bind": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.bind.request.schema.json",
    "requestType": "AdminDomainBindRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.bind.response.schema.json",
    "responseType": "AdminDomainBindResultV1"
  },
  "admin.domains.conflict.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.conflict.read.request.schema.json",
    "requestType": "AdminDomainConflictReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.conflict.read.response.schema.json",
    "responseType": "AdminDomainConflictReadResultV1"
  },
  "admin.domains.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.list.request.schema.json",
    "requestType": "AdminDomainListRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.list.response.schema.json",
    "responseType": "AdminDomainListResultV1"
  },
  "admin.domains.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.read.request.schema.json",
    "requestType": "AdminDomainReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.read.response.schema.json",
    "responseType": "AdminDomainReadResultV1"
  },
  "admin.domains.recheck": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.recheck.request.schema.json",
    "requestType": "AdminDomainProofCheckRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.recheck.response.schema.json",
    "responseType": "AdminDomainProofCheckResultV1"
  },
  "admin.domains.release": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.release.request.schema.json",
    "requestType": "AdminDomainReleaseRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.release.response.schema.json",
    "responseType": "AdminDomainReleaseResultV1"
  },
  "admin.domains.remove": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.remove.request.schema.json",
    "requestType": "AdminDomainRemoveRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.remove.response.schema.json",
    "responseType": "AdminDomainRemoveResultV1"
  },
  "admin.domains.renew": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.renew.request.schema.json",
    "requestType": "AdminDomainRenewRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.renew.response.schema.json",
    "responseType": "AdminDomainRenewResultV1"
  },
  "admin.domains.routing.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.routing.update.request.schema.json",
    "requestType": "AdminDomainRoutingUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.routing.update.response.schema.json",
    "responseType": "AdminDomainRoutingUpdateResultV1"
  },
  "admin.domains.transfer.accept": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.accept.request.schema.json",
    "requestType": "AdminDomainTransferAcceptRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.accept.response.schema.json",
    "responseType": "AdminDomainTransferAcceptResultV1"
  },
  "admin.domains.transfer.cancel": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.cancel.request.schema.json",
    "requestType": "AdminDomainTransferCancelRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.cancel.response.schema.json",
    "responseType": "AdminDomainTransferTerminalResultV1"
  },
  "admin.domains.transfer.initiate": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.initiate.request.schema.json",
    "requestType": "AdminDomainTransferInitiateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.initiate.response.schema.json",
    "responseType": "AdminDomainTransferInitiateResultV1"
  },
  "admin.domains.transfer.reject": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.reject.request.schema.json",
    "requestType": "AdminDomainTransferRejectRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.reject.response.schema.json",
    "responseType": "AdminDomainTransferTerminalResultV1"
  },
  "admin.domains.transfer.status": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.status.request.schema.json",
    "requestType": "AdminDomainTransferStatusRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.transfer.status.response.schema.json",
    "responseType": "AdminDomainTransferStatusResultV1"
  },
  "admin.domains.unbind": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.unbind.request.schema.json",
    "requestType": "AdminDomainUnbindRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.unbind.response.schema.json",
    "responseType": "AdminDomainUnbindResultV1"
  },
  "admin.domains.verify": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.domains.verify.request.schema.json",
    "requestType": "AdminDomainProofCheckRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.domains.verify.response.schema.json",
    "responseType": "AdminDomainProofCheckResultV1"
  },
  "admin.emergency.alert_test.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.emergency.alert_test.read.request.schema.json",
    "requestType": "AdminEmergencyAlertTestReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.emergency.alert_test.read.response.schema.json",
    "responseType": "AdminEmergencyAlertTestResultV1"
  },
  "admin.emergency.alert_test.start": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.emergency.alert_test.start.request.schema.json",
    "requestType": "AdminEmergencyAlertTestStartRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.emergency.alert_test.start.response.schema.json",
    "responseType": "AdminEmergencyAlertTestResultV1"
  },
  "admin.emergency.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.emergency.read.request.schema.json",
    "requestType": "AdminEmergencyReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.emergency.read.response.schema.json",
    "responseType": "AdminEmergencyReadResultV1"
  },
  "admin.emergency.readiness": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.emergency.readiness.request.schema.json",
    "requestType": "AdminEmergencyReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.emergency.readiness.response.schema.json",
    "responseType": "EmergencyReadinessV1"
  },
  "admin.emergency.review": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.emergency.review.request.schema.json",
    "requestType": "AdminEmergencyReviewRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.emergency.review.response.schema.json",
    "responseType": "AdminEmergencyReviewResultV1"
  },
  "admin.emergency.revoke": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.emergency.revoke.request.schema.json",
    "requestType": "AdminEmergencyRevokeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.emergency.revoke.response.schema.json",
    "responseType": "AdminEmergencyRevokeResultV1"
  },
  "admin.emergency.setup": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.emergency.setup.request.schema.json",
    "requestType": "AdminEmergencySetupRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.emergency.setup.response.schema.json",
    "responseType": "AdminEmergencySetupResultV1"
  },
  "admin.emergency.test": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.emergency.test.request.schema.json",
    "requestType": "AdminEmergencyTestRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.emergency.test.response.schema.json",
    "responseType": "AdminEmergencyTestResultV1"
  },
  "admin.members.bulk.cancel": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.bulk.cancel.request.schema.json",
    "requestType": "AdminBulkCancelRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.bulk.cancel.response.schema.json",
    "responseType": "AdminBulkCancelResultV1"
  },
  "admin.members.bulk.execute": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.bulk.execute.request.schema.json",
    "requestType": "AdminBulkExecuteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.bulk.execute.response.schema.json",
    "responseType": "AdminBulkExecuteResultV1"
  },
  "admin.members.bulk.preview": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.bulk.preview.request.schema.json",
    "requestType": "AdminBulkPreviewRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.bulk.preview.response.schema.json",
    "responseType": "AdminBulkPreviewResultV1"
  },
  "admin.members.bulk.progress": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.bulk.progress.request.schema.json",
    "requestType": "AdminBulkProgressRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.bulk.progress.response.schema.json",
    "responseType": "AdminBulkProgressResultV1"
  },
  "admin.members.devices.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.devices.list.request.schema.json",
    "requestType": "AdminMemberPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.devices.list.response.schema.json",
    "responseType": "AdminMemberDevicesPageV1"
  },
  "admin.members.devices.revoke": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.devices.revoke.request.schema.json",
    "requestType": "AdminMemberDeviceRevokeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.devices.revoke.response.schema.json",
    "responseType": "SessionRevocationResultV1"
  },
  "admin.members.factor_recovery.approve": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.factor_recovery.approve.request.schema.json",
    "requestType": "AdminFactorRecoveryDecisionRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.factor_recovery.approve.response.schema.json",
    "responseType": "AdminFactorRecoveryDecisionResultV1"
  },
  "admin.members.factor_recovery.deny": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.factor_recovery.deny.request.schema.json",
    "requestType": "AdminFactorRecoveryDecisionRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.factor_recovery.deny.response.schema.json",
    "responseType": "AdminFactorRecoveryDecisionResultV1"
  },
  "admin.members.factor_recovery.invite": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.factor_recovery.invite.request.schema.json",
    "requestType": "AdminFactorRecoveryInviteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.factor_recovery.invite.response.schema.json",
    "responseType": "AdminFactorRecoveryInviteResultV1"
  },
  "admin.members.factor_recovery.status": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.factor_recovery.status.request.schema.json",
    "requestType": "AdminMemberReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.factor_recovery.status.response.schema.json",
    "responseType": "AdminFactorRecoveryStatusResultV1"
  },
  "admin.members.force_reset": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.force_reset.request.schema.json",
    "requestType": "AdminForcePasswordResetRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.force_reset.response.schema.json",
    "responseType": "AdminForcePasswordResetResultV1"
  },
  "admin.members.home_identity.compromise": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.home_identity.compromise.request.schema.json",
    "requestType": "AdminHomeIdentityChangeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.home_identity.compromise.response.schema.json",
    "responseType": "AdminHomeIdentityChangeResultV1"
  },
  "admin.members.home_identity.reactivate": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.home_identity.reactivate.request.schema.json",
    "requestType": "AdminHomeIdentityReactivateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.home_identity.reactivate.response.schema.json",
    "responseType": "AdminHomeIdentityChangeResultV1"
  },
  "admin.members.home_identity.suspend": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.home_identity.suspend.request.schema.json",
    "requestType": "AdminHomeIdentityChangeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.home_identity.suspend.response.schema.json",
    "responseType": "AdminHomeIdentityChangeResultV1"
  },
  "admin.members.mfa_grace.extend": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.mfa_grace.extend.request.schema.json",
    "requestType": "AdminMfaGraceExtendRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.mfa_grace.extend.response.schema.json",
    "responseType": "AdminMfaGraceExtendResultV1"
  },
  "admin.members.security.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.security.read.request.schema.json",
    "requestType": "AdminMemberReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.security.read.response.schema.json",
    "responseType": "AdminMemberSecurityReadResultV1"
  },
  "admin.members.sessions.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.sessions.list.request.schema.json",
    "requestType": "AdminMemberPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.sessions.list.response.schema.json",
    "responseType": "AdminMemberSessionsPageV1"
  },
  "admin.members.sessions.revoke": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.sessions.revoke.request.schema.json",
    "requestType": "AdminMemberSessionRevokeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.sessions.revoke.response.schema.json",
    "responseType": "SessionRevocationResultV1"
  },
  "admin.members.target_access.suspend": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.members.target_access.suspend.request.schema.json",
    "requestType": "AdminTargetAccessSuspendRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.members.target_access.suspend.response.schema.json",
    "responseType": "AdminTargetAccessSuspendResultV1"
  },
  "admin.mfa_policy.apply": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.mfa_policy.apply.request.schema.json",
    "requestType": "AdminMfaPolicyApplyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.mfa_policy.apply.response.schema.json",
    "responseType": "AdminPolicySectionApplyResultV1"
  },
  "admin.mfa_policy.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.mfa_policy.read.request.schema.json",
    "requestType": "AdminPolicySectionReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.mfa_policy.read.response.schema.json",
    "responseType": "AdminMfaPolicyReadResultV1"
  },
  "admin.network.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.network.read.request.schema.json",
    "requestType": "ConditionalSourceReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.network.read.response.schema.json",
    "responseType": "ConditionalSourcesReadResultV1"
  },
  "admin.network.source.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.network.source.create.request.schema.json",
    "requestType": "ConditionalSourceCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.network.source.create.response.schema.json",
    "responseType": "ConditionalSourceResultV1"
  },
  "admin.network.source.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.network.source.delete.request.schema.json",
    "requestType": "ConditionalSourceDeleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.network.source.delete.response.schema.json",
    "responseType": "ConditionalSourceDeletedV1"
  },
  "admin.network.source.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.network.source.update.request.schema.json",
    "requestType": "ConditionalSourceUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.network.source.update.response.schema.json",
    "responseType": "ConditionalSourceResultV1"
  },
  "admin.password_policy.apply": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.password_policy.apply.request.schema.json",
    "requestType": "AdminPasswordPolicyApplyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.password_policy.apply.response.schema.json",
    "responseType": "AdminPolicySectionApplyResultV1"
  },
  "admin.password_policy.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.password_policy.read.request.schema.json",
    "requestType": "AdminPolicySectionReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.password_policy.read.response.schema.json",
    "responseType": "AdminPasswordPolicyReadResultV1"
  },
  "admin.posture.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.posture.read.request.schema.json",
    "requestType": "ConditionalSourceReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.posture.read.response.schema.json",
    "responseType": "ConditionalSourcesReadResultV1"
  },
  "admin.posture.source.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.posture.source.create.request.schema.json",
    "requestType": "ConditionalSourceCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.posture.source.create.response.schema.json",
    "responseType": "ConditionalSourceResultV1"
  },
  "admin.posture.source.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.posture.source.delete.request.schema.json",
    "requestType": "ConditionalSourceDeleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.posture.source.delete.response.schema.json",
    "responseType": "ConditionalSourceDeletedV1"
  },
  "admin.posture.source.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.posture.source.update.request.schema.json",
    "requestType": "ConditionalSourceUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.posture.source.update.response.schema.json",
    "responseType": "ConditionalSourceResultV1"
  },
  "admin.providers.assurance_mapping": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.assurance_mapping.request.schema.json",
    "requestType": "AdminProviderAssuranceMappingRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.assurance_mapping.response.schema.json",
    "responseType": "AdminProviderAssuranceMappingResultV1"
  },
  "admin.providers.configuration_probe": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.configuration_probe.request.schema.json",
    "requestType": "AdminProviderTestRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.configuration_probe.response.schema.json",
    "responseType": "AdminProviderTestResultV1"
  },
  "admin.providers.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.create.request.schema.json",
    "requestType": "AdminProviderCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.create.response.schema.json",
    "responseType": "AdminProviderCreateResultV1"
  },
  "admin.providers.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.delete.request.schema.json",
    "requestType": "AdminProviderDeleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.delete.response.schema.json",
    "responseType": "AdminProviderDeleteResultV1"
  },
  "admin.providers.disable": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.disable.request.schema.json",
    "requestType": "AdminProviderDisableRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.disable.response.schema.json",
    "responseType": "AdminProviderStateChangeResultV1"
  },
  "admin.providers.discovery_import": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.discovery_import.request.schema.json",
    "requestType": "AdminProviderDiscoveryImportRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.discovery_import.response.schema.json",
    "responseType": "AdminProviderDiscoveryImportResultV1"
  },
  "admin.providers.enable": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.enable.request.schema.json",
    "requestType": "AdminProviderEnableRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.enable.response.schema.json",
    "responseType": "AdminProviderStateChangeResultV1"
  },
  "admin.providers.health": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.health.request.schema.json",
    "requestType": "AdminProviderHealthRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.health.response.schema.json",
    "responseType": "AdminProviderHealthResultV1"
  },
  "admin.providers.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.list.request.schema.json",
    "requestType": "AdminProviderListRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.list.response.schema.json",
    "responseType": "AdminProviderListResultV1"
  },
  "admin.providers.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.read.request.schema.json",
    "requestType": "AdminProviderReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.read.response.schema.json",
    "responseType": "AdminProviderReadResultV1"
  },
  "admin.providers.rotate_certificate": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.rotate_certificate.request.schema.json",
    "requestType": "AdminProviderRotateCertificateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.rotate_certificate.response.schema.json",
    "responseType": "AdminProviderRotateCertificateResultV1"
  },
  "admin.providers.rotate_secret": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.rotate_secret.request.schema.json",
    "requestType": "AdminProviderRotateSecretRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.rotate_secret.response.schema.json",
    "responseType": "AdminProviderRotateSecretResultV1"
  },
  "admin.providers.runtime_test": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.runtime_test.request.schema.json",
    "requestType": "AdminProviderRuntimeTestRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.runtime_test.response.schema.json",
    "responseType": "AdminProviderRuntimeTestResultV1"
  },
  "admin.providers.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.providers.update.request.schema.json",
    "requestType": "AdminProviderUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.providers.update.response.schema.json",
    "responseType": "AdminProviderUpdateResultV1"
  },
  "admin.scim.activations.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.activations.list.request.schema.json",
    "requestType": "AdminScimReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.activations.list.response.schema.json",
    "responseType": "PageResultV1<ScimActivationCardV1>"
  },
  "admin.scim.drift.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.drift.read.request.schema.json",
    "requestType": "AdminScimRunReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.drift.read.response.schema.json",
    "responseType": "PageResultV1<ScimDriftCardV1>"
  },
  "admin.scim.groups.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.groups.list.request.schema.json",
    "requestType": "AdminScimReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.groups.list.response.schema.json",
    "responseType": "PageResultV1<ScimGroupCardV1>"
  },
  "admin.scim.invitations.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.invitations.list.request.schema.json",
    "requestType": "AdminScimReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.invitations.list.response.schema.json",
    "responseType": "PageResultV1<ScimInvitationCardV1>"
  },
  "admin.scim.mapping.apply": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.mapping.apply.request.schema.json",
    "requestType": "AdminScimMappingApplyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.mapping.apply.response.schema.json",
    "responseType": "AdminScimMappingApplyResultV1"
  },
  "admin.scim.mapping.preview": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.mapping.preview.request.schema.json",
    "requestType": "AdminScimMappingPreviewRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.mapping.preview.response.schema.json",
    "responseType": "AdminScimMappingPreviewV1"
  },
  "admin.scim.progress.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.progress.read.request.schema.json",
    "requestType": "AdminScimRunReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.progress.read.response.schema.json",
    "responseType": "ScimReconciliationCardV1"
  },
  "admin.scim.provisioner.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.create.request.schema.json",
    "requestType": "AdminScimProvisionerCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.create.response.schema.json",
    "responseType": "AdminScimProvisionerChangeResultV1"
  },
  "admin.scim.provisioner.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.delete.request.schema.json",
    "requestType": "AdminScimProvisionerStateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.delete.response.schema.json",
    "responseType": "AdminScimProvisionerDeleteResultV1"
  },
  "admin.scim.provisioner.disable": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.disable.request.schema.json",
    "requestType": "AdminScimProvisionerStateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.disable.response.schema.json",
    "responseType": "AdminScimProvisionerChangeResultV1"
  },
  "admin.scim.provisioner.enable": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.enable.request.schema.json",
    "requestType": "AdminScimProvisionerStateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.enable.response.schema.json",
    "responseType": "AdminScimProvisionerChangeResultV1"
  },
  "admin.scim.provisioner.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.update.request.schema.json",
    "requestType": "AdminScimProvisionerUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.provisioner.update.response.schema.json",
    "responseType": "AdminScimProvisionerChangeResultV1"
  },
  "admin.scim.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.read.request.schema.json",
    "requestType": "AdminScimReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.read.response.schema.json",
    "responseType": "AdminScimOverviewV1"
  },
  "admin.scim.reconcile": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.reconcile.request.schema.json",
    "requestType": "AdminScimReconcileRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.reconcile.response.schema.json",
    "responseType": "ScimReconciliationCardV1"
  },
  "admin.scim.reconciliation.cancel": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.reconciliation.cancel.request.schema.json",
    "requestType": "AdminScimRunCommandRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.reconciliation.cancel.response.schema.json",
    "responseType": "ScimReconciliationCardV1"
  },
  "admin.scim.reconciliation.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.reconciliation.read.request.schema.json",
    "requestType": "AdminScimRunReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.reconciliation.read.response.schema.json",
    "responseType": "ScimReconciliationCardV1"
  },
  "admin.scim.reconciliation.retry": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.reconciliation.retry.request.schema.json",
    "requestType": "AdminScimRunCommandRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.reconciliation.retry.response.schema.json",
    "responseType": "ScimReconciliationCardV1"
  },
  "admin.scim.token.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.token.create.request.schema.json",
    "requestType": "AdminScimTokenCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.token.create.response.schema.json",
    "responseType": "AdminScimTokenIssuedV1"
  },
  "admin.scim.token.revoke": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.token.revoke.request.schema.json",
    "requestType": "AdminScimTokenRevokeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.token.revoke.response.schema.json",
    "responseType": "AdminScimTokenRevokeResultV1"
  },
  "admin.scim.token.rotate": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.token.rotate.request.schema.json",
    "requestType": "AdminScimTokenRotateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.token.rotate.response.schema.json",
    "responseType": "AdminScimTokenIssuedV1"
  },
  "admin.scim.users.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.scim.users.list.request.schema.json",
    "requestType": "AdminScimReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.scim.users.list.response.schema.json",
    "responseType": "PageResultV1<ScimUserCardV1>"
  },
  "admin.session_policy.apply": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.session_policy.apply.request.schema.json",
    "requestType": "AdminSessionPolicyApplyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.session_policy.apply.response.schema.json",
    "responseType": "AdminPolicySectionApplyResultV1"
  },
  "admin.session_policy.read": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.session_policy.read.request.schema.json",
    "requestType": "AdminPolicySectionReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.session_policy.read.response.schema.json",
    "responseType": "AdminSessionPolicyReadResultV1"
  },
  "admin.signals.keys.revoke": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.keys.revoke.request.schema.json",
    "requestType": "SignalKeyCommandV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.keys.revoke.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.signals.keys.rotate": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.keys.rotate.request.schema.json",
    "requestType": "SignalKeyRotateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.keys.rotate.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.signals.streams.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.streams.create.request.schema.json",
    "requestType": "SignalStreamCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.streams.create.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.signals.streams.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.streams.delete.request.schema.json",
    "requestType": "SignalDeleteCommandV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.streams.delete.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.signals.streams.health": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.streams.health.request.schema.json",
    "requestType": "SecurityOpsItemRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.streams.health.response.schema.json",
    "responseType": "SignalStreamHealthV1"
  },
  "admin.signals.streams.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.streams.list.request.schema.json",
    "requestType": "SecurityOpsPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.streams.list.response.schema.json",
    "responseType": "PageResultV1<SignalStreamV1>"
  },
  "admin.signals.streams.pause": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.streams.pause.request.schema.json",
    "requestType": "SignalDeleteCommandV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.streams.pause.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.signals.streams.resume": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.streams.resume.request.schema.json",
    "requestType": "SignalDeleteCommandV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.streams.resume.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.signals.streams.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.streams.update.request.schema.json",
    "requestType": "SignalStreamUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.streams.update.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.signals.transmitters.create": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.transmitters.create.request.schema.json",
    "requestType": "SignalTransmitterCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.transmitters.create.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.signals.transmitters.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.transmitters.delete.request.schema.json",
    "requestType": "SignalDeleteCommandV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.transmitters.delete.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.signals.transmitters.list": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.transmitters.list.request.schema.json",
    "requestType": "SecurityOpsPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.transmitters.list.response.schema.json",
    "responseType": "PageResultV1<SignalTransmitterCardV1>"
  },
  "admin.signals.transmitters.update": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.signals.transmitters.update.request.schema.json",
    "requestType": "SignalTransmitterUpdateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.signals.transmitters.update.response.schema.json",
    "responseType": "SignalMutationResultV1"
  },
  "admin.social_policy.apply": {
    "requestSchema": "generated/enterprise-security-v1/api/admin.social_policy.apply.request.schema.json",
    "requestType": "AdminSocialPolicyApplyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/admin.social_policy.apply.response.schema.json",
    "responseType": "AdminPolicySectionApplyResultV1"
  },
  "identity.emergency.activate": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.emergency.activate.request.schema.json",
    "requestType": "IdentityEmergencyActivateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.emergency.activate.response.schema.json",
    "responseType": "IdentityEmergencyActivationV1"
  },
  "identity.emergency.entry": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.emergency.entry.request.schema.json",
    "requestType": "IdentityEmergencyEntryRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.emergency.entry.response.schema.json",
    "responseType": "IdentityAcceptedV1"
  },
  "identity.emergency.factor_test.complete": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.emergency.factor_test.complete.request.schema.json",
    "requestType": "IdentityEmergencyFactorTestCompleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.emergency.factor_test.complete.response.schema.json",
    "responseType": "IdentityEmergencyFactorTestReceiptV1"
  },
  "identity.emergency.factor_test.start": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.emergency.factor_test.start.request.schema.json",
    "requestType": "IdentityEmergencyFactorTestStartRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.emergency.factor_test.start.response.schema.json",
    "responseType": "IdentityAcceptedV1"
  },
  "identity.factor_recovery.complete": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.complete.request.schema.json",
    "requestType": "IdentityFactorRecoveryCompleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.complete.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.factor_recovery.invitation.accept": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.invitation.accept.request.schema.json",
    "requestType": "IdentityFactorRecoveryInvitationAcceptRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.invitation.accept.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.factor_recovery.repudiate": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.repudiate.request.schema.json",
    "requestType": "IdentityFactorRecoveryRepudiateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.repudiate.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.factor_recovery.start": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.start.request.schema.json",
    "requestType": "IdentityFactorRecoveryStartRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.start.response.schema.json",
    "responseType": "IdentityAcceptedV1"
  },
  "identity.factor_recovery.status": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.status.request.schema.json",
    "requestType": "IdentityFactorRecoveryStatusRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.factor_recovery.status.response.schema.json",
    "responseType": "IdentityFactorRecoveryStatusV1"
  },
  "identity.federation.callback": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.federation.callback.request.schema.json",
    "requestType": "ExternalIdentityCallbackRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.federation.callback.response.schema.json",
    "responseType": "IdentityFederationProgressV1"
  },
  "identity.federation.dashboard_launch": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.federation.dashboard_launch.request.schema.json",
    "requestType": "IdentityDashboardLaunchRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.federation.dashboard_launch.response.schema.json",
    "responseType": "ExternalIdentityStartV1"
  },
  "identity.federation.handoff.redeem": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.federation.handoff.redeem.request.schema.json",
    "requestType": "IdentityIdpSamlHandoffRedeemRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.federation.handoff.redeem.response.schema.json",
    "responseType": "IdentityIdpSamlHandoffRedeemResultV1"
  },
  "identity.federation.start": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.federation.start.request.schema.json",
    "requestType": "ExternalIdentityStartRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.federation.start.response.schema.json",
    "responseType": "ExternalIdentityStartV1"
  },
  "identity.federation.step_up": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.federation.step_up.request.schema.json",
    "requestType": "IdentityFederatedStepUpRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.federation.step_up.response.schema.json",
    "responseType": "IdentityStepUpResultV1"
  },
  "identity.jit.primary_email.start": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.jit.primary_email.start.request.schema.json",
    "requestType": "IdentityEmailStartRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.jit.primary_email.start.response.schema.json",
    "responseType": "IdentityJitPrimaryEmailStartResultV1"
  },
  "identity.jit.primary_email.verify": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.jit.primary_email.verify.request.schema.json",
    "requestType": "IdentityEmailVerifyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.jit.primary_email.verify.response.schema.json",
    "responseType": "IdentityFederationProgressV1"
  },
  "identity.jit.privacy.acknowledge": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.jit.privacy.acknowledge.request.schema.json",
    "requestType": "IdentityJitPrivacyAcknowledgeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.jit.privacy.acknowledge.response.schema.json",
    "responseType": "PrivacyAcknowledgementHandoffV1"
  },
  "identity.jit.profile_complete": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.jit.profile_complete.request.schema.json",
    "requestType": "IdentityProfileCompleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.jit.profile_complete.response.schema.json",
    "responseType": "IdentityFederationProgressV1"
  },
  "identity.methods.resolve": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.methods.resolve.request.schema.json",
    "requestType": "IdentityEntryRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.methods.resolve.response.schema.json",
    "responseType": "IdentityMethodResolutionV1"
  },
  "identity.mfa.first_login_enroll": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.mfa.first_login_enroll.request.schema.json",
    "requestType": "IdentityFirstLoginEnrollmentRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.mfa.first_login_enroll.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.passkey.assert": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.passkey.assert.request.schema.json",
    "requestType": "IdentityPasskeyAssertRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.passkey.assert.response.schema.json",
    "responseType": "IdentityPasskeyAssertResultV1"
  },
  "identity.passkey.register": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.passkey.register.request.schema.json",
    "requestType": "IdentityPasskeyRegisterRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.passkey.register.response.schema.json",
    "responseType": "IdentityPasskeyRegisterResultV1"
  },
  "identity.passkey.register_first_login": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.passkey.register_first_login.request.schema.json",
    "requestType": "IdentityPasskeyRegisterRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.passkey.register_first_login.response.schema.json",
    "responseType": "IdentityPasskeyRegisterResultV1"
  },
  "identity.passkey.register_recovery": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.passkey.register_recovery.request.schema.json",
    "requestType": "IdentityPasskeyRegisterRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.passkey.register_recovery.response.schema.json",
    "responseType": "IdentityPasskeyRegisterResultV1"
  },
  "identity.posture.receive": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.posture.receive.request.schema.json",
    "requestType": "IdentityPostureReceiveRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.posture.receive.response.schema.json",
    "responseType": "IdentitySignalReceiptV1"
  },
  "identity.provider.logout": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.provider.logout.request.schema.json",
    "requestType": "IdentityProviderLogoutRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.provider.logout.response.schema.json",
    "responseType": "IdentitySignalReceiptV1"
  },
  "identity.recovery_code.redeem": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.recovery_code.redeem.request.schema.json",
    "requestType": "IdentityRecoveryCodeRedeemRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.recovery_code.redeem.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.scim.activation.complete": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.scim.activation.complete.request.schema.json",
    "requestType": "IdentityScimCompleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.scim.activation.complete.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.scim.primary_email.start": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.scim.primary_email.start.request.schema.json",
    "requestType": "IdentityScimEmailStartRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.scim.primary_email.start.response.schema.json",
    "responseType": "IdentityAcceptedV1"
  },
  "identity.scim.primary_email.verify": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.scim.primary_email.verify.request.schema.json",
    "requestType": "IdentityScimEmailVerifyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.scim.primary_email.verify.response.schema.json",
    "responseType": "IdentityScimVerifiedActivationV1"
  },
  "identity.signal.receive": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.signal.receive.request.schema.json",
    "requestType": "IdentitySignalReceiveRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.signal.receive.response.schema.json",
    "responseType": "IdentitySignalReceiptV1"
  },
  "identity.social.callback": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.social.callback.request.schema.json",
    "requestType": "IdentitySocialCallbackRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.social.callback.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.social.link_callback": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.social.link_callback.request.schema.json",
    "requestType": "IdentitySocialLinkCallbackRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.social.link_callback.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.social.start": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.social.start.request.schema.json",
    "requestType": "IdentitySocialStartRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.social.start.response.schema.json",
    "responseType": "IdentitySocialStartV1"
  },
  "identity.step_up.complete": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.step_up.complete.request.schema.json",
    "requestType": "IdentityStepUpCompleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.step_up.complete.response.schema.json",
    "responseType": "IdentityStepUpResultV1"
  },
  "identity.step_up.start": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.step_up.start.request.schema.json",
    "requestType": "IdentityStepUpStartRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.step_up.start.response.schema.json",
    "responseType": "IdentityStepUpStartResultV1"
  },
  "identity.totp.confirm": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.totp.confirm.request.schema.json",
    "requestType": "IdentityTotpVerifyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.totp.confirm.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.totp.confirm_first_login": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.totp.confirm_first_login.request.schema.json",
    "requestType": "IdentityTotpVerifyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.totp.confirm_first_login.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.totp.confirm_recovery": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.totp.confirm_recovery.request.schema.json",
    "requestType": "IdentityTotpVerifyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.totp.confirm_recovery.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "identity.totp.enroll": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.totp.enroll.request.schema.json",
    "requestType": "IdentityCeremonyRefV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.totp.enroll.response.schema.json",
    "responseType": "IdentityTotpEnrollResultV1"
  },
  "identity.totp.enroll_first_login": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.totp.enroll_first_login.request.schema.json",
    "requestType": "IdentityCeremonyRefV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.totp.enroll_first_login.response.schema.json",
    "responseType": "IdentityTotpEnrollResultV1"
  },
  "identity.totp.enroll_recovery": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.totp.enroll_recovery.request.schema.json",
    "requestType": "IdentityCeremonyRefV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.totp.enroll_recovery.response.schema.json",
    "responseType": "IdentityTotpEnrollResultV1"
  },
  "identity.totp.verify": {
    "requestSchema": "generated/enterprise-security-v1/api/identity.totp.verify.request.schema.json",
    "requestType": "IdentityTotpVerifyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/identity.totp.verify.response.schema.json",
    "responseType": "IdentityCeremonyProgressV1"
  },
  "product.protected_request": {
    "requestSchema": "generated/enterprise-security-v1/api/product.protected_request.request.schema.json",
    "requestType": "ProductProtectedRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/product.protected_request.response.schema.json",
    "responseType": "ProductProtectedDecisionV1"
  },
  "profile.activity.list": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.activity.list.request.schema.json",
    "requestType": "SelfPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.activity.list.response.schema.json",
    "responseType": "ProfileActivityPageV1"
  },
  "profile.authenticators.confirm": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.authenticators.confirm.request.schema.json",
    "requestType": "ProfileAuthenticatorConfirmRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.authenticators.confirm.response.schema.json",
    "responseType": "ProfileAuthenticatorConfirmResultV1"
  },
  "profile.authenticators.enroll": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.authenticators.enroll.request.schema.json",
    "requestType": "ProfileAuthenticatorEnrollRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.authenticators.enroll.response.schema.json",
    "responseType": "AuthenticatorEnrollmentStartV1"
  },
  "profile.authenticators.list": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.authenticators.list.request.schema.json",
    "requestType": "SelfPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.authenticators.list.response.schema.json",
    "responseType": "ProfileAuthenticatorsPageV1"
  },
  "profile.authenticators.remove": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.authenticators.remove.request.schema.json",
    "requestType": "ProfileAuthenticatorRemoveRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.authenticators.remove.response.schema.json",
    "responseType": "ProfileAuthenticatorRemoveResultV1"
  },
  "profile.authenticators.rename": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.authenticators.rename.request.schema.json",
    "requestType": "ProfileAuthenticatorRenameRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.authenticators.rename.response.schema.json",
    "responseType": "ProfileAuthenticatorRenameResultV1"
  },
  "profile.authenticators.replace": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.authenticators.replace.request.schema.json",
    "requestType": "ProfileAuthenticatorReplaceRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.authenticators.replace.response.schema.json",
    "responseType": "AuthenticatorEnrollmentStartV1"
  },
  "profile.devices.list": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.devices.list.request.schema.json",
    "requestType": "SelfPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.devices.list.response.schema.json",
    "responseType": "ProfileDevicesPageV1"
  },
  "profile.devices.rename": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.devices.rename.request.schema.json",
    "requestType": "ProfileDeviceRenameRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.devices.rename.response.schema.json",
    "responseType": "ProfileDeviceRenameResultV1"
  },
  "profile.devices.revoke": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.devices.revoke.request.schema.json",
    "requestType": "ProfileDeviceRevokeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.devices.revoke.response.schema.json",
    "responseType": "SessionRevocationResultV1"
  },
  "profile.emails.add": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.emails.add.request.schema.json",
    "requestType": "ProfileEmailAddRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.emails.add.response.schema.json",
    "responseType": "ProfileContactChallengeAcceptanceV1"
  },
  "profile.emails.list": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.emails.list.request.schema.json",
    "requestType": "SelfPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.emails.list.response.schema.json",
    "responseType": "ProfileEmailsPageV1"
  },
  "profile.emails.promote": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.emails.promote.request.schema.json",
    "requestType": "ProfileEmailPromoteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.emails.promote.response.schema.json",
    "responseType": "ProfileEmailPromotionResultV1"
  },
  "profile.emails.remove": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.emails.remove.request.schema.json",
    "requestType": "ProfileEmailRemoveRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.emails.remove.response.schema.json",
    "responseType": "ProfileEmailRemovalResultV1"
  },
  "profile.emails.verify": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.emails.verify.request.schema.json",
    "requestType": "ProfileContactVerifyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.emails.verify.response.schema.json",
    "responseType": "ProfileEmailVerificationResultV1"
  },
  "profile.identities.link": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.identities.link.request.schema.json",
    "requestType": "ProfileIdentityLinkRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.identities.link.response.schema.json",
    "responseType": "ProfileIdentityLinkPreparedV1"
  },
  "profile.identities.list": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.identities.list.request.schema.json",
    "requestType": "SelfPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.identities.list.response.schema.json",
    "responseType": "ProfileConnectedIdentitiesPageV1"
  },
  "profile.identities.unlink": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.identities.unlink.request.schema.json",
    "requestType": "ProfileIdentityUnlinkRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.identities.unlink.response.schema.json",
    "responseType": "ProfileIdentityUnlinkResultV1"
  },
  "profile.notifications.add": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.notifications.add.request.schema.json",
    "requestType": "ProfileNotificationAddRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.notifications.add.response.schema.json",
    "responseType": "ProfileContactChallengeAcceptanceV1"
  },
  "profile.notifications.list": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.notifications.list.request.schema.json",
    "requestType": "SelfPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.notifications.list.response.schema.json",
    "responseType": "ProfileNotificationPageV1"
  },
  "profile.notifications.remove": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.notifications.remove.request.schema.json",
    "requestType": "ProfileNotificationRemoveRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.notifications.remove.response.schema.json",
    "responseType": "ProfileNotificationRemovalResultV1"
  },
  "profile.notifications.verify": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.notifications.verify.request.schema.json",
    "requestType": "ProfileContactVerifyRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.notifications.verify.response.schema.json",
    "responseType": "ProfileNotificationVerificationResultV1"
  },
  "profile.password.change": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.password.change.request.schema.json",
    "requestType": "ProfilePasswordChangeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.password.change.response.schema.json",
    "responseType": "ProfilePasswordChangeResultV1"
  },
  "profile.recovery.readiness": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.recovery.readiness.request.schema.json",
    "requestType": "SelfReadRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.recovery.readiness.response.schema.json",
    "responseType": "ProfileRecoveryReadinessV1"
  },
  "profile.recovery_codes.regenerate": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.recovery_codes.regenerate.request.schema.json",
    "requestType": "ProfileRecoveryCodesRegenerateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.recovery_codes.regenerate.response.schema.json",
    "responseType": "ProfileRecoveryCodesRegenerateResultV1"
  },
  "profile.sessions.list": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.sessions.list.request.schema.json",
    "requestType": "SelfPageRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.sessions.list.response.schema.json",
    "responseType": "ProfileSessionsPageV1"
  },
  "profile.sessions.revoke": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.sessions.revoke.request.schema.json",
    "requestType": "ProfileSessionRevokeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.sessions.revoke.response.schema.json",
    "responseType": "SessionRevocationResultV1"
  },
  "profile.sessions.revoke_others": {
    "requestSchema": "generated/enterprise-security-v1/api/profile.sessions.revoke_others.request.schema.json",
    "requestType": "ProfileRevokeOtherSessionsRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/profile.sessions.revoke_others.response.schema.json",
    "responseType": "ProfileRevokeOtherSessionsResultV1"
  },
  "runtime.authority_freshness.prove": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.authority_freshness.prove.request.schema.json",
    "requestType": "AuthorityFreshnessChallengeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.authority_freshness.prove.response.schema.json",
    "responseType": "AuthorityFreshnessChallengeResultV1"
  },
  "runtime.freshness.challenge": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.freshness.challenge.request.schema.json",
    "requestType": "RuntimeFreshnessChallengeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.freshness.challenge.response.schema.json",
    "responseType": "RuntimeFreshnessChallengeV1"
  },
  "runtime.policy.publish": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.policy.publish.request.schema.json",
    "requestType": "RuntimePolicyPublishRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.policy.publish.response.schema.json",
    "responseType": "RuntimeMutationResultV1"
  },
  "runtime.product_child.issue": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.product_child.issue.request.schema.json",
    "requestType": "RuntimeProductChildIssueRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.product_child.issue.response.schema.json",
    "responseType": "RuntimeProductChildIssuedV1"
  },
  "runtime.product_child.revoke": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.product_child.revoke.request.schema.json",
    "requestType": "RuntimeProductChildRevokeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.product_child.revoke.response.schema.json",
    "responseType": "RuntimeMutationResultV1"
  },
  "runtime.provider_derivation.activate": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.provider_derivation.activate.request.schema.json",
    "requestType": "RuntimeDerivationActivateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.provider_derivation.activate.response.schema.json",
    "responseType": "RuntimeDerivationActivationV1"
  },
  "runtime.provider_derivation.reserve": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.provider_derivation.reserve.request.schema.json",
    "requestType": "RuntimeDerivationReserveRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.provider_derivation.reserve.response.schema.json",
    "responseType": "RuntimeDerivationReservationV1"
  },
  "runtime.session.refresh": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.session.refresh.request.schema.json",
    "requestType": "RuntimeSessionRefreshRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.session.refresh.response.schema.json",
    "responseType": "RuntimeSessionRefreshResultV1"
  },
  "runtime.session.revoke": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.session.revoke.request.schema.json",
    "requestType": "RuntimeSessionRevokeRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.session.revoke.response.schema.json",
    "responseType": "RuntimeMutationResultV1"
  },
  "runtime.signal.poll": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.signal.poll.request.schema.json",
    "requestType": "RuntimeSignalPollRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.signal.poll.response.schema.json",
    "responseType": "RuntimeSignalPollResultV1"
  },
  "runtime.target_admit": {
    "requestSchema": "generated/enterprise-security-v1/api/runtime.target_admit.request.schema.json",
    "requestType": "RuntimeTargetAdmitRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/runtime.target_admit.response.schema.json",
    "responseType": "RuntimeTargetAdmitResultV1"
  },
  "scim.discovery": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.discovery.request.schema.json",
    "requestType": "ScimDiscoveryRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.discovery.response.schema.json",
    "responseType": "ScimDiscoveryV1"
  },
  "scim.groups.create": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.groups.create.request.schema.json",
    "requestType": "ScimGroupCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.groups.create.response.schema.json",
    "responseType": "ScimGroupV1"
  },
  "scim.groups.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.groups.delete.request.schema.json",
    "requestType": "ScimDeleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.groups.delete.response.schema.json",
    "responseType": "ScimDeletedV1"
  },
  "scim.groups.list": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.groups.list.request.schema.json",
    "requestType": "ScimListRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.groups.list.response.schema.json",
    "responseType": "ScimGroupListV1"
  },
  "scim.groups.patch": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.groups.patch.request.schema.json",
    "requestType": "ScimPatchRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.groups.patch.response.schema.json",
    "responseType": "ScimGroupV1"
  },
  "scim.groups.read": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.groups.read.request.schema.json",
    "requestType": "ScimResourceRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.groups.read.response.schema.json",
    "responseType": "ScimGroupV1"
  },
  "scim.groups.replace": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.groups.replace.request.schema.json",
    "requestType": "ScimGroupReplaceRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.groups.replace.response.schema.json",
    "responseType": "ScimGroupV1"
  },
  "scim.users.create": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.users.create.request.schema.json",
    "requestType": "ScimUserCreateRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.users.create.response.schema.json",
    "responseType": "ScimUserV1"
  },
  "scim.users.delete": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.users.delete.request.schema.json",
    "requestType": "ScimDeleteRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.users.delete.response.schema.json",
    "responseType": "ScimDeletedV1"
  },
  "scim.users.list": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.users.list.request.schema.json",
    "requestType": "ScimListRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.users.list.response.schema.json",
    "responseType": "ScimUserListV1"
  },
  "scim.users.patch": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.users.patch.request.schema.json",
    "requestType": "ScimPatchRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.users.patch.response.schema.json",
    "responseType": "ScimUserV1"
  },
  "scim.users.read": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.users.read.request.schema.json",
    "requestType": "ScimResourceRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.users.read.response.schema.json",
    "responseType": "ScimUserV1"
  },
  "scim.users.replace": {
    "requestSchema": "generated/enterprise-security-v1/api/scim.users.replace.request.schema.json",
    "requestType": "ScimUserReplaceRequestV1",
    "responseSchema": "generated/enterprise-security-v1/api/scim.users.replace.response.schema.json",
    "responseType": "ScimUserV1"
  }
} as const;
export const externalCsiOperations = {
  "identity.password_recovery.complete": {
    "authority": "metamorph-identity-controller/CSI-11",
    "requestType": "metamorph_identity_controller::PasswordRecoveryCompleteRequestV1",
    "responseType": "metamorph_identity_controller::PasswordRecoveryCompletedV1"
  },
  "identity.password_recovery.start": {
    "authority": "metamorph-identity-controller/CSI-11",
    "requestType": "metamorph_identity_controller::PasswordRecoveryRequestV1",
    "responseType": "metamorph_identity_controller::PasswordRecoveryAcceptedV1"
  }
} as const;
