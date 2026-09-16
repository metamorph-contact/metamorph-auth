import type { IdentityFlowResumeReferenceV1 } from '../contracts/generated/csi07/IdentityFlowResumeReferenceV1'
import type { DestinationContinuationFragment, InitialEntryFragment, FederationReturnFragment } from './fragment'

const DESTINATION_KEY = 'metamorph.auth.destination.v1'
const ACCOUNT_LOGOUT_KEY = 'metamorph.auth.account-logout.v1'
const START_RECOVERY_KEY = 'metamorph.auth.start-recovery.v1'
const FEDERATION_RETURN_KEY = 'metamorph.auth.federation-return.v1'
const FLOW_RESUME_KEY = 'metamorph.auth.flow-resume.v1'
const UUID7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
const PROTECTED = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]*){2}(?:(?:\.[A-Za-z0-9_-]*){2})?$/u
const DIGEST = /^[A-Za-z0-9_-]{43}$/u
const RECOVERY_MAX_AGE_MS = 5 * 60 * 1_000
const START_MAX_AGE_MS = 2 * 60 * 1_000
const CLOCK_SKEW_MS = 60 * 1_000
const CATALOG_ID = /^[a-z0-9](?:[a-z0-9]|[._-](?=[a-z0-9])){0,95}$/u
const CATALOG_VERSION = /^[A-Za-z0-9._-]{1,64}$/u

/** Advisory identifiers only. Current controller and issuer cookies re-admit
 * every recovery; storage never retains protocol responses or CSI carriers. */
export function saveFederationReturn(fragment: FederationReturnFragment): void {
  const retained = JSON.stringify({ ...fragment, receivedAt: new Date().toISOString() })
  sessionStorage.setItem(FEDERATION_RETURN_KEY, retained)
  if (sessionStorage.getItem(FEDERATION_RETURN_KEY) !== retained) throw new Error('Session storage verification failed')
}
export function clearFederationReturn(): void { sessionStorage.removeItem(FEDERATION_RETURN_KEY) }
export function readFederationReturn(): FederationReturnFragment | null {
  const raw = sessionStorage.getItem(FEDERATION_RETURN_KEY)
  if (raw === null) return null
  try {
    if (raw.length > 4096) throw new Error('Invalid return receipt')
    const v: unknown = JSON.parse(raw)
    if (v === null || typeof v !== 'object') throw new Error('Invalid return receipt')
    const r = v as Record<string, unknown>
    if (Object.keys(r).length !== 10 || r.kind !== 'federationReturn'
      || !['projection', 'controller', 'issuer'].every((key) => typeof r[key] === 'string' && CATALOG_ID.test(r[key]))
      || !['flow', 'attempt', 'provider'].every((key) => typeof r[key] === 'string' && UUID7.test(r[key]))
      || typeof r.catalog !== 'string' || !CATALOG_VERSION.test(r.catalog)
      || typeof r.digest !== 'string' || !DIGEST.test(r.digest)
      || !currentTimestamp(r.receivedAt, 30 * 60 * 1000)) throw new Error('Invalid return receipt')
    return Object.freeze({kind:'federationReturn', projection:r.projection as string, controller:r.controller as string,
      issuer:r.issuer as string, catalog:r.catalog,digest:r.digest,flow:r.flow as string,attempt:r.attempt as string,provider:r.provider as string})
  } catch { clearFederationReturn(); return null }
}

/** Only native non-authorizing reference fields are retained. Handoff proof,
 * CSRF and CSI/H authorization carriers remain in protected cookies/memory. */
export function saveIdentityFlowResume(value: IdentityFlowResumeReferenceV1): void {
  const stored: IdentityFlowResumeReferenceV1 = {
    schemaVersion: value.schemaVersion, flowId: value.flowId,
    controllerRegionId: value.controllerRegionId, authProjectionId: value.authProjectionId,
    catalogVersion: value.catalogVersion, catalogDigest: value.catalogDigest, expiresAt: value.expiresAt,
  }
  const encoded = JSON.stringify(stored)
  sessionStorage.setItem(FLOW_RESUME_KEY, encoded)
  if (sessionStorage.getItem(FLOW_RESUME_KEY) !== encoded) throw new Error('Session storage verification failed')
}
export function clearIdentityFlowResume(): void { sessionStorage.removeItem(FLOW_RESUME_KEY) }
export function readIdentityFlowResume(): IdentityFlowResumeReferenceV1 | null {
  const encoded = sessionStorage.getItem(FLOW_RESUME_KEY)
  if (encoded === null) return null
  try {
    if (encoded.length > 1024) throw new Error('Invalid flow reference')
    const value: unknown = JSON.parse(encoded)
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid flow reference')
    const v = value as Record<string, unknown>
    if (Object.keys(v).length !== 7 || v.schemaVersion !== 1
      || typeof v.flowId !== 'string' || !UUID7.test(v.flowId)
      || typeof v.controllerRegionId !== 'string' || !CATALOG_ID.test(v.controllerRegionId)
      || typeof v.authProjectionId !== 'string' || !CATALOG_ID.test(v.authProjectionId)
      || typeof v.catalogVersion !== 'string' || !CATALOG_VERSION.test(v.catalogVersion)
      || typeof v.catalogDigest !== 'string' || !DIGEST.test(v.catalogDigest)
      || typeof v.expiresAt !== 'string' || !Number.isFinite(Date.parse(v.expiresAt))
      || Date.parse(v.expiresAt) <= Date.now() || Date.parse(v.expiresAt) > Date.now() + 5 * 60_000 + 30_000) {
      throw new Error('Invalid flow reference')
    }
    return Object.freeze(v as unknown as IdentityFlowResumeReferenceV1)
  } catch { clearIdentityFlowResume(); return null }
}

function protectedValue(value: unknown, maxBytes: number): value is string {
  return typeof value === 'string' && value.length <= maxBytes && PROTECTED.test(value)
}

function currentTimestamp(value: unknown, maxAgeMs: number): value is string {
  if (typeof value !== 'string') return false
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value &&
    parsed <= Date.now() + CLOCK_SKEW_MS && parsed + maxAgeMs > Date.now()
}

interface StoredStartRecovery {
  readonly schemaVersion: 1
  readonly projection: string
  readonly catalog: string
  readonly digest: string
  readonly recovery: string
  readonly receivedAt: string
}

export type StartRecovery = Omit<StoredStartRecovery, 'receivedAt'>

interface StoredDestination {
  readonly schemaVersion: 1
  readonly flow: string
  readonly operation: string
  readonly digest: string
  readonly receipt: string
  readonly receivedAt: string
}

export interface AccountLogoutPending {
  readonly schemaVersion: 1
  readonly browserAccountId: string
  readonly prepareAttemptId: string
  readonly operationId: string | null
  readonly startedAt: string
}

export function assertSessionStorageAvailable(): void {
  const key = `metamorph.auth.probe.${crypto.randomUUID()}`
  const value = crypto.randomUUID()
  try {
    sessionStorage.setItem(key, value)
    if (sessionStorage.getItem(key) !== value) throw new Error('Session storage verification failed')
  } finally {
    sessionStorage.removeItem(key)
  }
}

function valid(value: unknown): value is StoredDestination {
  if (value === null || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Object.keys(record).length === 6 &&
    ['schemaVersion', 'flow', 'operation', 'digest', 'receipt', 'receivedAt']
      .every((name) => Object.hasOwn(record, name)) &&
    record.schemaVersion === 1 && typeof record.flow === 'string' && UUID7.test(record.flow) &&
    typeof record.operation === 'string' && UUID7.test(record.operation) &&
    typeof record.digest === 'string' && DIGEST.test(record.digest) &&
    protectedValue(record.receipt, 8 * 1024) &&
    currentTimestamp(record.receivedAt, RECOVERY_MAX_AGE_MS)
}

function validStartRecovery(value: unknown): value is StoredStartRecovery {
  if (value === null || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Object.keys(record).length === 6 &&
    ['schemaVersion', 'projection', 'catalog', 'digest', 'recovery', 'receivedAt']
      .every((name) => Object.hasOwn(record, name)) &&
    record.schemaVersion === 1 && typeof record.projection === 'string' && CATALOG_ID.test(record.projection) &&
    typeof record.catalog === 'string' && CATALOG_VERSION.test(record.catalog) &&
    typeof record.digest === 'string' && DIGEST.test(record.digest) &&
    protectedValue(record.recovery, 3 * 1024) &&
    currentTimestamp(record.receivedAt, START_MAX_AGE_MS)
}

function validAccountLogout(value: unknown): value is AccountLogoutPending {
  if (value === null || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Object.keys(record).length === 5 &&
    ['schemaVersion', 'browserAccountId', 'prepareAttemptId', 'operationId', 'startedAt']
      .every((name) => Object.hasOwn(record, name)) &&
    record.schemaVersion === 1 && typeof record.browserAccountId === 'string' &&
    /^[A-Za-z0-9._~-]{1,256}$/u.test(record.browserAccountId) &&
    typeof record.prepareAttemptId === 'string' && /^[A-Za-z0-9_-]{43}$/u.test(record.prepareAttemptId) &&
    (record.operationId === null || (typeof record.operationId === 'string' && UUID7.test(record.operationId))) &&
    currentTimestamp(record.startedAt, RECOVERY_MAX_AGE_MS)
}

/** Persist only the signed, non-authorizing recovery receipt before fragment removal. */
export function saveStartRecovery(value: InitialEntryFragment): StartRecovery {
  assertSessionStorageAvailable()
  const stored: StoredStartRecovery = Object.freeze({
    schemaVersion: 1,
    projection: value.projection,
    catalog: value.catalog,
    digest: value.digest,
    recovery: value.recovery,
    receivedAt: new Date().toISOString(),
  })
  sessionStorage.setItem(START_RECOVERY_KEY, JSON.stringify(stored))
  const verified = readStartRecovery()
  if (verified === null || verified.recovery !== value.recovery) {
    throw new Error('Start recovery receipt did not persist')
  }
  return verified
}

export function readStartRecovery(): StartRecovery | null {
  const encoded = sessionStorage.getItem(START_RECOVERY_KEY)
  if (encoded === null) return null
  if (new TextEncoder().encode(encoded).byteLength > 12 * 1024) {
    sessionStorage.removeItem(START_RECOVERY_KEY)
    return null
  }
  try {
    const parsed: unknown = JSON.parse(encoded)
    if (!validStartRecovery(parsed)) {
      sessionStorage.removeItem(START_RECOVERY_KEY)
      return null
    }
    return Object.freeze({
      schemaVersion: 1,
      projection: parsed.projection,
      catalog: parsed.catalog,
      digest: parsed.digest,
      recovery: parsed.recovery,
    })
  } catch {
    sessionStorage.removeItem(START_RECOVERY_KEY)
    return null
  }
}

export function clearStartRecovery(expectedReceipt?: string): void {
  const current = readStartRecovery()
  if (expectedReceipt !== undefined && current !== null && current.recovery !== expectedReceipt) {
    throw new Error('Start recovery receipt mismatch')
  }
  sessionStorage.removeItem(START_RECOVERY_KEY)
}

/** The receipt is signed, short-lived and non-authorizing without browser cookies. */
export function saveDestinationContinuation(value: DestinationContinuationFragment): DestinationContinuationFragment {
  assertSessionStorageAvailable()
  const stored: StoredDestination = Object.freeze({
    schemaVersion: 1,
    flow: value.flow,
    operation: value.operation,
    digest: value.digest,
    receipt: value.receipt,
    receivedAt: new Date().toISOString(),
  })
  sessionStorage.setItem(DESTINATION_KEY, JSON.stringify(stored))
  const verified = readDestinationContinuation()
  if (verified === null || verified.flow !== value.flow || verified.operation !== value.operation ||
      verified.digest !== value.digest || verified.receipt !== value.receipt) {
    throw new Error('Destination continuation did not persist')
  }
  return verified
}

export function readDestinationContinuation(): DestinationContinuationFragment | null {
  const encoded = sessionStorage.getItem(DESTINATION_KEY)
  if (encoded === null) return null
  if (new TextEncoder().encode(encoded).byteLength > 12 * 1024) {
    sessionStorage.removeItem(DESTINATION_KEY)
    return null
  }
  try {
    const parsed: unknown = JSON.parse(encoded)
    if (!valid(parsed)) {
      sessionStorage.removeItem(DESTINATION_KEY)
      return null
    }
    return Object.freeze({
      kind: 'destination',
      flow: parsed.flow,
      operation: parsed.operation,
      digest: parsed.digest,
      receipt: parsed.receipt,
    })
  } catch {
    sessionStorage.removeItem(DESTINATION_KEY)
    return null
  }
}

export function saveAccountLogoutPending(value: AccountLogoutPending): AccountLogoutPending {
  assertSessionStorageAvailable()
  sessionStorage.setItem(ACCOUNT_LOGOUT_KEY, JSON.stringify(value))
  const verified = readAccountLogoutPending()
  if (verified === null || verified.prepareAttemptId !== value.prepareAttemptId || verified.operationId !== value.operationId) {
    throw new Error('Account logout recovery state did not persist')
  }
  return verified
}

export function readAccountLogoutPending(): AccountLogoutPending | null {
  const encoded = sessionStorage.getItem(ACCOUNT_LOGOUT_KEY)
  if (encoded === null) return null
  if (new TextEncoder().encode(encoded).byteLength > 2 * 1024) {
    sessionStorage.removeItem(ACCOUNT_LOGOUT_KEY)
    return null
  }
  try {
    const parsed: unknown = JSON.parse(encoded)
    if (!validAccountLogout(parsed)) {
      sessionStorage.removeItem(ACCOUNT_LOGOUT_KEY)
      return null
    }
    return Object.freeze(parsed)
  } catch {
    sessionStorage.removeItem(ACCOUNT_LOGOUT_KEY)
    return null
  }
}

export function clearAccountLogoutPending(expectedOperationId?: string): void {
  const current = readAccountLogoutPending()
  if (expectedOperationId !== undefined && current !== null && current.operationId !== expectedOperationId) {
    throw new Error('Account logout recovery state mismatch')
  }
  sessionStorage.removeItem(ACCOUNT_LOGOUT_KEY)
}

export const __test = { valid, validStartRecovery, validAccountLogout }
