import { expect, it, vi } from "vitest";
import {
  prepareEmergencyRequest,
  executeEmergencyRequest,
  EmergencyHttpError,
  emergencyCommandWasDenied,
  type EmergencyTransport,
} from "./emergency-contract";
import { decodeEmergencyResponse } from "./emergency-decode";
import { emergencyRoutes } from "./emergency-contract.generated";
const id = "01994000-0000-7000-8000-000000000001",
  tenant = "01994000-0000-7000-8000-000000000002";
const entry = {
  schemaVersion: 1 as const,
  attemptId: id,
  targetTenantId: tenant,
  routeHint: "admin@example.com",
};
const activation = {
  ceremony: {
    schemaVersion: 1 as const,
    attemptId: id,
    continuationId: tenant,
    expectedCeremonyRevision: "1",
  },
  localFactor: {
    kind: "password_totp" as const,
    password: "fresh secret",
    code: "123456",
  },
  reason: "Recover provider configuration",
};
const accepted = {
  schemaVersion: 1,
  accepted: true,
  continuationId: tenant,
  expiresAt: "2027-01-01T00:00:00Z",
};
const signal = new AbortController().signal;
it("uses the exact three admitted identity routes and binds both request IDs", () => {
  expect(Object.keys(emergencyRoutes)).toHaveLength(3);
  expect(
    prepareEmergencyRequest("identity.emergency.entry", entry, id),
  ).toMatchObject({
    path: "/api/auth/v1/security/identity/emergency/entry",
    body: JSON.stringify(entry),
    contractHeaders: { "Idempotency-Key": id },
  });
  expect(() =>
    prepareEmergencyRequest("identity.emergency.entry", entry, tenant),
  ).toThrow();
  expect(() =>
    prepareEmergencyRequest(
      "identity.emergency.activate",
      { ...activation, expectedAssignmentRevision: "1" } as never,
      id,
    ),
  ).toThrow();
  expect(() =>
    prepareEmergencyRequest(
      "identity.emergency.activate",
      { ...activation, localFactor: { kind: "totp", code: "123456" } } as never,
      id,
    ),
  ).toThrow();
  expect(() =>
    prepareEmergencyRequest(
      "identity.emergency.activate",
      { ...activation, reason: "" } as never,
      id,
    ),
  ).toThrow();
});
it("rejects duplicate, oversized and noncanonical accepted payloads", () => {
  expect(
    decodeEmergencyResponse(
      "identity.emergency.entry",
      JSON.stringify(accepted),
    ),
  ).toEqual(accepted);
  expect(() =>
    decodeEmergencyResponse(
      "identity.emergency.entry",
      '{"accepted":true,"accepted":false}',
    ),
  ).toThrow();
  expect(() =>
    decodeEmergencyResponse(
      "identity.emergency.entry",
      JSON.stringify({ ...accepted, userId: id }),
    ),
  ).toThrow();
  expect(() =>
    decodeEmergencyResponse("identity.emergency.entry", " ".repeat(20000)),
  ).toThrow();
});
it("requires no-store and closed status/profile/Retry-After responses", async () => {
  const respond = vi.fn(async () => ({
    status: 200,
    contentType: "application/json",
    headers: { "cache-control": "no-store" },
    body: JSON.stringify(accepted),
  }));
  expect(
    await executeEmergencyRequest(
      respond as EmergencyTransport,
      "identity.emergency.entry",
      entry,
      id,
      signal,
    ),
  ).toEqual(accepted);
  const error = {
    schemaVersion: 1,
    correlationId: id,
    error: {
      code: "security.dependency.unavailable",
      detail: { retryAfterSeconds: 1 },
    },
  };
  const failure = (status = 503, seconds = "1") =>
    (async () => ({
      status,
      contentType: "application/json",
      headers: { "cache-control": "no-store", "retry-after": seconds },
      body: JSON.stringify(error),
    })) as EmergencyTransport;
  await expect(
    executeEmergencyRequest(
      failure(),
      "identity.emergency.entry",
      entry,
      id,
      signal,
    ),
  ).rejects.toBeInstanceOf(EmergencyHttpError);
  await expect(
    executeEmergencyRequest(
      failure(400),
      "identity.emergency.entry",
      entry,
      id,
      signal,
    ),
  ).rejects.not.toBeInstanceOf(EmergencyHttpError);
  await expect(
    executeEmergencyRequest(
      failure(503, "2"),
      "identity.emergency.entry",
      entry,
      id,
      signal,
    ),
  ).rejects.not.toBeInstanceOf(EmergencyHttpError);
  expect(
    emergencyCommandWasDenied(new EmergencyHttpError(503, error as never)),
  ).toBe(false);
  expect(emergencyCommandWasDenied(new Error("Network result unknown"))).toBe(
    false,
  );
});

it("correlates attempts and continuations separately from the native activation UUID", async () => {
  const result = {
    schemaVersion: 1,
    attemptId: id,
    continuationId: tenant,
    activationId: tenant,
    targetTenantId: tenant,
    startsAt: "2026-09-15T00:00:00Z",
    expiresAt: "2026-09-15T01:00:00Z",
    reviewId: id,
    alertDelivery: "pending",
    criticalIncidentId: null,
    nextAlertAttemptAt: null,
    alertDeliveryOperation: {
      operationId: id,
      state: "queued",
      revision: "1",
      acceptedAt: "2026-09-15T00:00:00Z",
      nextPollAfterSeconds: 1,
    },
  };
  const transport = (value: unknown) =>
    (async () => ({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(value),
    })) as EmergencyTransport;
  expect(
    await executeEmergencyRequest(
      transport(result),
      "identity.emergency.activate",
      activation,
      id,
      signal,
    ),
  ).toEqual(result);
  for (const wrong of [
    { ...result, attemptId: tenant },
    { ...result, continuationId: id },
    { ...result, expiresAt: "2026-09-15T02:00:00Z" },
    { ...result, alertDelivery: "degraded" },
  ])
    await expect(
      executeEmergencyRequest(
        transport(wrong),
        "identity.emergency.activate",
        activation,
        id,
        signal,
      ),
    ).rejects.toThrow();
});
