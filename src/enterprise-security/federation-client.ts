import { saveFederationReturn, clearIdentityFlowResume } from '../security/session-receipts'
import { cachedRealmSocialAuthorization, currentFederationAuthorization, currentRealmSocialAuthorization, prepareFederationAttempt, type IdentityFlow } from '../protocol/client'
import { identityApiForRegion } from '../catalog/boundaries'
import type { FederationRequestMap, FederationResponseMap } from '../contracts/generated/enterprise-security-v1/federation-operations.generated'
import { federationRoutes } from '../contracts/generated/enterprise-security-v1/federation-routes.generated'
import { executeFederationRequest, type FederationTransport, type FederationWireResponse } from './federation-contract'
import { socialProviderNavigation } from './federation-decode'
import type { IdentitySocialStartV1 } from '../contracts/generated/enterprise-security-v1/types/IdentitySocialStartV1'

export type FederationOperation = keyof FederationRequestMap
export interface FederationClient {
  call<K extends FederationOperation>(operation: K, request: FederationRequestMap[K], commandId: string | undefined, signal: AbortSignal): Promise<FederationResponseMap[K]>
}
const SOCIAL_CALLBACK_PATH = '/api/auth/v1/security/identity/social/callback'

export function assertSocialStartDestination(result: IdentitySocialStartV1, identityOrigin: string): void {
  const expectedRedirectUri = new URL(SOCIAL_CALLBACK_PATH, identityOrigin).href
  if (!socialProviderNavigation(result.navigationUri, result.provider, expectedRedirectUri)) throw new Error('security.ceremony.mismatch')
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
export function identityFederationClient(flow: IdentityFlow, regionId = flow.bootstrap.initialRegionId): FederationClient {
  const origin = identityApiForRegion(flow.catalog, regionId).origin
  const transport: FederationTransport = async (request, signal): Promise<FederationWireResponse> => {
    const route = federationRoutes[request.operation]
    if (route.surface !== 'regional_identity') throw new Error('Wrong federation surface')
    if (signal.aborted) throw signal.reason
    let authorization: string | null
    if (request.operation === 'identity.methods.resolve') {
      const input: unknown = JSON.parse(request.body)
      if (input === null || typeof input !== 'object' || !('routeHint' in input) || (input.routeHint !== null && typeof input.routeHint !== 'string')) throw new Error('Invalid method resolution')
      // Realm social choices are email-independent. Only an actual email hint
      // needs the existing route preparation and its normalized-email checks.
      if (typeof input.routeHint === 'string') {
        await prepareFederationAttempt(flow, input.routeHint)
        authorization = await currentFederationAuthorization(flow)
      } else {
        authorization = await currentRealmSocialAuthorization(flow, signal)
      }
    } else if (request.operation === 'identity.social.start') {
      authorization = cachedRealmSocialAuthorization(flow) ?? (await currentFederationAuthorization(flow)) ?? (await currentRealmSocialAuthorization(flow, signal))
    } else {
      authorization = await currentFederationAuthorization(flow)
    }
    if (authorization === null) throw new Error('Federation flow is unavailable')
    if (signal.aborted) throw signal.reason
    if (request.operation === 'identity.federation.callback') {
      const input = JSON.parse(request.body) as FederationRequestMap['identity.federation.callback']
      if (input.proof.kind === 'saml_handoff_continue') {
        // Persist safe identifiers before the explicitly requested command.
        // Recovery can read an existing confirmed journal; it cannot confirm
        // an assertion whose command never reached its owner.
        saveFederationReturn({
          kind: 'federationReturn',
          projection: flow.bootstrap.authProjectionId,
          controller: flow.head.placement.controllerRegionId,
          catalog: flow.bootstrap.catalogVersion,
          digest: flow.bootstrap.catalogDigest,
          flow: flow.bootstrap.flowId,
          attempt: input.callbackId,
          provider: input.providerId,
          issuer: regionId,
        })
      }
    }
    const response = await fetch(new URL(request.path, origin), {
      method: request.method,
      body: request.body,
      credentials: 'include',
      redirect: 'error',
      mode: 'cors',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
      headers: {
        ...request.contractHeaders,
        'X-Metamorph-CSRF': flow.bootstrap.csrfToken,
        'X-Metamorph-Federation-Authorization': authorization,
      },
    })
    const body = await boundedText(response, Math.max(route.maxResponseBytes, 16 * 1024))
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      body,
      headers: {
        'retry-after': response.headers.get('retry-after') ?? undefined,
      },
    }
  }
  return {
    call: async (operation, request, commandId, signal) => {
      const result = await executeFederationRequest(transport, operation, request, commandId, signal)
      if (operation === 'identity.social.start') {
        assertSocialStartDestination(result as FederationResponseMap['identity.social.start'], origin)
      }
      if (operation === 'identity.federation.callback') {
        const input = request as FederationRequestMap['identity.federation.callback']
        const output = result as FederationResponseMap['identity.federation.callback']
        if (input.proof.kind === 'saml_handoff_continue') {
          if (output.progress.continuationId !== input.callbackId) throw new Error('security.ceremony.mismatch')
          clearIdentityFlowResume()
        }
      }
      return result
    },
  }
}
export function transportedFederationClient(transport: FederationTransport): FederationClient {
  return {
    call: (operation, request, commandId, signal) => executeFederationRequest(transport, operation, request, commandId, signal),
  }
}
