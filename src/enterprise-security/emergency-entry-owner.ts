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
