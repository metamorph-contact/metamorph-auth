import { lazy, Suspense, useContext, useMemo } from "react";
import type { IdentityFlow } from "../protocol/client";
import {
  EmergencyEntryContext,
  emergencyEntryOwnerForFlow,
} from "./emergency-entry-owner";
const Entry = lazy(() =>
  import("./emergency-entry").then((module) => ({
    default: module.EmergencyEntry,
  })),
);
/** Eligibility precedes loading local proof/client/validator assets. */
export function EmergencyEntryGate(props: {
  flow: IdentityFlow;
  email: string;
  disabled: boolean;
  navigate: (uri: string) => Promise<void>;
}) {
  const installed = useContext(EmergencyEntryContext);
  const purposeOwner = useMemo(
    () => emergencyEntryOwnerForFlow(props.flow),
    [props.flow],
  );
  const installedMatchesPurpose =
    installed !== undefined &&
    purposeOwner !== undefined &&
    installed.flowId === purposeOwner.flowId &&
    installed.targetTenantId === purposeOwner.targetTenantId &&
    installed.identityHomeRegionId === purposeOwner.identityHomeRegionId;
  // Prefer the real CSI finalizer when it is bound to this exact verified
  // emergency-purpose flow. The local owner is only a fail-closed placeholder
  // for deployments that have not installed INT-AUT-05 yet.
  const owner = installedMatchesPurpose ? installed : purposeOwner;
  const scopeKey = useMemo(
    () => (owner ? crypto.randomUUID() : ""),
    [owner, props.flow, props.email],
  );
  return (
    <EmergencyEntryContext.Provider value={owner}>
      {owner?.flowId === props.flow.bootstrap.flowId ? (
        <Suspense fallback={null}>
          <Entry key={scopeKey} {...props} owner={owner} />
        </Suspense>
      ) : null}
    </EmergencyEntryContext.Provider>
  );
}
