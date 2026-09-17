import type { IdentityEntryRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityEntryRequestV1'
import type { IdentityMethodResolutionV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import type { SecurityApiErrorV1 } from '../contracts/generated/enterprise-security-v1/types/SecurityApiErrorV1'

export interface IdentityMethodClient {
  resolveMethods(request: IdentityEntryRequestV1, signal: AbortSignal): Promise<IdentityMethodResolutionV1>
}

export class IdentityMethodPreviewError extends Error {
  constructor(readonly envelope: SecurityApiErrorV1) {
    super(envelope.error.code)
    this.name = 'IdentityMethodPreviewError'
  }
}
