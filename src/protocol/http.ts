import type { ProtocolErrorEnvelopeV1 } from '../contracts/generated/csi07/ProtocolErrorEnvelopeV1'
import type { RecoveryActionV1 } from '../contracts/generated/csi07/RecoveryActionV1'
import type { ProtocolErrorDetailsV1 } from '../contracts/generated/csi07/ProtocolErrorDetailsV1'
import { decodeBoundedJsonText } from '../contracts/decode'
import { decodeProtocolResponse, type ResponseSchemaName } from './decode'

const MAX_RESPONSE_BYTES = 256 * 1024
const MAX_JSON_REQUEST_BYTES = 64 * 1024
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

interface AuthApiSecurityContext {
  readonly catalogVersion: string
  readonly identityRegions: readonly {
    readonly regionId: string
    readonly origin: string
  }[]
}

type ErrorContract = 'protocol' | 'retained'

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value)
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key))
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
    'auth.account.temporarily_unavailable', 'auth.account_session.invalid', 'auth.account_establishment.superseded',
    'auth.destination.capacity', 'auth.destination.not_started', 'auth.destination.superseded',
    'auth.callback.invalid', 'auth.callback.superseded', 'auth.product_session.provisional',
    'auth.product_session.stale_cookie', 'auth.product_session.invalid', 'auth.code.invalid', 'auth.code.expired',
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
    ['retrySameOperation', 'retryCredentials', 'retryLogout', 'refreshCatalog'].includes(error.recovery.action),
    retryAfter,
    error.recovery.action,
    error.details,
  )
}

function retainedError(
  text: string,
  status: number,
  security?: AuthApiSecurityContext,
): { error: ProtocolError; correctionOrigin?: string } {
  const value = decodeBoundedJsonText(text, MAX_RESPONSE_BYTES)
  if (!record(value) || !exactKeys(value, ['schemaVersion', 'error']) || value.schemaVersion !== 1 || !record(value.error) ||
      !exactKeys(value.error, ['code', 'message', 'details', 'correlationId']) || typeof value.error.code !== 'string' ||
      typeof value.error.message !== 'string' || typeof value.error.correlationId !== 'string' || !record(value.error.details)) {
    throw new Error('Invalid retained workflow error')
  }
  const code = value.error.code
  const details = value.error.details
  const emptyCodes = new Set([
    'request.invalid', 'auth.authorization.invalid_request', 'auth.signup.verification_invalid',
    'auth.signup.handoff_invalid', 'auth.password_recovery.invalid', 'auth.sign_in.invalid_credentials',
    'auth.session.invalid', 'auth.csrf.invalid', 'auth.idempotency_conflict', 'auth.signup.state_conflict',
    'auth.signup.organization_unavailable', 'auth.signup.publication_review_required', 'auth.region.unavailable',
  ])
  if (emptyCodes.has(code) && !(exactKeys(details, []) || (code === 'request.invalid' && exactKeys(details, ['field']) && typeof details.field === 'string'))) throw new Error('Invalid retained workflow details')
  if (code === 'auth.signup.handle_unavailable' && !(exactKeys(details, ['field']) && details.field === 'handle')) throw new Error('Invalid retained workflow details')
  if (code === 'auth.signup.organization_name_invalid' && !(exactKeys(details, ['field']) && details.field === 'displayName')) throw new Error('Invalid retained workflow details')
  if (code === 'auth.password.policy_failed' && !(exactKeys(details, ['field', 'reason']) && details.field === 'password' && ['too_short', 'too_long', 'blocked', 'unavailable'].includes(String(details.reason)))) throw new Error('Invalid retained workflow details')
  const throttled = code === 'auth.sign_in.throttled' || code === 'auth.signup.throttled'
  if (throttled && !(exactKeys(details, []) || (exactKeys(details, ['retryAfterSeconds']) && Number.isInteger(details.retryAfterSeconds) && Number(details.retryAfterSeconds) >= 1 && Number(details.retryAfterSeconds) <= 900))) throw new Error('Invalid retained workflow details')
  if (code === 'auth.profile.picture_invalid' || code === 'auth.profile.picture_unavailable') {
    if (!exactKeys(details, [])) throw new Error('Invalid retained workflow details')
  }
  if (code === 'routing.wrong_region') {
    if (status !== 421 || security === undefined || !exactKeys(details, ['destinationRegionId', 'destinationApiOrigin', 'catalogVersion']) ||
        typeof details.destinationRegionId !== 'string' || typeof details.destinationApiOrigin !== 'string' ||
        details.catalogVersion !== security.catalogVersion) {
      throw new Error('Invalid route correction')
    }
    const correction = exactOrigin(details.destinationApiOrigin)
    if (!security.identityRegions.some((region) =>
      region.regionId === details.destinationRegionId && region.origin === correction)) {
      throw new Error('Uncataloged route correction')
    }
    return { error: new ProtocolError(code, true), correctionOrigin: correction }
  }
  const known = emptyCodes.has(code) || throttled || code === 'auth.signup.handle_unavailable' ||
    code === 'auth.signup.organization_name_invalid' || code === 'auth.password.policy_failed' ||
    code === 'auth.profile.picture_invalid' || code === 'auth.profile.picture_unavailable'
  if (!known) throw new Error('Unknown retained workflow error')
  const retryAfter = typeof details.retryAfterSeconds === 'number' ? details.retryAfterSeconds : undefined
  return { error: new ProtocolError(code, status >= 500 || throttled, retryAfter, undefined, Object.freeze({ ...details })) }
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
  readonly security?: AuthApiSecurityContext

  constructor(origin: string, security?: AuthApiSecurityContext) {
    this.origin = exactOrigin(origin)
    this.security = security
  }

  async post<Request, Response>(path: string, body: Request, schema: ResponseSchemaName, csrfToken?: string, headers: Readonly<Record<string, string>> = {}): Promise<Response> {
    return this.json('POST', path, body, schema, csrfToken, headers)
  }

  async put<Request, Response>(path: string, body: Request, schema: ResponseSchemaName, csrfToken?: string, headers: Readonly<Record<string, string>> = {}): Promise<Response> {
    return this.json('PUT', path, body, schema, csrfToken, headers)
  }

  async get<Response>(path: string, schema: ResponseSchemaName, headers: Readonly<Record<string, string>> = {}): Promise<Response> {
    return this.json('GET', path, undefined, schema, undefined, headers)
  }

  async postRetained<Request, Response>(path: string, body: Request, schema: ResponseSchemaName, csrfToken?: string, headers: Readonly<Record<string, string>> = {}): Promise<Response> {
    return this.json('POST', path, body, schema, csrfToken, headers, 'retained')
  }

  async putRetained<Request, Response>(path: string, body: Request, schema: ResponseSchemaName, csrfToken?: string, headers: Readonly<Record<string, string>> = {}): Promise<Response> {
    return this.json('PUT', path, body, schema, csrfToken, headers, 'retained')
  }

  async getRetained<Response>(path: string, schema: ResponseSchemaName, headers: Readonly<Record<string, string>> = {}): Promise<Response> {
    return this.json('GET', path, undefined, schema, undefined, headers, 'retained')
  }

  private async json<Request, Response>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body: Request | undefined,
    schema: ResponseSchemaName,
    csrfToken?: string,
    additionalHeaders: Readonly<Record<string, string>> = {},
    errorContract: ErrorContract = 'protocol',
    correctionUsed = false,
  ): Promise<Response> {
    const requestUrl = new URL(path, this.origin)
    if (!/^\/api\/auth\/v1\/[A-Za-z0-9/_-]+$/u.test(path) || requestUrl.origin !== this.origin ||
        requestUrl.pathname !== path || requestUrl.search !== '' || requestUrl.hash !== '') {
      throw new Error('Invalid authentication API path')
    }
    let response: globalThis.Response
    const encodedBody = body === undefined ? undefined : JSON.stringify(body)
    if (encodedBody !== undefined && new TextEncoder().encode(encodedBody).byteLength > MAX_JSON_REQUEST_BYTES) {
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
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
        if (errorContract === 'retained') {
          const retained = retainedError(text, response.status, this.security)
          if (!correctionUsed && retained.correctionOrigin !== undefined) {
            return new AuthApi(retained.correctionOrigin, this.security).json(
              method, path, body, schema, csrfToken, additionalHeaders, errorContract, true,
            )
          }
          throw retained.error
        }
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
