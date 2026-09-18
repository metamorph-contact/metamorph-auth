import { beforeEach, describe, expect, it } from 'vitest'

import {
  __test,
  clearStartRecovery,
  readDestinationContinuation,
  readRelayResumption,
  readStartRecovery,
  saveStartRecovery,
  saveDestinationContinuation,
  saveRelayResumption,
} from './session-receipts'

const continuation = {
  kind: 'destination' as const,
  flow: '01890f3a-6e3a-7c15-8c65-450b85e12a01',
  operation: '01890f3a-6e3a-7c15-8c65-450b85e12a02',
  digest: 'd'.repeat(43),
  receipt: 'header.payload.signature',
}

describe('tab-scoped recovery receipts', () => {
  beforeEach(() => sessionStorage.clear())

  it('write/read-verifies the complete destination continuation', () => {
    expect(saveDestinationContinuation(continuation)).toEqual(continuation)
    expect(readDestinationContinuation()).toEqual(continuation)
  })

  it('write/read-verifies the non-authorizing relay resumption receipt', () => {
    const relay = {
      kind: 'relayResumption' as const,
      operation: '01890f3a-6e3a-7c15-8c65-450b85e12a02',
      resume: 'header.payload.signature',
    }
    expect(saveRelayResumption(relay)).toEqual(relay)
    expect(readRelayResumption()).toEqual(relay)
    expect(readDestinationContinuation()).toBeNull()
  })

  it('retains only the non-authorizing start recovery receipt', () => {
    const start = {
      kind: 'initial' as const,
      projection: 'octamorph-browser',
      controller: 'local-a',
      catalog: 'central-development-6',
      digest: 'd'.repeat(43),
      recovery: 'header.payload.signature',
      start: 'header.encrypted-key.iv.ciphertext.tag',
    }
    expect(saveStartRecovery(start)).toEqual({
      schemaVersion: 1,
      projection: start.projection,
      catalog: start.catalog,
      digest: start.digest,
      recovery: start.recovery,
    })
    expect(sessionStorage.getItem('metamorph.auth.start-recovery.v1')).not.toContain(start.start)
    clearStartRecovery(start.recovery)
    expect(readStartRecovery()).toBeNull()
  })

  it('scrubs malformed recovery records when read', () => {
    sessionStorage.setItem('metamorph.auth.destination.v1', '{"invalid":true}')
    expect(readDestinationContinuation()).toBeNull()
    expect(sessionStorage.getItem('metamorph.auth.destination.v1')).toBeNull()
  })

  it('rejects dotless values where a compact protected receipt is required', () => {
    expect(() => saveDestinationContinuation({ ...continuation, receipt: 'r'.repeat(43) })).toThrow()
    expect(() => saveStartRecovery({
      kind: 'initial',
      projection: 'octamorph-browser',
      controller: 'local-a',
      catalog: 'central-development-15',
      digest: 'd'.repeat(43),
      recovery: 'r'.repeat(43),
      start: 'header.encrypted-key.iv.ciphertext.tag',
    })).toThrow()
  })

  it('rejects extended or future-dated records', () => {
    const base = {
      schemaVersion: 1,
      ...continuation,
      receivedAt: new Date().toISOString(),
    }
    const { kind: _kind, ...stored } = base
    expect(__test.valid({ ...stored, extra: true })).toBe(false)
    expect(__test.valid({ ...stored, receivedAt: new Date(Date.now() + 120_000).toISOString() })).toBe(false)
  })
})
