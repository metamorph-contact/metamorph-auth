import { describe, expect, it } from 'vitest'

import {
  executePlan03IdentityRequest,
  Plan03IdentityHttpError,
  preparePlan03IdentityRequest,
} from './request-contract'

const attemptId = '018f0000-0000-7000-8000-000000000401'
const continuationId = '018f0000-0000-7000-8000-000000000402'
const mutationId = '018f0000-0000-7000-8000-000000000403'
const request = {
  schemaVersion: 1,
  attemptId,
  continuationId,
  expectedCeremonyRevision: '1',
} as const
const recoveryStart = {
  schemaVersion: 1,
  flowId: attemptId,
  realmId: 'fixture.realm',
  submittedEmail: 'user@example.com',
} as const

describe('EA-03 identity request contract', () => {
  it('pins the exact regional identity route and same-key wire body', () => {
    const prepared = preparePlan03IdentityRequest('identity.totp.enroll', request, mutationId)
    expect(prepared).toMatchObject({
      operationId: 'OP-IDN-011',
      path: '/api/auth/v1/security/identity/totp/enroll',
      method: 'POST',
      expectedStatus: 200,
      contractHeaders: { 'Idempotency-Key': mutationId },
    })
    expect(JSON.parse(prepared.body)).toEqual(request)
  })

  it('rejects missing, malformed or cross-surface idempotency requests', () => {
    expect(() => preparePlan03IdentityRequest('identity.totp.enroll', request)).toThrow()
    expect(() => preparePlan03IdentityRequest('identity.totp.enroll', request, mutationId.toUpperCase())).toThrow()
    expect(() => preparePlan03IdentityRequest('profile.authenticators.list' as never, request as never)).toThrow(
      'Wrong Plan 03 surface',
    )
  })

  it('validates the serialized request against the exact operation schema', () => {
    expect(() =>
      preparePlan03IdentityRequest(
        'identity.totp.enroll',
        { ...request, unexpected: true } as typeof request,
        mutationId,
      ),
    ).toThrow('Invalid Plan 03 request')
  })

  it('rejects a request larger than the exact EA-00H route limit', () => {
    const oversized = { ...request, filler: 'x'.repeat(65_536) }
    expect(() => preparePlan03IdentityRequest('identity.totp.enroll', oversized, mutationId)).toThrow(
      'Invalid Plan 03 request size',
    )
  })

  it('executes with credentials omitted and validates the exact typed response', async () => {
    const unavailable = {
      kind: 'material_unavailable',
      schemaVersion: 1,
      ceremonyId: attemptId,
      expiresAt: '2099-01-01T00:00:00Z',
    } as const
    const result = await executePlan03IdentityRequest(
      async (wire) => {
        expect(wire).toMatchObject({ credentials: 'omit', redirect: 'error' })
        return {
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify(unavailable),
          headers: {},
        }
      },
      'identity.totp.enroll',
      request,
      mutationId,
      new AbortController().signal,
    )
    expect(result).toEqual(unavailable)
  })

  it('rejects a valid error envelope at the wrong HTTP status', async () => {
    const body = JSON.stringify({
      schemaVersion: 1,
      correlationId: attemptId,
      error: { code: 'security.request.invalid' },
    })
    await expect(
      executePlan03IdentityRequest(
        async () => ({
          status: 403,
          contentType: 'application/json',
          body,
          headers: {},
        }),
        'identity.totp.enroll',
        request,
        mutationId,
        new AbortController().signal,
      ),
    ).rejects.toThrow('Invalid Plan 03 error status')
  })

  it('rejects state-bearing errors forbidden by the public-ceremony failure profile', async () => {
    const body = JSON.stringify({
      schemaVersion: 1,
      correlationId: attemptId,
      error: { code: 'security.operation.conflict', detail: { currentRevision: '2' } },
    })
    await expect(
      executePlan03IdentityRequest(
        async () => ({ status: 409, contentType: 'application/json', body, headers: {} }),
        'identity.totp.enroll',
        request,
        mutationId,
        new AbortController().signal,
      ),
    ).rejects.toThrow('Invalid Plan 03 failure profile')
  })

  it('rejects account-specific method state on an anonymous recovery start', async () => {
    const body = JSON.stringify({
      schemaVersion: 1,
      correlationId: attemptId,
      error: { code: 'security.method.disabled' },
    })
    await expect(
      executePlan03IdentityRequest(
        async () => ({ status: 403, contentType: 'application/json', body, headers: {} }),
        'identity.factor_recovery.start',
        recoveryStart,
        mutationId,
        new AbortController().signal,
      ),
    ).rejects.toThrow('Invalid Plan 03 failure profile')
  })

  it('requires canonical Retry-After agreement with bounded retry detail', async () => {
    const body = JSON.stringify({
      schemaVersion: 1,
      correlationId: attemptId,
      error: { code: 'security.request.rate_limited', detail: { retryAfterSeconds: 30 } },
    })
    await expect(
      executePlan03IdentityRequest(
        async () => ({
          status: 429,
          contentType: 'application/json',
          body,
          headers: { 'Retry-After': '30' },
        }),
        'identity.totp.enroll',
        request,
        mutationId,
        new AbortController().signal,
      ),
    ).rejects.toBeInstanceOf(Plan03IdentityHttpError)

    for (const headers of [{}, { 'Retry-After': '030' }, { 'Retry-After': '31' }]) {
      await expect(
        executePlan03IdentityRequest(
          async () => ({ status: 429, contentType: 'application/json', body, headers }),
          'identity.totp.enroll',
          request,
          mutationId,
          new AbortController().signal,
        ),
      ).rejects.toThrow('Invalid Plan 03 Retry-After')
    }
  })

  it('rejects Retry-After when the admitted error has no retry detail', async () => {
    const body = JSON.stringify({
      schemaVersion: 1,
      correlationId: attemptId,
      error: { code: 'security.provider.unavailable' },
    })
    await expect(
      executePlan03IdentityRequest(
        async () => ({
          status: 503,
          contentType: 'application/json',
          body,
          headers: { 'retry-after': '30' },
        }),
        'identity.totp.enroll',
        request,
        mutationId,
        new AbortController().signal,
      ),
    ).rejects.toThrow('Invalid Plan 03 Retry-After')
  })

  it('accepts a bounded 503 retry and rejects duplicate or out-of-range metadata', async () => {
    const body = (retryAfterSeconds: number) =>
      JSON.stringify({
        schemaVersion: 1,
        correlationId: attemptId,
        error: { code: 'security.owner.unavailable', detail: { retryAfterSeconds } },
      })
    await expect(
      executePlan03IdentityRequest(
        async () => ({
          status: 503,
          contentType: 'application/json',
          body: body(300),
          headers: { 'Retry-After': '300' },
        }),
        'identity.totp.enroll',
        request,
        mutationId,
        new AbortController().signal,
      ),
    ).rejects.toBeInstanceOf(Plan03IdentityHttpError)
    for (const [retryAfterSeconds, headers] of [
      [301, { 'Retry-After': '301' }],
      [30, { 'Retry-After': '30', 'retry-after': '30' }],
    ] as const) {
      await expect(
        executePlan03IdentityRequest(
          async () => ({
            status: 503,
            contentType: 'application/json',
            body: body(retryAfterSeconds),
            headers,
          }),
          'identity.totp.enroll',
          request,
          mutationId,
          new AbortController().signal,
        ),
      ).rejects.toThrow(/Invalid Plan 03 (Retry-After|response headers)/)
    }
  })
})
