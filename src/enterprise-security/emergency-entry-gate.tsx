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
  const owner = purposeOwner ?? installed;
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
