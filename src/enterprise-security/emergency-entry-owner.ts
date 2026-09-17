import { createContext } from "react";
import type { IdentityFlow } from "../protocol/client";
import type { IdentityEmergencyActivationV1 } from "../contracts/generated/enterprise-security-v1/types/IdentityEmergencyActivationV1";

/** Supplied only by an admitted emergency-purpose CSI flow. Selection is not
 * authorization. Completion must advance the actual CSI controller and its
 * registered callback/session fences; an activation DTO cannot create a grant. */
export interface EmergencyEntryOwner {
  flowId: string;
  targetTenantId: string;
  identityHomeRegionId: string;
  complete(
    flow: IdentityFlow,
    activation: IdentityEmergencyActivationV1,
    signal: AbortSignal,
  ): Promise<string>;
}
export const EmergencyEntryContext = createContext<
  EmergencyEntryOwner | undefined
>(undefined);

/** Builds the context only from the verified emergency-purpose bootstrap. CSI
 * finalization is installed by EA-08I-05; until then completion fails closed. */
export function emergencyEntryOwnerForFlow(
  flow: IdentityFlow,
): EmergencyEntryOwner | undefined {
  const entry = flow.bootstrap.emergencyEntry;
  if (
    flow.bootstrap.intent !== "emergency" ||
    entry?.purpose !== "entry" ||
    entry.targetUserId !== null ||
    entry.resultNonce !== null ||
    flow.bootstrap.emergencyAuthorization === null ||
    Date.parse(entry.expiresAt) <= Date.now()
  )
    return undefined;
  return Object.freeze({
    flowId: flow.bootstrap.flowId,
    targetTenantId: entry.targetTenantId,
    identityHomeRegionId: entry.identityHomeRegionId,
    async complete() {
      throw new Error("security.dependency.unavailable");
    },
  });
}
