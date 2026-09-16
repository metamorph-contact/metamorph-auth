import type { ProtocolErrorEnvelopeV1 } from '../contracts/generated/csi07/ProtocolErrorEnvelopeV1'
import type { RecoveryActionV1 } from '../contracts/generated/csi07/RecoveryActionV1'
import type { ProtocolErrorDetailsV1 } from '../contracts/generated/csi07/ProtocolErrorDetailsV1'
import { decodeProtocolResponse, type ResponseSchemaName } from './decode'

const MAX_RESPONSE_BYTES = 256 * 1024
const MAX_JSON_REQUEST_BYTES = 64 * 1024
// A 16-KiB password can JSON-escape to 96 KiB before protocol fields.
const MAX_PASSWORD_REQUEST_BYTES = 128 * 1024
const REQUEST_TIMEOUT_MS = 20_000

export class ProtocolError extends Error {
  readonly code: string
  readonly retryable: boolean
  readonly retryAfterSeconds?: number
  readonly recoveryAction?: RecoveryActionV1
  /** Strictly decoded machine details; never contains backend display prose. */
  readonly details?: ProtocolErrorDetailsV1 | Readonly<Record<string, unknown>>

  constructor(
    code: string,
    retryable = false,
    retryAfterSeconds?: number,
    recoveryAction?: RecoveryActionV1,
    details?: ProtocolErrorDetailsV1 | Readonly<Record<string, unknown>>,
  ) {
    super(code)
    this.name = 'ProtocolError'
    this.code = code
    this.retryable = retryable
    this.retryAfterSeconds = retryAfterSeconds
    this.recoveryAction = recoveryAction
    this.details = details
  }
}

function endpointAllows(path: string, code: string): boolean {
  const base = new Set(['auth.request.invalid', 'auth.origin.denied', 'auth.proof.invalid', 'auth.dependency.unavailable', 'auth.internal.invariant'])
  if (base.has(code)) return true
  if (path.includes('/browser-logout-operations') || path.includes('/account-session-logouts')) {
    return ['auth.product_session.invalid', 'auth.account_session.invalid', 'auth.logout.retry_required', 'auth.logout.failed'].includes(code)
  }
  if (path.includes('/flows/') || path.endsWith('/flows') || path.includes('/browser-anchors') || path.includes('/browser-logout-options')) {
    return ['auth.flow.expired', 'auth.flow.limit', 'auth.catalog.stale', 'auth.account.temporarily_unavailable', 'auth.account_session.invalid', 'auth.account_establishment.superseded', 'auth.destination.capacity', 'auth.destination.not_started', 'auth.destination.superseded'].includes(code)
  }
  return [
    'auth.flow.expired', 'auth.credentials.invalid', 'auth.credentials.rate_limited', 'auth.password.policy',
    'auth.signup.organization_name.invalid', 'auth.signup.domain.conflict', 'auth.signup.handle.unavailable',
    'auth.account.temporarily_unavailable', 'auth.account_session.invalid', 'auth.account_establishment.superseded',
    'auth.destination.capacity', 'auth.destination.not_started', 'auth.destination.superseded',
    'auth.callback.invalid', 'auth.callback.superseded', 'auth.product_session.provisional',
    'auth.product_session.stale_cookie', 'auth.product_session.invalid', 'auth.product_session.account_limit',
    'auth.code.invalid', 'auth.code.expired',
    'auth.code.superseded', 'auth.private_assertion.invalid', 'auth.private_assertion.replayed',
  ].includes(code)
}

function protocolError(envelope: ProtocolErrorEnvelopeV1, status: number, path: string): ProtocolError {
  const error = envelope.error
  const expected = new Map<string, readonly [number, string, string]>([
    ['auth.request.invalid', [400, 'none', 'empty']],
    ['auth.origin.denied', [403, 'none', 'empty']],
    ['auth.proof.invalid', [403, 'restartProductAuth', 'empty']],
    ['auth.flow.expired', [410, 'restartProductAuth', 'empty']],
    ['auth.flow.limit', [409, 'none', 'flowLimit']],
    ['auth.catalog.stale', [409, 'refreshCatalog', 'catalogStale']],
    ['auth.credentials.invalid', [401, 'retryCredentials', 'empty']],
    ['auth.credentials.rate_limited', [429, 'retryCredentials', 'rateLimit']],
    ['auth.password.policy', [422, 'retryCredentials', 'passwordPolicy']],
    ['auth.signup.organization_name.invalid', [422, 'retryInput', 'empty']],
    ['auth.signup.domain.conflict', [409, 'retryInput', 'empty']],
    ['auth.signup.handle.unavailable', [409, 'retryInput', 'empty']],
    ['auth.account.temporarily_unavailable', [503, 'retrySameOperation', 'empty']],
    ['auth.account_session.invalid', [401, 'reauthenticate', 'empty']],
    ['auth.account_establishment.superseded', [409, 'restartProductAuth', 'empty']],
    ['auth.destination.capacity', [429, 'retrySameOperation', 'rateLimit']],
    ['auth.destination.not_started', [409, 'retrySameOperation', 'empty']],
    ['auth.destination.superseded', [409, 'restartProductAuth', 'empty']],
    ['auth.callback.invalid', [403, 'restartProductAuth', 'empty']],
    ['auth.callback.superseded', [409, 'restartProductAuth', 'empty']],
    ['auth.product_session.provisional', [409, 'finishFirstActivation', 'callbackOperation']],
    ['auth.product_session.stale_cookie', [409, 'repairProductSession', 'empty']],
    ['auth.product_session.invalid', [401, 'reauthenticate', 'empty']],
    ['auth.product_session.account_limit', [409, 'none', 'flowLimit']],
    ['auth.logout.retry_required', [503, 'retryLogout', 'empty']],
    ['auth.logout.failed', [409, 'retryLogout', 'empty']],
    ['auth.code.invalid', [401, 'restartProductAuth', 'empty']],
    ['auth.code.expired', [410, 'restartProductAuth', 'empty']],
    ['auth.code.superseded', [409, 'restartProductAuth', 'empty']],
    ['auth.private_assertion.invalid', [403, 'retrySameOperation', 'empty']],
    ['auth.private_assertion.replayed', [409, 'retrySameOperation', 'empty']],
    ['auth.dependency.unavailable', [503, 'retrySameOperation', 'empty']],
    ['auth.internal.invariant', [503, 'restartProductAuth', 'empty']],
  ])
  const rule = expected.get(error.code)
  if (rule === undefined || !endpointAllows(path, error.code) || rule[0] !== status || rule[1] !== error.recovery.action || rule[2] !== error.details.kind) {
    return new ProtocolError('auth.internal.invariant')
  }
  const retryAfter = error.details.kind === 'rateLimit' ? error.details.retryAfterSeconds : undefined
  if (retryAfter !== undefined && (!Number.isInteger(retryAfter) || retryAfter < 1 || retryAfter > 900)) {
    return new ProtocolError('auth.internal.invariant')
  }
  if (error.details.kind === 'flowLimit' && error.details.limit !== 8) return new ProtocolError('auth.internal.invariant')
  if (error.details.kind === 'passwordPolicy' && (error.details.field !== 'password' || error.details.violations.length === 0 ||
      new Set(error.details.violations).size !== error.details.violations.length)) return new ProtocolError('auth.internal.invariant')
  return new ProtocolError(
    error.code,
    ['retrySameOperation', 'retryInput', 'retryCredentials', 'retryLogout', 'refreshCatalog'].includes(error.recovery.action),
    retryAfter,
    error.recovery.action,
    error.details,
  )
}

function exactOrigin(origin: string): string {
  const url = new URL(origin)
  if (url.href !== `${url.origin}/` || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Invalid protocol origin')
  }
  return url.origin
}

function invalidDispatchedResponse(method: 'GET' | 'POST' | 'PUT'): ProtocolError {
  return new ProtocolError(
    method === 'GET' ? 'auth_invalid_response' : 'auth_outcome_uncertain',
    true,
    undefined,
    'retrySameOperation',
  )
}

async function boundedResponseText(response: Response): Promise<string> {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) throw new ProtocolError('auth_response_too_large')
  if (response.body === null) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new ProtocolError('auth_response_too_large')
    }
    chunks.push(value)
  }
  const body = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(body)
}

export class AuthApi {
  readonly origin: string

  constructor(origin: string) {
    this.origin = exactOrigin(origin)
  }

  async post<Request, Response>(path: string, body: Request, schema: ResponseSchemaName, csrfToken?: string, headers: Readonly<Record<string, string>> = {}, signal?: AbortSignal): Promise<Response> {
    return this.json('POST', path, body, schema, csrfToken, headers, signal)
  }

  async put<Request, Response>(path: string, body: Request, schema: ResponseSchemaName, csrfToken?: string, headers: Readonly<Record<string, string>> = {}): Promise<Response> {
    return this.json('PUT', path, body, schema, csrfToken, headers)
  }

  async get<Response>(path: string, schema: ResponseSchemaName, headers: Readonly<Record<string, string>> = {}): Promise<Response> {
    return this.json('GET', path, undefined, schema, undefined, headers)
  }

  private async json<Request, Response>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body: Request | undefined,
    schema: ResponseSchemaName,
    csrfToken?: string,
    additionalHeaders: Readonly<Record<string, string>> = {},
    signal?: AbortSignal,
  ): Promise<Response> {
    const requestUrl = new URL(path, this.origin)
    if (!/^\/api\/auth\/v1\/[A-Za-z0-9/_-]+$/u.test(path) || requestUrl.origin !== this.origin ||
        requestUrl.pathname !== path || requestUrl.search !== '' || requestUrl.hash !== '') {
      throw new Error('Invalid authentication API path')
    }
    let response: globalThis.Response
    const encodedBody = body === undefined ? undefined : JSON.stringify(body)
    const requestLimit = path === '/api/auth/v1/sign-ins' || path === '/api/auth/v1/password-recoveries/complete' ||
      /^\/api\/auth\/v1\/signups\/[0-9a-f-]+\/password$/u.test(path)
      ? MAX_PASSWORD_REQUEST_BYTES : MAX_JSON_REQUEST_BYTES
    if (encodedBody !== undefined && new TextEncoder().encode(encodedBody).byteLength > requestLimit) {
      throw new ProtocolError('auth_request_too_large')
    }
    try {
      response = await fetch(requestUrl, {
        method,
        mode: 'cors',
        credentials: 'include',
        redirect: 'error',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal: signal === undefined
          ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
          : AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
        headers: {
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(csrfToken === undefined ? {} : { 'X-Metamorph-CSRF': csrfToken }),
          ...additionalHeaders,
        },
        body: encodedBody,
      })
    } catch {
      throw new ProtocolError('auth_unavailable', true)
    }
    let text: string
    try {
      text = await boundedResponseText(response)
    } catch {
      throw invalidDispatchedResponse(method)
    }
    if (!/^application\/json(?:;|$)/iu.test(response.headers.get('content-type') ?? '')) {
      throw invalidDispatchedResponse(method)
    }
    if (!response.ok) {
      try {
        throw protocolError(decodeProtocolResponse<ProtocolErrorEnvelopeV1>('protocolError', text), response.status, path)
      } catch (error) {
        if (error instanceof ProtocolError) throw error
        throw invalidDispatchedResponse(method)
      }
    }
    try {
      return decodeProtocolResponse<Response>(schema, text)
    } catch {
      throw invalidDispatchedResponse(method)
    }
  }
}
