import { describe, expect, it } from 'vitest'

import { __test } from './head-store'

const secret = 's'.repeat(43)
const now = Date.now()
const head = {
  state: 'active',
  schemaVersion: 1,
  browserHeadId: secret,
  browserInitializationId: 'i'.repeat(43),
  placement: {
    algorithmVersion: 1,
    catalogVersion: 'central-development-7',
    catalogDigest: 'd'.repeat(43),
    controllerRegionId: 'local-a',
  },
  createdAt: new Date(now - 10_000).toISOString(),
  lastUsedAt: new Date(now - 5_000).toISOString(),
  absoluteExpiresAt: new Date(now + 10_000).toISOString(),
}

describe('browser identity record validation', () => {
  it('accepts the exact current active record', () => {
    expect(__test.isHead(head)).toBe(true)
  })

  it('rejects extensions and invalid temporal order', () => {
    expect(__test.isHead({ ...head, unexpected: true })).toBe(false)
    expect(__test.isHead({ ...head, lastUsedAt: new Date(now + 20_000).toISOString() })).toBe(false)
  })

  it('accepts only the exact live logout-pending union arm', () => {
    const pending = {
      state: 'logoutPending',
      schemaVersion: 1,
      source: head,
      prepareAttemptId: 'p'.repeat(43),
      operationId: '01890f3a-6e3a-7c15-8c65-450b85e12a01',
      startedAt: new Date(now - 1_000).toISOString(),
      recoveryExpiresAt: new Date(now + 10_000).toISOString(),
    }
    expect(__test.isLogoutPending(pending)).toBe(true)
    expect(__test.isLogoutPending({ ...pending, controllerOrigin: 'https://example.com' })).toBe(false)
  })
})
