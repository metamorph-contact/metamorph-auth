import { plan03Routes } from '../contracts/generated/enterprise-security-v1/plan03-routes.generated'
import type {
  Plan03RequestMap,
  Plan03ResponseMap,
} from '../contracts/generated/enterprise-security-v1/plan03-operations.generated'
import type { SecurityApiErrorV1 } from '../contracts/generated/enterprise-security-v1/types/SecurityApiErrorV1'
import type { SecurityErrorV1 } from '../contracts/generated/enterprise-security-v1/types/SecurityErrorV1'
import { plan03RequestValidators } from './plan03-validators.generated'
import { decodePlan03Error, decodePlan03Response } from './response-decode'

type IdentityOperation = {
  [K in keyof typeof plan03Routes]: (typeof plan03Routes)[K]['surface'] extends 'regional_identity' ? K : never
}[keyof typeof plan03Routes] &
  keyof Plan03RequestMap

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export interface PreparedPlan03IdentityRequest<K extends IdentityOperation> {
  operation: K
  operationId: string
  path: string
  method: 'POST'
  body: string
  contractHeaders: Record<string, string>
  expectedStatus: 200
}

export interface Plan03IdentityWireRequest<K extends IdentityOperation> extends PreparedPlan03IdentityRequest<K> {
  credentials: 'omit'
  redirect: 'error'
}

export type Plan03IdentityTransport = <K extends IdentityOperation>(
  request: Plan03IdentityWireRequest<K>,
  signal: AbortSignal,
) => Promise<Plan03WireResponse>

export interface Plan03WireResponse {
  status: number
  contentType: string | null
  body: string
  headers: Readonly<Record<string, string | undefined>>
}

const ERROR_STATUS: Readonly<Record<SecurityErrorV1['code'], number>> = {
  'security.assurance.required': 428,
  'security.assurance.phishing_resistance_required': 428,
  'security.assurance.recent_authentication_required': 428,
  'security.ceremony.expired': 410,
  'security.ceremony.mismatch': 400,
  'security.method.disabled': 403,
  'security.provider.unavailable': 503,
  'security.provider.not_ready': 409,
  'security.policy.changed': 409,
  'security.route.retry': 421,
  'security.recovery.limited': 403,
  'security.owner.unavailable': 503,
  'security.operation.partial_result': 409,
  'security.operation.conflict': 409,
  'security.emergency.not_ready': 409,
  'security.request.invalid': 400,
  'security.request.unauthorized': 401,
  'security.request.forbidden': 403,
  'security.request.rate_limited': 429,
  'security.dependency.unavailable': 503,
}

type FailureProfile = (typeof plan03Routes)[keyof typeof plan03Routes]['failureProfile']

const PUBLIC_CEREMONY_FORBIDDEN = new Set<SecurityErrorV1['code']>([
  'security.operation.conflict',
  'security.operation.partial_result',
  'security.policy.changed',
  'security.provider.not_ready',
  'security.emergency.not_ready',
  'security.route.retry',
])

const ANONYMOUS_ENTRY_OPERATIONS = new Set<IdentityOperation>([
  'identity.factor_recovery.start',
])

const ANONYMOUS_ENTRY_FAILURES = new Set<SecurityErrorV1['code']>([
  'security.request.invalid',
  'security.ceremony.mismatch',
  'security.request.rate_limited',
  'security.provider.unavailable',
  'security.dependency.unavailable',
])

function failureProfileAdmits(
  operation: IdentityOperation,
  profile: FailureProfile,
  code: SecurityErrorV1['code'],
): boolean {
  if (ANONYMOUS_ENTRY_OPERATIONS.has(operation)) {
    return ANONYMOUS_ENTRY_FAILURES.has(code)
  }
  switch (profile) {
    case 'browser_command':
      return true
    case 'browser_read':
      return code !== 'security.operation.partial_result'
    case 'public_ceremony':
      return !PUBLIC_CEREMONY_FORBIDDEN.has(code)
  }
}

function responseHeader(
  headers: Readonly<Record<string, string | undefined>>,
  name: string,
): string | undefined {
  const matches = Object.entries(headers).filter(([key]) => key.toLowerCase() === name)
  if (matches.length > 1) throw new Error('Invalid Plan 03 response headers')
  const value = matches[0]?.[1]
  if (value !== undefined && typeof value !== 'string') {
    throw new Error('Invalid Plan 03 response headers')
  }
  return value
}

function retryAfterSeconds(error: SecurityErrorV1): number | undefined {
  switch (error.code) {
    case 'security.request.rate_limited':
    case 'security.owner.unavailable':
    case 'security.dependency.unavailable':
      return error.detail.retryAfterSeconds
    default:
      return undefined
  }
}

function validateRetryAfter(
  headers: Readonly<Record<string, string | undefined>>,
  envelope?: SecurityApiErrorV1,
): void {
  const header = responseHeader(headers, 'retry-after')
  const seconds = envelope === undefined ? undefined : retryAfterSeconds(envelope.error)
  if (seconds === undefined) {
    if (header !== undefined) throw new Error('Invalid Plan 03 Retry-After')
    return
  }
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 300 || header !== String(seconds)) {
    throw new Error('Invalid Plan 03 Retry-After')
  }
}

export class Plan03IdentityHttpError extends Error {
  constructor(
    readonly status: number,
    readonly envelope: SecurityApiErrorV1,
  ) {
    super(envelope.error.code)
    this.name = 'Plan03IdentityHttpError'
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function boundMutationId(request: unknown): string | undefined {
  const root = record(request)
  if (!root) throw new Error('Invalid Plan 03 request')
  const guard = record(root.guard)
  const values = [root.mutationId, root.commandId, guard?.mutationId, guard?.commandId].filter(
    (value) => value !== undefined,
  )
  if (values.some((value) => typeof value !== 'string') || new Set(values).size > 1) {
    throw new Error('Invalid Plan 03 mutation binding')
  }
  return values[0] as string | undefined
}

/** Builds only the EA-00H wire contract. The Plan 02 listener owner supplies
 * the cataloged identity origin, ceremony admission and actual transport. */
export function preparePlan03IdentityRequest<K extends IdentityOperation>(
  operation: K,
  request: Plan03RequestMap[K],
  idempotencyKey?: string,
): PreparedPlan03IdentityRequest<K> {
  if (!Object.hasOwn(plan03Routes, operation)) throw new Error('Missing Plan 03 route')
  const route = plan03Routes[operation]
  if (route.surface !== 'regional_identity') throw new Error('Wrong Plan 03 surface')
  const body = JSON.stringify(request)
  if (typeof body !== 'string' || new TextEncoder().encode(body).byteLength > route.maxRequestBytes) {
    throw new Error('Invalid Plan 03 request size')
  }
  const wireValue: unknown = JSON.parse(body)
  const validator = plan03RequestValidators[operation] as (input: unknown) => boolean
  if (!validator(wireValue)) throw new Error('Invalid Plan 03 request')
  const boundId = boundMutationId(wireValue)
  if (route.idempotency === 'required_header') {
    if (!idempotencyKey || !UUID_V7.test(idempotencyKey) || (boundId && boundId !== idempotencyKey)) {
      throw new Error('Invalid Plan 03 idempotency binding')
    }
  } else if (idempotencyKey !== undefined || boundId !== undefined) {
    throw new Error('Unexpected Plan 03 idempotency binding')
  }
  const contractHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (idempotencyKey) contractHeaders['Idempotency-Key'] = idempotencyKey
  return {
    operation,
    operationId: route.operationId,
    path: route.path,
    method: 'POST',
    body,
    contractHeaders,
    expectedStatus: 200,
  }
}

/** Executes against a transport already pinned to the signed catalog's regional
 * identity origin. This layer cannot establish an account or product session. */
export async function executePlan03IdentityRequest<K extends IdentityOperation>(
  transport: Plan03IdentityTransport,
  operation: K,
  request: Plan03RequestMap[K],
  idempotencyKey: string | undefined,
  signal: AbortSignal,
): Promise<Plan03ResponseMap[K]> {
  const prepared = preparePlan03IdentityRequest(operation, request, idempotencyKey)
  const response = await transport({ ...prepared, credentials: 'omit', redirect: 'error' }, signal)
  if (response.contentType?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') {
    throw new Error('Invalid Plan 03 response media type')
  }
  if (response.status === prepared.expectedStatus) {
    validateRetryAfter(response.headers)
    return decodePlan03Response(operation, response.body)
  }
  const envelope = decodePlan03Error(response.body)
  if (ERROR_STATUS[envelope.error.code] !== response.status) {
    throw new Error('Invalid Plan 03 error status')
  }
  if (!failureProfileAdmits(operation, plan03Routes[operation].failureProfile, envelope.error.code)) {
    throw new Error('Invalid Plan 03 failure profile')
  }
  validateRetryAfter(response.headers, envelope)
  throw new Plan03IdentityHttpError(response.status, envelope)
}
