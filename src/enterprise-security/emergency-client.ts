import type { IdentityFlow } from "../protocol/client";
import { identityApiForRegion } from "../catalog/boundaries";
import type {
  EmergencyRequestMap,
  EmergencyResponseMap,
} from "./emergency-contract.generated";
import { emergencyRoutes } from "./emergency-contract.generated";
import {
  executeEmergencyRequest,
  type EmergencyTransport,
  type EmergencyWireResponse,
} from "./emergency-contract";

export type EmergencyOperation = keyof EmergencyRequestMap;
export interface EmergencyClient {
  call<K extends EmergencyOperation>(
    operation: K,
    request: EmergencyRequestMap[K],
    commandId: string | undefined,
    signal: AbortSignal,
  ): Promise<EmergencyResponseMap[K]>;
}
async function boundedText(
  response: Response,
  maximum: number,
): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maximum)
    throw new Error("security.response.invalid");
  if (response.body === null) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maximum) throw new Error("security.response.invalid");
      chunks.push(part.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  const all = new Uint8Array(bytes);
  let offset = 0;
  for (const part of chunks) {
    all.set(part, offset);
    offset += part.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(all);
}
/** Pin transport to the already verified catalog. Region hints never grant
 * authority, forward cookies, retry mutations, or change the original command. */
export function identityEmergencyClient(
  flow: IdentityFlow,
  regionId = flow.bootstrap.initialRegionId,
): EmergencyClient {
  const origin = identityApiForRegion(flow.catalog, regionId).origin;
  const transport: EmergencyTransport = async (
    request,
    signal,
  ): Promise<EmergencyWireResponse> => {
    const route = emergencyRoutes[request.operation];
    if (route.surface !== "regional_identity")
      throw new Error("Wrong emergency surface");
    if (signal.aborted) throw signal.reason;
    const response = await fetch(new URL(request.path, origin), {
      method: request.method,
      body: request.body,
      credentials: "include",
      redirect: "error",
      mode: "cors",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
      headers: {
        ...request.contractHeaders,
        "X-Metamorph-CSRF": flow.bootstrap.csrfToken,
      },
    });
    const body = await boundedText(
      response,
      Math.max(route.maxResponseBytes, 16 * 1024),
    );
    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body,
      headers: {
        "retry-after": response.headers.get("retry-after") ?? undefined,
        "cache-control": response.headers.get("cache-control") ?? undefined,
      },
    };
  };
  return {
    call: (operation, request, commandId, signal) =>
      executeEmergencyRequest(transport, operation, request, commandId, signal),
  };
}
export function transportedEmergencyClient(
  transport: EmergencyTransport,
): EmergencyClient {
  return {
    call: (operation, request, commandId, signal) =>
      executeEmergencyRequest(transport, operation, request, commandId, signal),
  };
}
