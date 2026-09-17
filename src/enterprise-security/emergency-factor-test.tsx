import {
  Button,
  FormField,
  Input,
  PasswordInput,
  Stack,
  Text,
} from "@polymorph/ui/identity";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { IdentityAcceptedV1 } from "../contracts/generated/enterprise-security-v1/types/IdentityAcceptedV1";
import type { EmergencyLocalFactorProofV1 } from "../contracts/generated/enterprise-security-v1/types/EmergencyLocalFactorProofV1";
import type { IdentityFlow } from "../protocol/client";
import type { ProductEmergencyEntryV1 } from "../contracts/generated/csi07/ProductEmergencyEntryV1";
import { randomUuid7 } from "../protocol/random";
import {
  boundedPasswordInput,
  validPasswordInput,
} from "../presentation/validation";
import { identityEmergencyClient } from "./emergency-client";
import { emergencyCommandWasDenied } from "./emergency-contract";
import { passkeyBrowserAdapter } from "./passkey-browser";
import i18n from "../i18n";
import en from "../i18n/locales/en/enterprise-security.json";
i18n.addResourceBundle("en", "enterprise-security", en);

function fresh(value: string): void {
  if (!Number.isFinite(Date.parse(value)) || Date.parse(value) <= Date.now())
    throw new Error("security.ceremony.expired");
}
type FactorTestLaunch = ProductEmergencyEntryV1 & {
  readonly purpose: "factor_test";
  readonly targetUserId: string;
  readonly resultNonce: string;
};
function factorTestLaunch(flow: IdentityFlow): FactorTestLaunch {
  const launch = flow.bootstrap.emergencyEntry;
  if (
    launch?.purpose !== "factor_test" ||
    launch.targetUserId === null ||
    launch.resultNonce === null
  )
    throw new Error("security.ceremony.mismatch");
  return launch as FactorTestLaunch;
}

/** Purpose-only factor test. A successful result is returned to the exact
 * product opener and cannot establish an emergency or ordinary session. */
export function EmergencyFactorTestPanel({ flow }: { flow: IdentityFlow }) {
  const { t } = useTranslation("enterprise-security");
  const launch = factorTestLaunch(flow);
  const client = identityEmergencyClient(flow, launch.identityHomeRegionId);
  const [entry, setEntry] = useState<IdentityAcceptedV1>();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const abort = useRef(new AbortController());
  const retry = useRef<((signal: AbortSignal) => Promise<void>) | undefined>(
    undefined,
  );
  const busy = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    abort.current = controller;
    const scrub = () => {
      controller.abort();
      retry.current = undefined;
      setPassword("");
      setCode("");
      setEntry(undefined);
    };
    window.addEventListener("pagehide", scrub);
    window.addEventListener("pageshow", scrub);
    return () => {
      scrub();
      window.removeEventListener("pagehide", scrub);
      window.removeEventListener("pageshow", scrub);
    };
  }, [flow]);
  async function run(
    work: (signal: AbortSignal) => Promise<void>,
    isRetry = false,
  ) {
    if (busy.current || (uncertain && !isRetry)) return;
    busy.current = true;
    setPending(true);
    setFailed(false);
    try {
      fresh(flow.bootstrap.expiresAt);
      fresh(launch.expiresAt);
      await work(abort.current.signal);
      abort.current.signal.throwIfAborted();
      retry.current = undefined;
      setUncertain(false);
    } catch (error) {
      if (!abort.current.signal.aborted) {
        setFailed(true);
        if (emergencyCommandWasDenied(error)) {
          retry.current = undefined;
          setUncertain(false);
          // A rejected proof terminalizes this one-proof ceremony. Starting a
          // new challenge consumes the durable target-scoped launch budget.
          setEntry(undefined);
        } else setUncertain(retry.current !== undefined);
      }
    } finally {
      busy.current = false;
      if (!abort.current.signal.aborted) setPending(false);
    }
  }
  function begin() {
    const request = {
      schemaVersion: 1 as const,
      attemptId: randomUuid7(),
      targetTenantId: launch.targetTenantId,
      targetUserId: launch.targetUserId!,
    };
    const send = async (signal: AbortSignal) => {
      const result = await client.call(
        "identity.emergency.factor_test.start",
        request,
        request.attemptId,
        signal,
      );
      if (!result.accepted) throw new Error("security.response.invalid");
      fresh(result.expiresAt);
      setEntry(result);
    };
    retry.current = send;
    void run(send);
  }
  function complete(passkey: boolean) {
    if (!entry) return;
    const ceremony = {
      schemaVersion: 1 as const,
      attemptId: randomUuid7(),
      continuationId: entry.continuationId,
      expectedCeremonyRevision: "1",
    };
    const capturedPassword = password;
    const capturedCode = code;
    setPassword("");
    setCode("");
    void run(async (signal) => {
      let localFactor: EmergencyLocalFactorProofV1;
      if (passkey) {
        const challenge = await client.call(
          "identity.passkey.assert",
          { kind: "start", ceremony },
          ceremony.attemptId,
          signal,
        );
        if (
          challenge.kind !== "challenge" ||
          challenge.ceremonyId !== ceremony.continuationId ||
          challenge.userVerification !== "required"
        )
          throw new Error("security.response.invalid");
        localFactor = {
          kind: "passkey",
          assertion: await passkeyBrowserAdapter.assert(challenge, signal),
        };
      } else {
        localFactor = {
          kind: "password_totp",
          password: capturedPassword,
          code: capturedCode,
        };
      }
      const request = { ceremony, localFactor };
      const send = async (retrySignal: AbortSignal) => {
        const receipt = await client.call(
          "identity.emergency.factor_test.complete",
          request,
          ceremony.attemptId,
          retrySignal,
        );
        if (
          receipt.attemptId !== ceremony.attemptId ||
          receipt.continuationId !== ceremony.continuationId ||
          receipt.targetTenantId !== launch.targetTenantId ||
          receipt.targetUserId !== launch.targetUserId
        )
          throw new Error("security.response.invalid");
        fresh(receipt.expiresAt);
        if (window.opener === null || window.opener.closed)
          throw new Error("security.ceremony.cancelled");
        window.opener.postMessage(
          {
            kind: "metamorphEmergencyFactorTestResult",
            schemaVersion: 1,
            launchId: launch.launchId,
            targetTenantId: launch.targetTenantId,
            targetUserId: launch.targetUserId,
            resultNonce: launch.resultNonce,
            receipt,
          },
          flow.catalog.projection.productUiOrigin,
        );
        window.close();
      };
      retry.current = send;
      await send(signal);
    });
  }
  return (
    <Stack gap={4}>
      <Text>{t("emergency.factorTest.description")}</Text>
      {failed && <Text>{t("emergency.unavailable")}</Text>}
      {uncertain && (
        <Button
          label={t("actions.retry")}
          disabled={pending}
          onClick={() => {
            if (retry.current) void run(retry.current, true);
          }}
        />
      )}
      {!entry ? (
        <Button
          label={t("emergency.factorTest.begin")}
          loading={pending}
          disabled={uncertain}
          onClick={begin}
        />
      ) : (
        <>
          <Button
            label={t("emergency.passkey")}
            disabled={pending || uncertain}
            onClick={() => complete(true)}
          />
          <FormField id="emergency-test-password" label={t("emergency.password")}>
            <PasswordInput
              value={password}
              disabled={pending || uncertain}
              autoComplete="current-password"
              toggleLabel={t("emergency.showPassword")}
              onChange={(value) => {
                const bounded = boundedPasswordInput(value);
                if (bounded !== null) setPassword(bounded);
              }}
            />
          </FormField>
          <FormField id="emergency-test-totp" label={t("emergency.totp")}>
            <Input
              value={code}
              disabled={pending || uncertain}
              autoComplete="one-time-code"
              maxLength={6}
              onChange={(value) => {
                if (/^\d{0,6}$/u.test(value)) setCode(value);
              }}
            />
          </FormField>
          <Button
            label={t("emergency.factorTest.complete")}
            loading={pending}
            disabled={
              uncertain ||
              !validPasswordInput(password) ||
              !/^\d{6}$/u.test(code)
            }
            onClick={() => complete(false)}
          />
        </>
      )}
    </Stack>
  );
}
