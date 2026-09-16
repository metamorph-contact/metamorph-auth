import { admittedIdentityApi } from '../catalog/boundaries'
import type { StrongActionDelegationRequestV1 } from '../contracts/generated/csi07/StrongActionDelegationRequestV1'
import type { StrongActionDelegationResultV1 } from '../contracts/generated/csi07/StrongActionDelegationResultV1'
import type { IdentityStepUpCompleteRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityStepUpCompleteRequestV1'
import type { IdentityStepUpResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityStepUpResultV1'
import type { IdentityStepUpStartRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityStepUpStartRequestV1'
import type { IdentityStepUpStartResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityStepUpStartResultV1'
import type { IdentityFlow } from '../protocol/client'
import { executePlan03IdentityRequest, type Plan03IdentityTransport, type Plan03WireResponse } from './request-contract'

const MAX_RESPONSE_BYTES = 64 * 1024

export interface StrongActionIdentityClient {
  start(request: IdentityStepUpStartRequestV1, signal: AbortSignal): Promise<IdentityStepUpStartResultV1>
  complete(request: IdentityStepUpCompleteRequestV1, signal: AbortSignal): Promise<IdentityStepUpResultV1>
  dispose(): void
}

interface HeldDelegation {
  readonly value: StrongActionDelegationResultV1
  readonly expiresAt: number
}

/** Owns the short-lived C-to-H delegation for one selected account. Bearers
 * stay in memory, are scoped by attempt, and are cleared on page exit. */
export function strongActionIdentityClient(
  flow: IdentityFlow,
  browserAccountId: string,
): StrongActionIdentityClient {
  const held = new Map<string, HeldDelegation>()
  const lifetime = new AbortController()
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    lifetime.abort()
    held.clear()
    window.removeEventListener('pagehide', dispose)
  }
  window.addEventListener('pagehide', dispose, { once: true })

  async function delegate(
    request: IdentityStepUpStartRequestV1,
    signal: AbortSignal,
  ): Promise<HeldDelegation> {
    const admittedSignal = AbortSignal.any([signal, lifetime.signal])
    admittedSignal.throwIfAborted()
    if (disposed) throw new Error('security.ceremony.expired')
    const input: StrongActionDelegationRequestV1 = {
      schemaVersion: 1,
      head: {
        browserHeadId: flow.head.browserHeadId,
        browserInitializationId: flow.head.browserInitializationId,
        placement: flow.head.placement,
      },
      browserAccountId,
      attemptId: request.attemptId,
      operationKey: request.operationKey,
      targetDigest: hexDigestToBase64Url(request.targetDigest),
    }
    let value: StrongActionDelegationResultV1
    try {
      value = await flow.controller.post<
        StrongActionDelegationRequestV1,
        StrongActionDelegationResultV1
      >('/api/auth/v1/strong-action-delegations', input, 'strongActionDelegation', undefined, {}, admittedSignal)
    } catch (error) {
      admittedSignal.throwIfAborted()
      throw error
    }
    admittedSignal.throwIfAborted()
    if (disposed) throw new Error('security.ceremony.expired')
    const expiresAt = Date.parse(value.expiresAt)
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || expiresAt > Date.now() + 90_000) {
      throw new Error('security.ceremony.expired')
    }
    admittedIdentityApi(flow.catalog, value.identityApiOrigin)
    return { value, expiresAt }
  }

  function transport(delegation: HeldDelegation): Plan03IdentityTransport {
    const origin = admittedIdentityApi(flow.catalog, delegation.value.identityApiOrigin).origin
    return async (request, signal): Promise<Plan03WireResponse> => {
      if (disposed || delegation.expiresAt <= Date.now()) throw new Error('security.ceremony.expired')
      const response = await fetch(new URL(request.path, origin), {
        method: request.method,
        body: request.body,
        credentials: 'omit',
        redirect: 'error',
        mode: 'cors',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.any([signal, lifetime.signal, AbortSignal.timeout(20_000)]),
        headers: {
          ...request.contractHeaders,
          'X-Metamorph-CSRF': delegation.value.csrf,
          'X-Metamorph-Strong-Action': delegation.value.capability,
        },
      })
      return {
        status: response.status,
        contentType: response.headers.get('content-type'),
        body: await boundedText(response),
        headers: { 'retry-after': response.headers.get('retry-after') ?? undefined },
      }
    }
  }

  return {
    async start(request, signal) {
      const delegation = await delegate(request, signal)
      const result = await executePlan03IdentityRequest(
        transport(delegation),
        'identity.step_up.start',
        request,
        request.attemptId,
        AbortSignal.any([signal, lifetime.signal]),
      )
      if (disposed) throw new Error('security.ceremony.expired')
      if (result.progress.continuationId.length === 0) throw new Error('security.ceremony.mismatch')
      held.set(result.progress.continuationId, delegation)
      return result
    },
    async complete(request, signal) {
      const key = request.ceremony.continuationId
      const delegation = held.get(key)
      if (delegation === undefined || delegation.expiresAt <= Date.now()) {
        held.delete(key)
        throw new Error('security.ceremony.expired')
      }
      const result = await executePlan03IdentityRequest(
        transport(delegation),
        'identity.step_up.complete',
        request,
        request.mutationId,
        AbortSignal.any([signal, lifetime.signal]),
      )
      if (disposed) throw new Error('security.ceremony.expired')
      held.delete(key)
      return result
    },
    dispose,
  }
}

function hexDigestToBase64Url(value: string): string {
  if (!/^[0-9a-f]{64}$/u.test(value)) throw new Error('security.request.invalid')
  const bytes = new Uint8Array(32)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  }
  let raw = ''
  for (const byte of bytes) raw += String.fromCharCode(byte)
  return btoa(raw).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

export function base64UrlDigestToHex(value: string): string {
  if (!/^[A-Za-z0-9_-]{43}$/u.test(value)) throw new Error('security.request.invalid')
  const binary = atob(`${value.replaceAll('-', '+').replaceAll('_', '/')}=`)
  if (binary.length !== 32) throw new Error('security.request.invalid')
  const canonical = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
  if (canonical !== value) throw new Error('security.request.invalid')
  return Array.from(binary, (character) => character.charCodeAt(0).toString(16).padStart(2, '0')).join('')
}

async function boundedText(response: Response): Promise<string> {
  const declared = response.headers.get('content-length')
  if (declared !== null && (!/^\d+$/u.test(declared) || Number(declared) > MAX_RESPONSE_BYTES)) {
    throw new Error('security.response.invalid')
  }
  if (response.body === null) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      size += part.value.byteLength
      if (size > MAX_RESPONSE_BYTES) throw new Error('security.response.invalid')
      chunks.push(part.value)
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined)
    throw error
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
