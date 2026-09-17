import { emergencyRoutes } from "./emergency-contract.generated";
import type {
  EmergencyRequestMap,
  EmergencyResponseMap,
} from "./emergency-contract.generated";
import type { SecurityApiErrorV1 } from "../contracts/generated/enterprise-security-v1/types/SecurityApiErrorV1";
import type { SecurityErrorV1 } from "../contracts/generated/enterprise-security-v1/types/SecurityErrorV1";
import { emergencyRequestValidators } from "./emergency-validators.generated";
import {
  decodeEmergencyError,
  decodeEmergencyResponse,
} from "./emergency-decode";

type IdentityOperation = keyof EmergencyRequestMap &
  keyof typeof emergencyRoutes;

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export interface PreparedEmergencyIdentityRequest<K extends IdentityOperation> {
  operation: K;
  operationId: string;
  path: string;
  method: "POST";
  body: string;
  contractHeaders: Record<string, string>;
  expectedStatus: 200;
}

export interface EmergencyIdentityWireRequest<
  K extends IdentityOperation,
> extends PreparedEmergencyIdentityRequest<K> {
  credentials: "include";
  redirect: "error";
}

export type EmergencyTransport = <K extends IdentityOperation>(
  request: EmergencyIdentityWireRequest<K>,
  signal: AbortSignal,
) => Promise<EmergencyWireResponse>;

export interface EmergencyWireResponse {
  status: number;
  contentType: string | null;
  body: string;
  headers: Readonly<Record<string, string | undefined>>;
}

const ERROR_STATUS: Readonly<Record<SecurityErrorV1["code"], number>> = {
  "security.assurance.required": 428,
  "security.assurance.phishing_resistance_required": 428,
  "security.assurance.recent_authentication_required": 428,
  "security.ceremony.expired": 410,
  "security.ceremony.mismatch": 400,
  "security.method.disabled": 403,
  "security.provider.unavailable": 503,
  "security.provider.not_ready": 409,
  "security.policy.changed": 409,
  "security.route.retry": 421,
  "security.recovery.limited": 403,
  "security.owner.unavailable": 503,
  "security.operation.partial_result": 409,
  "security.operation.conflict": 409,
  "security.emergency.not_ready": 409,
  "security.request.invalid": 400,
  "security.request.unauthorized": 401,
  "security.request.forbidden": 403,
  "security.request.rate_limited": 429,
  "security.dependency.unavailable": 503,
};

type FailureProfile =
  (typeof emergencyRoutes)[keyof typeof emergencyRoutes]["failureProfile"];

const PUBLIC_CEREMONY_FORBIDDEN = new Set<SecurityErrorV1["code"]>([
  "security.operation.conflict",
  "security.operation.partial_result",
  "security.policy.changed",
  "security.provider.not_ready",
  "security.emergency.not_ready",
  "security.route.retry",
]);

const ANONYMOUS_ENTRY_OPERATIONS = new Set<IdentityOperation>([
  "identity.emergency.entry",
]);

const ANONYMOUS_ENTRY_FAILURES = new Set<SecurityErrorV1["code"]>([
  "security.request.invalid",
  "security.ceremony.mismatch",
  "security.request.rate_limited",
  "security.provider.unavailable",
  "security.dependency.unavailable",
]);

function failureProfileAdmits(
  operation: IdentityOperation,
  profile: FailureProfile,
  code: SecurityErrorV1["code"],
): boolean {
  if (ANONYMOUS_ENTRY_OPERATIONS.has(operation)) {
    return ANONYMOUS_ENTRY_FAILURES.has(code);
  }
  return profile === "public_ceremony" && !PUBLIC_CEREMONY_FORBIDDEN.has(code);
}

function responseHeader(
  headers: Readonly<Record<string, string | undefined>>,
  name: string,
): string | undefined {
  const matches = Object.entries(headers).filter(
    ([key]) => key.toLowerCase() === name,
  );
  if (matches.length > 1) throw new Error("Invalid Plan 08 response headers");
  const value = matches[0]?.[1];
  if (value !== undefined && typeof value !== "string") {
    throw new Error("Invalid Plan 08 response headers");
  }
  return value;
}

function retryAfterSeconds(error: SecurityErrorV1): number | undefined {
  switch (error.code) {
    case "security.request.rate_limited":
    case "security.owner.unavailable":
    case "security.dependency.unavailable":
      return error.detail.retryAfterSeconds;
    default:
      return undefined;
  }
}

function validateRetryAfter(
  headers: Readonly<Record<string, string | undefined>>,
  envelope?: SecurityApiErrorV1,
): void {
  const header = responseHeader(headers, "retry-after");
  const seconds =
    envelope === undefined ? undefined : retryAfterSeconds(envelope.error);
  if (seconds === undefined) {
    if (header !== undefined) throw new Error("Invalid Plan 08 Retry-After");
    return;
  }
  if (
    !Number.isInteger(seconds) ||
    seconds < 1 ||
    seconds > 300 ||
    header !== String(seconds)
  ) {
    throw new Error("Invalid Plan 08 Retry-After");
  }
}

export class EmergencyHttpError extends Error {
  constructor(
    readonly status: number,
    readonly envelope: SecurityApiErrorV1,
  ) {
    super(envelope.error.code);
    this.name = "EmergencyHttpError";
  }
}

/** Unknown failures retain the original command until explicit reconciliation. */
export function emergencyCommandWasDenied(error: unknown): boolean {
  return (
    error instanceof EmergencyHttpError &&
    ![
      "security.request.rate_limited",
      "security.owner.unavailable",
      "security.dependency.unavailable",
      "security.provider.unavailable",
      "security.operation.partial_result",
      "security.route.retry",
    ].includes(error.envelope.error.code)
  );
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function boundMutationId(request: unknown): string | undefined {
  const root = record(request);
  if (!root) throw new Error("Invalid Plan 08 request");
  const guard = record(root.guard);
  const values = [
    root.mutationId,
    root.commandId,
    root.attemptId,
    guard?.mutationId,
    guard?.commandId,
    record(root.ceremony)?.attemptId,
  ].filter((value) => value !== undefined);
  if (
    values.some((value) => typeof value !== "string") ||
    new Set(values).size > 1
  ) {
    throw new Error("Invalid Plan 08 mutation binding");
  }
  return values[0] as string | undefined;
}

/** Builds only the EA-00H wire contract. The Plan 02 listener owner supplies
 * the cataloged identity origin, ceremony admission and actual transport. */
export function prepareEmergencyRequest<K extends IdentityOperation>(
  operation: K,
  request: EmergencyRequestMap[K],
  idempotencyKey?: string,
): PreparedEmergencyIdentityRequest<K> {
  if (!Object.hasOwn(emergencyRoutes, operation))
    throw new Error("Missing Plan 08 route");
  const route = emergencyRoutes[operation];
  const body = JSON.stringify(request);
  if (
    typeof body !== "string" ||
    new TextEncoder().encode(body).byteLength > route.maxRequestBytes
  ) {
    throw new Error("Invalid Plan 08 request size");
  }
  const wireValue: unknown = JSON.parse(body);
  const validator = emergencyRequestValidators[operation] as (
    input: unknown,
  ) => boolean;
  if (!validator(wireValue)) throw new Error("Invalid Plan 08 request");
  const boundId = boundMutationId(wireValue);
  if (route.idempotency === "required_header") {
    if (
      !idempotencyKey ||
      !UUID_V7.test(idempotencyKey) ||
      (boundId && boundId !== idempotencyKey)
    ) {
      throw new Error("Invalid Plan 08 idempotency binding");
    }
  } else if (idempotencyKey !== undefined || boundId !== undefined) {
    throw new Error("Unexpected Plan 08 idempotency binding");
  }
  const contractHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (idempotencyKey) contractHeaders["Idempotency-Key"] = idempotencyKey;
  return {
    operation,
    operationId: route.operationId,
    path: route.path,
    method: "POST",
    body,
    contractHeaders,
    expectedStatus: 200,
  };
}

/** Executes against a transport already pinned to the signed catalog's regional
 * identity origin. This layer cannot establish an account or product session. */
export async function executeEmergencyRequest<K extends IdentityOperation>(
  transport: EmergencyTransport,
  operation: K,
  request: EmergencyRequestMap[K],
  idempotencyKey: string | undefined,
  signal: AbortSignal,
): Promise<EmergencyResponseMap[K]> {
  const prepared = prepareEmergencyRequest(operation, request, idempotencyKey);
  const response = await transport(
    { ...prepared, credentials: "include", redirect: "error" },
    signal,
  );
  if (
    response.contentType?.split(";", 1)[0]?.trim().toLowerCase() !==
    "application/json"
  ) {
    throw new Error("Invalid Plan 08 response media type");
  }
  if (
    !responseHeader(response.headers, "cache-control")
      ?.split(",")
      .map((v) => v.trim().toLowerCase())
      .includes("no-store")
  )
    throw new Error("Invalid emergency cache policy");
  signal.throwIfAborted();
  if (response.status === prepared.expectedStatus) {
    validateRetryAfter(response.headers);
    const result = decodeEmergencyResponse(operation, response.body);
    if (operation === "identity.emergency.activate") {
      const command =
        request as EmergencyRequestMap["identity.emergency.activate"];
      const activation =
        result as EmergencyResponseMap["identity.emergency.activate"];
      if (
        activation.attemptId !== command.ceremony.attemptId ||
        activation.continuationId !== command.ceremony.continuationId ||
        Date.parse(activation.expiresAt) <= Date.parse(activation.startsAt) ||
        Date.parse(activation.expiresAt) - Date.parse(activation.startsAt) >
          3_600_000 ||
        ((activation.alertDelivery === "degraded" ||
          activation.alertDelivery === "escalated") &&
          (!activation.criticalIncidentId || !activation.nextAlertAttemptAt))
      )
        throw new Error("Invalid emergency response binding");
    }
    return result;
  }
  const envelope = decodeEmergencyError(response.body);
  if (ERROR_STATUS[envelope.error.code] !== response.status) {
    throw new Error("Invalid Plan 08 error status");
  }
  if (
    !failureProfileAdmits(
      operation,
      emergencyRoutes[operation].failureProfile,
      envelope.error.code,
    )
  ) {
    throw new Error("Invalid Plan 08 failure profile");
  }
  validateRetryAfter(response.headers, envelope);
  throw new EmergencyHttpError(response.status, envelope);
}
