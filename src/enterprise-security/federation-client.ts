import type { IdentityFlow } from '../protocol/client'
import { identityApiForRegion } from '../catalog/boundaries'
import type {
  FederationRequestMap,
  FederationResponseMap,
} from '../contracts/generated/enterprise-security-v1/federation-operations.generated'
import { federationRoutes } from '../contracts/generated/enterprise-security-v1/federation-routes.generated'
import {
  executeFederationRequest,
  type FederationTransport,
  type FederationWireResponse,
} from './federation-contract'

export type FederationOperation = keyof FederationRequestMap
export interface FederationClient {
  call<K extends FederationOperation>(
    operation: K,
    request: FederationRequestMap[K],
    commandId: string | undefined,
    signal: AbortSignal,
  ): Promise<FederationResponseMap[K]>
}
async function boundedText(response: Response, maximum: number): Promise<string> {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maximum) throw new Error('security.response.invalid')
  if (response.body === null) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      bytes += part.value.byteLength
      if (bytes > maximum) throw new Error('security.response.invalid')
      chunks.push(part.value)
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined)
    throw error
  }
  const all = new Uint8Array(bytes)
  let offset = 0
  for (const part of chunks) {
    all.set(part, offset)
    offset += part.byteLength
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(all)
}
/** Pin transport to the already verified catalog. Region hints never grant
 * authority, forward cookies, retry mutations, or change the original command. */
export function identityFederationClient(
  flow: IdentityFlow,
  regionId = flow.bootstrap.initialRegionId,
): FederationClient {
  const origin = identityApiForRegion(flow.catalog, regionId).origin
  const transport: FederationTransport = async (
    request,
    signal,
  ): Promise<FederationWireResponse> => {
    const route = federationRoutes[request.operation]
    if (route.surface !== 'regional_identity') throw new Error('Wrong federation surface')
    if (signal.aborted) throw signal.reason
    const response = await fetch(new URL(request.path, origin), {
      method: request.method,
      body: request.body,
      credentials: 'include',
      redirect: 'error',
      mode: 'cors',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
      headers: { ...request.contractHeaders, 'X-Metamorph-CSRF': flow.bootstrap.csrfToken },
    })
    const body = await boundedText(response, Math.max(route.maxResponseBytes, 16 * 1024))
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      body,
      headers: { 'retry-after': response.headers.get('retry-after') ?? undefined },
    }
  }
  return {
    call: (operation, request, commandId, signal) =>
      executeFederationRequest(transport, operation, request, commandId, signal),
  }
}
export function transportedFederationClient(transport: FederationTransport): FederationClient {
  return {
    call: (operation, request, commandId, signal) =>
      executeFederationRequest(transport, operation, request, commandId, signal),
  }
}
