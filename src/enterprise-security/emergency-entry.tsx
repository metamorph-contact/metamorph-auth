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
import type { IdentityFlow } from "../protocol/client";
import { randomUuid7 } from "../protocol/random";
import {
  boundedPasswordInput,
  validPasswordInput,
} from "../presentation/validation";
import type { IdentityAcceptedV1 } from "../contracts/generated/enterprise-security-v1/types/IdentityAcceptedV1";
import type { IdentityEmergencyActivationV1 } from "../contracts/generated/enterprise-security-v1/types/IdentityEmergencyActivationV1";
import type { EmergencyLocalFactorProofV1 } from "../contracts/generated/enterprise-security-v1/types/EmergencyLocalFactorProofV1";
import { identityEmergencyClient } from "./emergency-client";
import { emergencyCommandWasDenied } from "./emergency-contract";
import i18n from "../i18n";
import en from "../i18n/locales/en/enterprise-security.json";
i18n.addResourceBundle("en", "enterprise-security", en);
import { passkeyBrowserAdapter } from "./passkey-browser";

import type { EmergencyEntryOwner } from "./emergency-entry-owner";
function fresh(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time <= Date.now())
    throw new Error("security.ceremony.expired");
}
export function EmergencyEntry({
  flow,
  email,
  disabled,
  navigate,
  owner,
}: {
  flow: IdentityFlow;
  email: string;
  disabled: boolean;
  navigate: (uri: string) => Promise<void>;
  owner: EmergencyEntryOwner;
}) {
  const { t } = useTranslation("enterprise-security");
  const [open, setOpen] = useState(false),
    [entry, setEntry] = useState<IdentityAcceptedV1>(),
    [activation, setActivation] = useState<IdentityEmergencyActivationV1>();
  const [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [reason, setReason] = useState("");
  const [pending, setPending] = useState(false),
    [error, setError] = useState(false),
    [expired, setExpired] = useState(false);
  const controller = useRef<AbortController>(new AbortController());
  const retry = useRef<((signal: AbortSignal) => Promise<void>) | undefined>(
    undefined,
  );
  const busy = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const client = identityEmergencyClient(flow, owner.identityHomeRegionId);
  const live = () => {
    fresh(flow.bootstrap.expiresAt);
    fresh(flow.bootstrap.emergencyEntry?.expiresAt ?? "");
    fresh(flow.catalog.projection.expiresAt);
    if (entry) fresh(entry.expiresAt);
    if (activation) fresh(activation.expiresAt);
  };
  useEffect(() => {
    const current = new AbortController();
    controller.current = current;
    const scrub = () => {
      current.abort();
      retry.current = undefined;
      busy.current = false;
      setPassword("");
      setCode("");
      setReason("");
      setEntry(undefined);
      setActivation(undefined);
      setUncertain(false);
      setExpired(true);
    };
    window.addEventListener("pagehide", scrub);
    const restored = () => scrub();
    window.addEventListener("pageshow", restored);
    return () => {
      current.abort();
      retry.current = undefined;
      window.removeEventListener("pagehide", scrub);
      window.removeEventListener("pageshow", restored);
    };
  }, [flow, owner]);
  useEffect(() => {
    const expiry = Math.min(
      Date.parse(flow.bootstrap.expiresAt),
      Date.parse(flow.bootstrap.emergencyEntry?.expiresAt ?? ""),
      Date.parse(flow.catalog.projection.expiresAt),
      entry ? Date.parse(entry.expiresAt) : Infinity,
      activation ? Date.parse(activation.expiresAt) : Infinity,
    );
    const expire = () => {
      controller.current.abort();
      retry.current = undefined;
      setPassword("");
      setCode("");
      setReason("");
      setEntry(undefined);
      setActivation(undefined);
      setUncertain(false);
      setExpired(true);
    };
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      expire();
      return;
    }
    const timer = window.setTimeout(
      expire,
      Math.min(expiry - Date.now(), 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [flow, entry, activation]);
  async function run(
    task: (signal: AbortSignal) => Promise<void>,
    remembered = false,
  ) {
    if (busy.current || disabled || expired || (uncertain && !remembered))
      return;
    busy.current = true;
    setPending(true);
    setError(false);
    try {
      live();
      await task(controller.current.signal);
      controller.current.signal.throwIfAborted();
      retry.current = undefined;
      setUncertain(false);
    } catch (value) {
      if (!controller.current.signal.aborted) {
        setError(true);
        if (emergencyCommandWasDenied(value)) {
          retry.current = undefined;
          setUncertain(false);
          setEntry(undefined);
          setPassword("");
          setCode("");
        } else setUncertain(!!retry.current);
      }
    } finally {
      busy.current = false;
      if (!controller.current.signal.aborted) setPending(false);
    }
  }
  const blocked = disabled || pending || expired || uncertain;
  function begin() {
    const request = {
      schemaVersion: 1 as const,
      attemptId: randomUuid7(),
      targetTenantId: owner.targetTenantId,
      routeHint: email.trim().toLowerCase(),
    };
    const send = async (signal: AbortSignal) => {
      const result = await client.call(
        "identity.emergency.entry",
        request,
        request.attemptId,
        signal,
      );
      signal.throwIfAborted();
      fresh(result.expiresAt);
      if (!result.accepted) throw new Error("security.response.invalid");
      setEntry(result);
    };
    retry.current = send;
    void run(send);
  }
  function activate(passkey: boolean) {
    if (!entry || blocked || !reason.trim()) return;
    const continuationId = entry.continuationId,
      attemptId = randomUuid7(),
      recordedReason = reason.trim().normalize("NFC");
    const capturedPassword = password,
      capturedCode = code;
    setPassword("");
    setCode("");
    void run(async (signal) => {
      const ceremony = {
        schemaVersion: 1 as const,
        attemptId,
        continuationId,
        expectedCeremonyRevision: "1",
      };
      let localFactor: EmergencyLocalFactorProofV1;
      if (passkey) {
        const challenge = await client.call(
          "identity.passkey.assert",
          { kind: "start", ceremony },
          attemptId,
          signal,
        );
        if (
          challenge.kind !== "challenge" ||
          challenge.ceremonyId !== continuationId ||
          challenge.userVerification !== "required"
        )
          throw new Error("security.response.invalid");
        localFactor = {
          kind: "passkey",
          assertion: await passkeyBrowserAdapter.assert(challenge, signal),
        };
      } else
        localFactor = {
          kind: "password_totp",
          password: capturedPassword,
          code: capturedCode,
        };
      signal.throwIfAborted();
      live();
      const request = { ceremony, localFactor, reason: recordedReason };
      const send = async (retrySignal: AbortSignal) => {
        const result = await client.call(
          "identity.emergency.activate",
          request,
          attemptId,
          retrySignal,
        );
        retrySignal.throwIfAborted();
        fresh(result.expiresAt);
        if (
          result.attemptId !== attemptId ||
          result.continuationId !== continuationId ||
          result.targetTenantId !== owner.targetTenantId ||
          Date.parse(result.expiresAt) - Date.parse(result.startsAt) >
            3_600_000 ||
          Date.parse(result.expiresAt) <= Date.parse(result.startsAt)
        )
          throw new Error("security.response.invalid");
        if (
          (result.alertDelivery === "degraded" ||
            result.alertDelivery === "escalated") &&
          (!result.criticalIncidentId || !result.nextAlertAttemptAt)
        )
          throw new Error("security.response.invalid");
        setEntry(undefined);
        setActivation(result);
      };
      retry.current = send;
      await send(signal);
    });
  }
  return (
    <Stack>
      {!open ? (
        <Button
          label={t("emergency.entry")}
          variant="ghost"
          disabled={blocked}
          onClick={() => setOpen(true)}
        />
      ) : (
        <>
          <Text>{t("emergency.description")}</Text>
          {expired && <Text>{t("emergency.expired")}</Text>}
          {error && <Text>{t("emergency.unavailable")}</Text>}
          {uncertain && (
            <>
              <Text>{t("emergency.uncertain")}</Text>
              <Button
                label={t("actions.retry")}
                disabled={pending || expired || disabled}
                onClick={() => {
                  if (retry.current) void run(retry.current, true);
                }}
              />
            </>
          )}
          {!entry && !activation && (
            <Button
              label={t("emergency.begin")}
              disabled={blocked || !email.trim()}
              onClick={begin}
            />
          )}
          {entry && (
            <>
              <FormField
                id="emergency-reason"
                label={t("emergency.reason")}
                required
              >
                <Input
                  value={reason}
                  maxLength={500}
                  disabled={blocked}
                  onChange={setReason}
                />
              </FormField>
              <Button
                label={t("emergency.passkey")}
                disabled={blocked || !reason.trim()}
                onClick={() => activate(true)}
              />
              <FormField
                id="emergency-password"
                label={t("emergency.password")}
              >
                <PasswordInput
                  value={password}
                  disabled={blocked}
                  autoComplete="current-password"
                  toggleLabel={t("emergency.showPassword")}
                  onChange={(value) => {
                    const bounded = boundedPasswordInput(value);
                    if (bounded !== null) setPassword(bounded);
                  }}
                />
              </FormField>
              <FormField id="emergency-totp" label={t("emergency.totp")}>
                <Input
                  value={code}
                  disabled={blocked}
                  autoComplete="one-time-code"
                  maxLength={6}
                  onChange={(value) => {
                    if (/^\d{0,6}$/.test(value)) setCode(value);
                  }}
                />
              </FormField>
              <Button
                label={t("emergency.activate")}
                disabled={
                  blocked ||
                  !reason.trim() ||
                  !validPasswordInput(password) ||
                  !/^\d{6}$/.test(code)
                }
                onClick={() => activate(false)}
              />
            </>
          )}
          {activation && (
            <>
              <Text>
                {t("emergency.active", {
                  expiresAt: new Date(activation.expiresAt).toLocaleString(),
                })}
              </Text>
              <Text>{t("emergency.review")}</Text>
              <Text>{t(`emergency.delivery.${activation.alertDelivery}`)}</Text>
              {activation.nextAlertAttemptAt && (
                <Text>
                  {t("emergency.nextAlert", {
                    time: new Date(
                      activation.nextAlertAttemptAt,
                    ).toLocaleString(),
                  })}
                </Text>
              )}
              <Button
                label={t("actions.continue")}
                disabled={blocked}
                onClick={() =>
                  void run(async (signal) => {
                    live();
                    const uri = await owner.complete(flow, activation, signal);
                    signal.throwIfAborted();
                    live();
                    await navigate(uri);
                  })
                }
              />
            </>
          )}
        </>
      )}
    </Stack>
  );
}
