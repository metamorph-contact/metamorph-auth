import { describe, expect, it } from 'vitest'

import { buildSecurityErrorEnvelope } from '../contracts/generated/enterprise-security-v1/fixtures.generated'
import type { Plan03ResponseMap } from '../contracts/generated/enterprise-security-v1/plan03-operations.generated'
import { decodePlan03Error, decodePlan03Response } from './response-decode'

const unavailable = {
  kind: 'material_unavailable',
  schemaVersion: 1,
  ceremonyId: '018f0000-0000-7000-8000-000000000401',
  expiresAt: '2099-01-01T00:00:00Z',
} as const
const federated = {
  kind: 'federated',
  progress: {
    schemaVersion: 1,
    continuationId: '018f0000-0000-7000-8000-000000000411',
    ceremonyRevision: '1',
    nextStep: 'verify_factor',
    expiresAt: '2099-01-01T00:00:00Z',
  },
  launch: {
    schemaVersion: 1,
    attemptId: '018f0000-0000-7000-8000-000000000412',
    providerId: '018f0000-0000-7000-8000-000000000413',
    redirectRegistrationId: 'fixture.redirect',
    navigationUri: 'https://example.com/start',
    expiresAt: '2099-01-01T00:00:00Z',
  },
} as const

describe('EA-03 identity response ingress', () => {
  it('accepts a generated response shape and a generated security error', () => {
    expect(decodePlan03Response('identity.totp.enroll', JSON.stringify(unavailable))).toEqual(unavailable)
    const error = buildSecurityErrorEnvelope(0)
    expect(decodePlan03Error(JSON.stringify(error))).toEqual(error)
  })

  it('rejects unknown fields, duplicate members, wrong versions and oversized bodies', () => {
    expect(() => decodePlan03Response('identity.totp.enroll', JSON.stringify({ ...unavailable, seed: 'not-allowed' }))).toThrow()
    expect(() => decodePlan03Response('identity.totp.enroll', JSON.stringify({ ...unavailable, schemaVersion: 2 }))).toThrow()
    expect(() => decodePlan03Response('identity.totp.enroll', JSON.stringify(unavailable).replace('"kind":', '"kind":"first_display","kind":'))).toThrow()
    expect(() => decodePlan03Response('identity.totp.enroll', `${JSON.stringify(unavailable)}${' '.repeat(256 * 1024)}`)).toThrow()
  })

  it('rejects operation names inherited from the validator map prototype', () => {
    expect(() => decodePlan03Response('constructor' as keyof Plan03ResponseMap, '{}')).toThrow('Missing Plan 03 route')
  })

  it('applies the identity route response cap rather than the product cap', () => {
    expect(() => decodePlan03Response('identity.totp.enroll', `${JSON.stringify(unavailable)}${' '.repeat(65_536)}`)).toThrow()
  })

  it('applies Rust-equivalent provider URL control and canonical byte bounds', () => {
    expect(decodePlan03Response('identity.step_up.start', JSON.stringify(federated))).toEqual(federated)
    for (const navigationUri of [
      'https://example.com/pa\nth',
      `https://example.com/${'é'.repeat(700)}`,
    ]) {
      expect(() => decodePlan03Response('identity.step_up.start', JSON.stringify({
        ...federated,
        launch: { ...federated.launch, navigationUri },
      }))).toThrow()
    }
  })
})
