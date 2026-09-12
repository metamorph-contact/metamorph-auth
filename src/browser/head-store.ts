import type { BrowserInitializationId } from '../contracts/generated/BrowserInitializationId'

const DB_NAME = 'metamorph-identity-browser-v2'
const STORE_NAME = 'browser'
const DB_VERSION = 1
const RECORD_KEY = 'identity'
const HEAD_LIFETIME_MS = 30 * 24 * 60 * 60 * 1_000
// A capsule may still have almost 30 days of forward lifetime. A committed
// browser logout then retains target authority for a further 30 days, plus
// skew/finalization margin. This is the immutable v1 client-side ceiling; the
// server remains authoritative and may terminalize or safely detach earlier.
const LOGOUT_RECOVERY_LIFETIME_MS = 61 * 24 * 60 * 60 * 1_000
const CATALOG_VERSION = /^[A-Za-z0-9._-]{1,64}$/u
const CATALOG_ID = /^[a-z0-9](?:[a-z0-9]|[._-](?=[a-z0-9])){0,95}$/u
const UUID7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u

export interface BrowserHeadState {
  readonly state: 'active'
  readonly schemaVersion: 1
  readonly browserHeadId: string
  readonly browserInitializationId: BrowserInitializationId
  readonly placement: BrowserControllerPlacement
  readonly createdAt: string
  readonly lastUsedAt: string
  readonly absoluteExpiresAt: string
}

export interface BrowserControllerPlacement {
  readonly algorithmVersion: 1
  readonly catalogVersion: string
  readonly catalogDigest: string
  readonly controllerRegionId: string
}

export interface LogoutPendingState {
  readonly state: 'logoutPending'
  readonly schemaVersion: 1
  readonly source: BrowserHeadState
  readonly prepareAttemptId: string
  readonly operationId: string | null
  readonly startedAt: string
  readonly recoveryExpiresAt: string
}

export type BrowserIdentityRecord = BrowserHeadState | LogoutPendingState

export class BrowserLogoutPendingError extends Error {
  constructor(readonly pending: LogoutPendingState) {
    super('Browser-wide sign-out is still in progress')
    this.name = 'BrowserLogoutPendingError'
  }
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result)
    value.onerror = () => reject(value.error ?? new Error('IndexedDB request failed'))
  })
}

function committed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

async function database(): Promise<IDBDatabase> {
  const open = indexedDB.open(DB_NAME, DB_VERSION)
  open.onupgradeneeded = () => {
    if (!open.result.objectStoreNames.contains(STORE_NAME)) open.result.createObjectStore(STORE_NAME)
  }
  return request(open)
}

async function withStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  const db = await database()
  const tx = db.transaction(STORE_NAME, mode)
  try {
    const result = await work(tx.objectStore(STORE_NAME))
    await committed(tx)
    return result
  } catch (error) {
    try { tx.abort() } catch { /* already committed or aborted */ }
    throw error
  } finally {
    db.close()
  }
}

function validSecret(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/u.test(value)
}

function validTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value
}

function exactKeys(record: Record<string, unknown>, names: readonly string[]): boolean {
  const keys = Object.keys(record)
  return keys.length === names.length && names.every((name) => Object.hasOwn(record, name))
}

function isHead(value: unknown, requireCurrent = true): value is BrowserHeadState {
  if (value === null || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (!exactKeys(record, [
    'state', 'schemaVersion', 'browserHeadId', 'browserInitializationId', 'placement',
    'createdAt', 'lastUsedAt', 'absoluteExpiresAt',
  ])) return false
  if (record.placement === null || typeof record.placement !== 'object') return false
  const placement = record.placement as Record<string, unknown>
  if (!exactKeys(placement, [
    'algorithmVersion', 'catalogVersion', 'catalogDigest', 'controllerRegionId',
  ])) return false
  return record.state === 'active' && record.schemaVersion === 1 &&
    validSecret(record.browserHeadId) && validSecret(record.browserInitializationId) &&
    placement.algorithmVersion === 1 && typeof placement.catalogVersion === 'string' &&
    CATALOG_VERSION.test(placement.catalogVersion) && validSecret(placement.catalogDigest) &&
    typeof placement.controllerRegionId === 'string' && CATALOG_ID.test(placement.controllerRegionId) &&
    validTimestamp(record.createdAt) && validTimestamp(record.lastUsedAt) &&
    validTimestamp(record.absoluteExpiresAt) &&
    Date.parse(record.createdAt as string) <= Date.parse(record.lastUsedAt as string) &&
    Date.parse(record.lastUsedAt as string) <= Date.parse(record.absoluteExpiresAt as string) &&
    (!requireCurrent || Date.parse(record.absoluteExpiresAt) > Date.now())
}

function isLogoutPending(value: unknown): value is LogoutPendingState {
  if (value === null || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (!exactKeys(record, [
    'state', 'schemaVersion', 'source', 'prepareAttemptId', 'operationId', 'startedAt',
    'recoveryExpiresAt',
  ])) return false
  return record.state === 'logoutPending' && record.schemaVersion === 1 &&
    isHead(record.source, false) && validSecret(record.prepareAttemptId) &&
    (record.operationId === null || (typeof record.operationId === 'string' && UUID7.test(record.operationId))) &&
    validTimestamp(record.startedAt) && validTimestamp(record.recoveryExpiresAt) &&
    Date.parse(record.startedAt as string) <= Date.parse(record.recoveryExpiresAt as string) &&
    Date.parse(record.recoveryExpiresAt as string) > Date.now()
}

function createHead(browserInitializationId: BrowserInitializationId, placement: BrowserControllerPlacement): BrowserHeadState {
  const now = new Date()
  return Object.freeze({
    state: 'active',
    schemaVersion: 1,
    browserHeadId: base64Url(crypto.getRandomValues(new Uint8Array(32))),
    browserInitializationId,
    placement: Object.freeze({ ...placement }),
    createdAt: now.toISOString(),
    lastUsedAt: now.toISOString(),
    absoluteExpiresAt: new Date(now.getTime() + HEAD_LIFETIME_MS).toISOString(),
  })
}

export async function readBrowserIdentityRecord(): Promise<BrowserIdentityRecord | null> {
  const value = await withStore('readonly', (store) => request(store.get(RECORD_KEY)))
  if (isHead(value) || isLogoutPending(value)) return Object.freeze(value)
  return null
}

export async function readBrowserHead(): Promise<BrowserHeadState | null> {
  const record = await readBrowserIdentityRecord()
  if (record?.state === 'logoutPending') throw new BrowserLogoutPendingError(record)
  return record
}

export async function getOrCreateBrowserHead(
  selectPlacement: (browserInitializationId: BrowserInitializationId) => Promise<BrowserControllerPlacement>,
): Promise<BrowserHeadState> {
  const existing = await readBrowserHead()
  if (existing !== null) return existing
  const browserInitializationId = base64Url(crypto.getRandomValues(new Uint8Array(32)))
  const created = createHead(browserInitializationId, await selectPlacement(browserInitializationId))
  const result = await withStore('readwrite', async (store) => {
    const current: unknown = await request(store.get(RECORD_KEY))
    if (isLogoutPending(current)) throw new BrowserLogoutPendingError(Object.freeze(current))
    if (isHead(current)) return Object.freeze(current)
    await request(store.put(created, RECORD_KEY))
    return created
  })
  const verified = await readBrowserHead()
  if (verified === null || verified.browserHeadId !== result.browserHeadId ||
      verified.browserInitializationId !== result.browserInitializationId) {
    throw new Error('Browser initialization state did not commit')
  }
  return verified
}

export async function beginBrowserLogout(
  expectedHead: BrowserHeadState,
  prepareAttemptId: string,
): Promise<LogoutPendingState> {
  const pending = await withStore('readwrite', async (store) => {
    const current: unknown = await request(store.get(RECORD_KEY))
    if (isLogoutPending(current)) {
      if (current.prepareAttemptId !== prepareAttemptId) throw new BrowserLogoutPendingError(Object.freeze(current))
      return Object.freeze(current)
    }
    if (!isHead(current) || current.browserHeadId !== expectedHead.browserHeadId ||
        current.browserInitializationId !== expectedHead.browserInitializationId) {
      throw new Error('Browser logout source no longer matches')
    }
    const now = new Date()
    const next: LogoutPendingState = Object.freeze({
      state: 'logoutPending',
      schemaVersion: 1,
      source: current,
      prepareAttemptId,
      operationId: null,
      startedAt: now.toISOString(),
      recoveryExpiresAt: new Date(now.getTime() + LOGOUT_RECOVERY_LIFETIME_MS).toISOString(),
    })
    await request(store.put(next, RECORD_KEY))
    return next
  })
  const verified = await readBrowserIdentityRecord()
  if (verified?.state !== 'logoutPending' || verified.prepareAttemptId !== prepareAttemptId) {
    throw new Error('Browser logout preparation did not commit')
  }
  return pending
}

export async function bindLogoutOperation(prepareAttemptId: string, operationId: string): Promise<LogoutPendingState> {
  const bound = await withStore('readwrite', async (store) => {
    const current: unknown = await request(store.get(RECORD_KEY))
    if (!isLogoutPending(current) || current.prepareAttemptId !== prepareAttemptId ||
        (current.operationId !== null && current.operationId !== operationId)) {
      throw new Error('Browser logout operation binding mismatch')
    }
    const next = Object.freeze({ ...current, operationId })
    await request(store.put(next, RECORD_KEY))
    return next
  })
  const verified = await readBrowserIdentityRecord()
  if (verified?.state !== 'logoutPending' || verified.operationId !== operationId) {
    throw new Error('Browser logout operation did not commit')
  }
  return bound
}

export async function completeBrowserLogout(expectedOperationId: string): Promise<void> {
  await withStore('readwrite', async (store) => {
    const current: unknown = await request(store.get(RECORD_KEY))
    if (!isLogoutPending(current) || current.operationId !== expectedOperationId) {
      throw new Error('Browser logout completion mismatch')
    }
    await request(store.delete(RECORD_KEY))
  })
  if (await readBrowserIdentityRecord() !== null) throw new Error('Browser logout record was not deleted')
}

export async function restoreBrowserAfterUncommittedLogout(expectedOperationId: string): Promise<BrowserHeadState> {
  const source = await withStore('readwrite', async (store) => {
    const current: unknown = await request(store.get(RECORD_KEY))
    if (!isLogoutPending(current) || current.operationId !== expectedOperationId) {
      throw new Error('Browser logout restoration mismatch')
    }
    await request(store.put(current.source, RECORD_KEY))
    return current.source
  })
  const verified = await readBrowserHead()
  if (verified === null || verified.browserHeadId !== source.browserHeadId) {
    throw new Error('Browser logout source was not restored')
  }
  return verified
}

export const __test = { isHead, isLogoutPending }
