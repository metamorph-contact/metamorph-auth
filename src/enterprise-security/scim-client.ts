import { decodeBoundedJsonText } from '../contracts/decode'
import type { AuthApi } from '../protocol/http'
import {
  scimIdentityContracts,
  type ScimIdentityOperations,
} from './scim-contract.generated'
import { scim_error } from './scim-validators.generated'
import type { SecurityApiErrorV1 } from '../contracts/generated/enterprise-security-v1/types/SecurityApiErrorV1'

export class ScimIdentityError extends Error {
  constructor(
    readonly retryable: boolean,
    readonly retryAfterSeconds = 5,
  ) {
    super('SCIM activation unavailable')
  }
}

/** Public protected ceremonies use the catalog endpoint and no browser session. */
export class ScimIdentityClient {
  constructor(private readonly api: AuthApi) {}
  async call<K extends keyof ScimIdentityOperations>(
    operation: K,
    request: ScimIdentityOperations[K]['request'],
    mutationId: string,
    signal: AbortSignal,
  ): Promise<ScimIdentityOperations[K]['response']> {
    signal.throwIfAborted()
    const contract = scimIdentityContracts[operation]
    if (
      !contract?.request(request) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(
        mutationId,
      )
    )
      throw new ScimIdentityError(false)
    const body = JSON.stringify(request)
    if (new TextEncoder().encode(body).byteLength > contract.maxRequestBytes)
      throw new ScimIdentityError(false)
    let response: Response
    try {
      response = await fetch(new URL(contract.path, this.api.origin), {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': mutationId,
        },
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
      })
    } catch {
      signal.throwIfAborted()
      throw new ScimIdentityError(true)
    }
    const reader = response.body?.getReader()
    if (!reader) throw new ScimIdentityError(true)
    const chunks: Uint8Array[] = []
    let size = 0
    const maximum = response.status === 200 ? contract.maxResponseBytes : 16_384
    try {
      for (;;) {
        const { done, value } = await reader.read()
        signal.throwIfAborted()
        if (done) break
        size += value.byteLength
        if (size > maximum) throw new ScimIdentityError(true)
        chunks.push(value)
      }
    } catch {
      signal.throwIfAborted()
      throw new ScimIdentityError(true)
    } finally {
      await reader.cancel().catch(() => undefined)
      reader.releaseLock()
    }
    signal.throwIfAborted()
    if (
      response.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase() !== 'application/json' ||
      !response.headers
        .get('cache-control')
        ?.split(',')
        .some((v) => v.trim().toLowerCase() === 'no-store') ||
      response.headers.get('x-content-type-options')?.toLowerCase() !==
        'nosniff'
    )
      throw new ScimIdentityError(true)
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.length
    }
    let value: unknown
    try {
      value = decodeBoundedJsonText(
        new TextDecoder('utf-8', { fatal: true }).decode(bytes),
        maximum,
      )
    } catch {
      throw new ScimIdentityError(true)
    }
    if (response.status !== 200) {
      if (!scim_error(value)) throw new ScimIdentityError(true)
      const error = (value as SecurityApiErrorV1).error
      const retryable =
        (response.status === 503 &&
          error.code === 'security.owner.unavailable') ||
        (response.status === 429 &&
          error.code === 'security.request.rate_limited')
      const seconds =
        retryable && 'detail' in error && 'retryAfterSeconds' in error.detail
          ? error.detail.retryAfterSeconds
          : 5
      if (retryable && response.headers.get('retry-after') !== String(seconds))
        throw new ScimIdentityError(true)
      throw new ScimIdentityError(retryable, seconds)
    }
    if (!contract.response(value)) throw new ScimIdentityError(true)
    const result = value as unknown as Record<string, unknown>
    const ceremony =
      'ceremony' in request ? request.ceremony : request.activation.ceremony
    const progress = (result.progress ?? result) as Record<string, unknown>
    if (
      progress.continuationId !== ceremony.continuationId ||
      ('nextStep' in progress &&
        (progress.nextStep !== 'pending_provisioning' ||
          progress.subjectReproof !== null))
    )
      throw new ScimIdentityError(true)
    if ('completion' in result) {
      const completion =
        result.completion as ScimIdentityOperations['identity.scim.primary_email.verify']['response']['completion']
      if (
        completion.activation.ceremony.attemptId !== ceremony.attemptId ||
        completion.activation.ceremony.continuationId !==
          ceremony.continuationId ||
        completion.activation.ceremony.expectedCeremonyRevision !==
          progress.ceremonyRevision ||
        completion.completionCapability ===
          ('startCapability' in request ? request.startCapability : '')
      )
        throw new ScimIdentityError(true)
    }
    return value as ScimIdentityOperations[K]['response']
  }
}
