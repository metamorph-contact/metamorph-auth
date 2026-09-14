import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthApi, ProtocolError } from './http'

describe('authentication HTTP boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('rejects non-origin bases and paths outside the reserved namespace', async () => {
    expect(() => new AuthApi('https://identity.example/path')).toThrow()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(new AuthApi('https://identity.example').get('/api/product/v1/me', 'recoveryAccepted'))
      .rejects.toThrow('Invalid authentication API path')
    await expect(new AuthApi('https://identity.example').get(
      '/api/auth/v1/../product/me', 'recoveryAccepted',
    )).rejects.toThrow('Invalid authentication API path')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses credentialed no-store CORS without a GET content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ schemaVersion: 1, accepted: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    vi.stubGlobal('fetch', fetchMock)
    await expect(new AuthApi('https://identity.example').get(
      '/api/auth/v1/password-recovery-requests/status',
      'recoveryAccepted',
    )).resolves.toEqual({ schemaVersion: 1, accepted: true })
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.credentials).toBe('include')
    expect(init.cache).toBe('no-store')
    expect(new Headers(init.headers).has('Content-Type')).toBe(false)
  })

  it('fails closed on a successful response with the wrong media type', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ schemaVersion: 1, accepted: true }),
      { status: 200, headers: { 'Content-Type': 'text/plain' } },
    )))
    await expect(new AuthApi('https://identity.example').get(
      '/api/auth/v1/password-recovery-requests/status',
      'recoveryAccepted',
    )).rejects.toMatchObject({ code: 'auth_invalid_response', retryable: true })
  })

  it('marks an unreadable mutation response as outcome-uncertain', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"schemaVersion":1'))
        controller.error(new Error('connection reset'))
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))
    await expect(new AuthApi('https://identity.example').post(
      '/api/auth/v1/password-recovery-requests', {}, 'recoveryAccepted',
    )).rejects.toMatchObject({
      code: 'auth_outcome_uncertain',
      retryable: true,
      recoveryAction: 'retrySameOperation',
    })
  })

  it('marks an invalid successful mutation body as outcome-uncertain', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"schemaVersion":1}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))
    await expect(new AuthApi('https://identity.example').post(
      '/api/auth/v1/password-recovery-requests', {}, 'recoveryAccepted',
    )).rejects.toMatchObject({ code: 'auth_outcome_uncertain', retryable: true })
  })

  it('rejects an otherwise valid success from another wire version', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ schemaVersion: 2, accepted: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )))
    await expect(new AuthApi('https://identity.example').get(
      '/api/auth/v1/password-recovery-requests/status',
      'recoveryAccepted',
    )).rejects.toThrow()
  })

  it('rejects a protocol error whose action does not match its code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schemaVersion: 1,
      error: {
        code: 'auth.credentials.invalid', message: 'safe', details: { kind: 'empty' },
        correlationId: '01890f3a-6e3a-7c15-8c65-450b85e12a01', recovery: { action: 'restartProductAuth' },
      },
    }), { status: 401, headers: { 'Content-Type': 'application/json' } })))
    await expect(new AuthApi('https://identity.example').post(
      '/api/auth/v1/sign-ins', {}, 'recoveryAccepted',
    )).rejects.toMatchObject({ code: 'auth.internal.invariant' })
  })

  it('decodes the current protocol error on a retained signup or recovery endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schemaVersion: 1,
      error: {
        code: 'auth.dependency.unavailable', message: 'safe',
        details: { kind: 'empty' },
        correlationId: '01890f3a-6e3a-7c15-8c65-450b85e12a01',
        recovery: { action: 'retrySameOperation' },
      },
    }), { status: 503, headers: { 'Content-Type': 'application/json' } })))
    await expect(new AuthApi('https://identity.eu.example').post(
      '/api/auth/v1/password-recovery-requests', { schemaVersion: 1 }, 'recoveryAccepted',
    )).rejects.toMatchObject({
      code: 'auth.dependency.unavailable',
      retryable: true,
      recoveryAction: 'retrySameOperation',
    })
  })

  it('preserves the typed verified-domain conflict on signup', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schemaVersion: 1,
      error: {
        code: 'auth.signup.domain.conflict', message: 'safe', details: { kind: 'empty' },
        correlationId: '01890f3a-6e3a-7c15-8c65-450b85e12a01',
        recovery: { action: 'retryInput' },
      },
    }), { status: 409, headers: { 'Content-Type': 'application/json' } })))
    await expect(new AuthApi('https://identity.example').post(
      '/api/auth/v1/signups', { schemaVersion: 1 }, 'signupProgress',
    )).rejects.toMatchObject({
      code: 'auth.signup.domain.conflict',
      retryable: true,
      recoveryAction: 'retryInput',
    })
  })

  it('rejects a protocol code with the wrong status on a retained endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schemaVersion: 1,
      error: {
        code: 'auth.credentials.invalid', message: 'safe', details: { kind: 'empty' },
        correlationId: '01890f3a-6e3a-7c15-8c65-450b85e12a01',
        recovery: { action: 'retryCredentials' },
      },
    }), { status: 503, headers: { 'Content-Type': 'application/json' } })))
    await expect(new AuthApi('https://identity.eu.example').post(
      '/api/auth/v1/signups', { schemaVersion: 1 }, 'signupProgress',
    )).rejects.toMatchObject({ code: 'auth.internal.invariant' })
  })
})
