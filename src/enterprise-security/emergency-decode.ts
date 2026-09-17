import { decodeBoundedJsonText } from "../contracts/decode";
import { emergencyRoutes } from "./emergency-contract.generated";
import type { EmergencyResponseMap } from "./emergency-contract.generated";
import { emergencyResponseValidators } from "./emergency-validators.generated";
import type { SecurityApiErrorV1 } from "../contracts/generated/enterprise-security-v1/types/SecurityApiErrorV1";

type ResponseValidator = (input: unknown) => boolean;
const validators = emergencyResponseValidators as unknown as Readonly<
  Record<string, ResponseValidator>
>;

function validatorFor(name: string): ResponseValidator {
  if (!Object.hasOwn(validators, name))
    throw new Error("Missing Plan 08 response schema");
  const validator = validators[name];
  return validator;
}

function decode(name: string, text: string, maxBytes: number): unknown {
  const value = decodeBoundedJsonText(text, maxBytes);
  if (!validatorFor(name)(value)) throw new Error("Invalid Plan 08 response");

  return value;
}

export function decodeEmergencyResponse<K extends keyof EmergencyResponseMap>(
  operation: K,
  text: string,
): EmergencyResponseMap[K] {
  if (!Object.hasOwn(emergencyRoutes, operation))
    throw new Error("Missing Plan 08 route");
  return decode(
    operation,
    text,
    emergencyRoutes[operation].maxResponseBytes,
  ) as EmergencyResponseMap[K];
}

export function decodeEmergencyError(text: string): SecurityApiErrorV1 {
  return decode("error", text, 16 * 1024) as SecurityApiErrorV1;
}
