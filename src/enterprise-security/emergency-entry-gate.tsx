import { lazy, Suspense, useContext, useMemo } from "react";
import type { IdentityFlow } from "../protocol/client";
import { EmergencyEntryContext } from "./emergency-entry-owner";
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
  const owner = useContext(EmergencyEntryContext);
  const scopeKey = useMemo(
    () => (owner ? crypto.randomUUID() : ""),
    [owner, props.flow, props.email],
  );
  return owner?.flowId === props.flow.bootstrap.flowId ? (
    <Suspense fallback={null}>
      <Entry key={scopeKey} {...props} owner={owner} />
    </Suspense>
  ) : null;
}
