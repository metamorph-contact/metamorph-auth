import { afterEach, describe, expect, it, vi } from 'vitest'

import type { LoadedIdentityCatalog } from '../catalog/runtime'
import {
  cachedRealmSocialAuthorization,
  clearRealmSocialAuthorization,
  chooseAccount,
  completeRecovery,
  currentRealmSocialAuthorization,
  loadAccounts,
  signIn,
  startSignup,
  type DisplayAccount,
  type IdentityFlow,
  type SignupStartAttempt,
} from './client'
import { AuthApi, ProtocolError } from './http'

const operationId = '01890f3a-6e3a-7c15-8c65-450b85e12a01'
const expiresAt = '2030-01-01T00:00:00Z'

describe('realm social authorization', () => {
  it('reuses the live purpose-scoped capability and clears it for email routing', async () => {
    const post = vi.fn().mockResolvedValue({
      action: 'socialRoute',
      schemaVersion: 1,
      federationFlowAuthorization: 'realm.social.authorization',
      expiresAt,
    })
    const flow = {
      controller: { post },
      bootstrap: { flowId: operationId, csrfToken: 'c'.repeat(43), expiresAt },
    } as unknown as IdentityFlow
    const signal = new AbortController().signal

    await expect(currentRealmSocialAuthorization(flow, signal)).resolves.toBe('realm.social.authorization')
    await expect(currentRealmSocialAuthorization(flow, signal)).resolves.toBe('realm.social.authorization')
    expect(cachedRealmSocialAuthorization(flow)).toBe('realm.social.authorization')
    expect(post).toHaveBeenCalledWith(`/api/auth/v1/flows/${operationId}/credential-capabilities`, { schemaVersion: 1, action: 'socialRoute' }, 'credentialCapability', 'c'.repeat(43), {}, expect.any(AbortSignal))
    expect(post.mock.calls[0]?.[5]).not.toBe(signal)
    expect(post).toHaveBeenCalledTimes(1)
    clearRealmSocialAuthorization(flow)
    expect(cachedRealmSocialAuthorization(flow)).toBeNull()
  })

  it('keeps concurrent callers cancellation-independent', async () => {
    let resolveCapability: ((value: unknown) => void) | undefined
    const post = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCapability = resolve
        }),
    )
    const flow = {
      controller: { post },
      bootstrap: { flowId: operationId, csrfToken: 'c'.repeat(43), expiresAt },
    } as unknown as IdentityFlow
    const first = new AbortController()
    const second = new AbortController()

    const abandoned = currentRealmSocialAuthorization(flow, first.signal)
    const retained = currentRealmSocialAuthorization(flow, second.signal)
    first.abort(new Error('abandoned'))
    await expect(abandoned).rejects.toThrow('abandoned')
    resolveCapability?.({
      action: 'socialRoute',
      schemaVersion: 1,
      federationFlowAuthorization: 'realm.social.authorization',
      expiresAt,
    })
    await expect(retained).resolves.toBe('realm.social.authorization')
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('aborts underlying issuance and discards a late capability when cleared', async () => {
    let resolveCapability: ((value: unknown) => void) | undefined
    let issuanceSignal: AbortSignal | undefined
    const post = vi.fn().mockImplementation((...args: unknown[]) => {
      issuanceSignal = args[5] as AbortSignal
      return new Promise((resolve) => {
        resolveCapability = resolve
      })
    })
    const flow = {
      controller: { post },
      bootstrap: { flowId: operationId, csrfToken: 'c'.repeat(43), expiresAt },
    } as unknown as IdentityFlow

    const pending = currentRealmSocialAuthorization(flow)
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    clearRealmSocialAuthorization(flow)
    expect(issuanceSignal?.aborted).toBe(true)
    resolveCapability?.({
      action: 'socialRoute',
      schemaVersion: 1,
      federationFlowAuthorization: 'late.realm.social.authorization',
      expiresAt,
    })
    await expect(pending).rejects.toThrow('security.ceremony.expired')
    expect(cachedRealmSocialAuthorization(flow)).toBeNull()
  })
})

describe('password ingress', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('allows a multibyte replacement above the old 1024-byte sign-in guard', async () => {
    const post = vi.fn().mockResolvedValue({ schemaVersion: 1, kind: 'completed' })
    const home = { post } as unknown as AuthApi
    const request = {
      newPassword: '界'.repeat(384),
      completionAttemptId: operationId,
    } as Parameters<typeof completeRecovery>[1]
    await completeRecovery(home, request)
    expect(post).toHaveBeenCalledWith('/api/auth/v1/password-recoveries/complete', request, 'recoveryCompleted', undefined, { 'Idempotency-Key': operationId })
    await expect(completeRecovery(home, { ...request, newPassword: '界'.repeat(5462) })).rejects.toThrow('Invalid password')
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('reuses an email-method preparation instead of racing a second credential operation', async () => {
    const controllerPost = vi.fn().mockResolvedValue({
      schemaVersion: 1,
      kind: 'recover',
      attemptId: operationId,
      identityApiOrigin: 'https://identity.eu.example',
      recoveryCapability: 'recovery.capability.value',
      retryMaterial: {
        credentialCapability: 'credential.capability.value',
        registrationProof: 'registration.proof.value',
        federationFlowAuthorization: 'federation.authorization.value',
      },
      expiresAt,
    })
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schemaVersion: 1,
      kind: 'credentialRejected',
      recoveryAction: 'retryCredentials',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const flow = {
      catalog: {
        projection: {
          catalogVersion: 'v1',
          regions: [{ regionId: 'eu', identityOrigin: 'https://identity.eu.example' }],
        },
      } as unknown as LoadedIdentityCatalog,
      controller: { post: controllerPost },
      bootstrap: { flowId: operationId, csrfToken: 'c'.repeat(43) },
    } as unknown as IdentityFlow

    await expect(signIn(flow, 'person@example.com', 'correct horse battery staple'))
      .resolves.toMatchObject({ kind: 'credentialRejected' })

    expect(controllerPost).toHaveBeenCalledTimes(1)
    expect(controllerPost).toHaveBeenCalledWith(
      `/api/auth/v1/flows/${operationId}/credential-attempt-recovery`,
      { schemaVersion: 1 },
      'credentialAttemptRecovery',
      'c'.repeat(43),
    )
    const request = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<string, unknown>
    expect(request).toMatchObject({
      email: 'person@example.com',
      attemptId: operationId,
      capability: 'credential.capability.value',
      registrationProof: 'registration.proof.value',
    })
  })
})

describe('identity workflow recovery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reuses the exact signup operation after a lost creation response', async () => {
    const controllerPost = vi
      .fn()
      .mockResolvedValueOnce({
        action: 'signUp',
        schemaVersion: 1,
        establishmentOperationId: operationId,
        destinationCapability: 'a.b.c',
        expiresAt,
      })
      .mockResolvedValueOnce({
        schemaVersion: 1,
        kind: 'registered',
        signupId: operationId,
        registrationProof: 'd.e.f',
        expiresAt,
      })
    const preparation = new Response(
      JSON.stringify({
        schemaVersion: 1,
        preparationReceipt: 'g.h.i',
        expiresAt,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
    const progress = new Response(
      JSON.stringify({
        schemaVersion: 1,
        kind: 'verificationPending',
        signupId: operationId,
        nextStep: 'checkEmail',
        csrfToken: 's'.repeat(43),
        resendAvailableAt: expiresAt,
        expiresAt,
      }),
      { status: 202, headers: { 'Content-Type': 'application/json' } },
    )
    const fetchMock = vi.fn().mockResolvedValueOnce(preparation).mockRejectedValueOnce(new TypeError('response lost')).mockResolvedValueOnce(progress)
    vi.stubGlobal('fetch', fetchMock)

    const catalog = {
      projection: {
        catalogVersion: 'v1',
        regions: [
          {
            regionId: 'eu',
            identityOrigin: 'https://identity.eu.example',
            controllerOrigin: 'https://controller.eu.example',
            productApiOrigin: 'https://api.eu.example',
          },
        ],
      },
    } as unknown as LoadedIdentityCatalog
    const flow = {
      catalog,
      controller: { post: controllerPost },
      bootstrap: { flowId: operationId, csrfToken: 'c'.repeat(43) },
    } as unknown as IdentityFlow
    const attempt: SignupStartAttempt = {
      email: 'person@example.com',
      regionId: 'eu',
    }

    await expect(startSignup(flow, attempt)).rejects.toBeInstanceOf(ProtocolError)
    await expect(startSignup(flow, attempt)).resolves.toMatchObject({
      progress: { kind: 'verificationPending', signupId: operationId },
    })

    expect(controllerPost).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const firstCreateHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers)
    const retriedCreateHeaders = new Headers(fetchMock.mock.calls[2]?.[1]?.headers)
    expect(firstCreateHeaders.get('Idempotency-Key')).toBe(operationId)
    expect(retriedCreateHeaders.get('Idempotency-Key')).toBe(operationId)
  })
})

describe('account option reconciliation', () => {
  afterEach(() => vi.unstubAllGlobals())

  function accountFlow(controllerPost: ReturnType<typeof vi.fn>): IdentityFlow {
    return {
      catalog: {
        projection: {
          catalogVersion: 'v1',
          regions: [{ regionId: 'eu', identityOrigin: 'https://identity.eu.example' }],
        },
      } as unknown as LoadedIdentityCatalog,
      controller: { post: controllerPost },
      bootstrap: { flowId: operationId, csrfToken: 'c'.repeat(43) },
    } as unknown as IdentityFlow
  }

  const reference = {
    browserAccountId: operationId,
    capsuleGeneration: 'generation-1',
    homeRegionId: 'eu',
    identityApiOrigin: 'https://identity.eu.example',
    metadataCapability: 'a.b.c',
    expiresAt,
  }

  it('submits an authoritative invalid home outcome instead of silently dropping it', async () => {
    const controllerPost = vi.fn().mockImplementation((path: string) =>
      path.endsWith('/accounts')
        ? Promise.resolve({
            schemaVersion: 1,
            accounts: [reference],
            capsuleRepair: 'notRequired',
          })
        : Promise.resolve({
            schemaVersion: 1,
            kind: 'invalid',
            browserAccountId: operationId,
          }),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            schemaVersion: 1,
            kind: 'invalid',
            validationAttemptId: operationId,
            outcome: 'invalid.outcome.sig',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    await expect(loadAccounts(accountFlow(controllerPost))).resolves.toEqual({
      accounts: [],
      unavailableCount: 0,
    })
    expect(controllerPost).toHaveBeenLastCalledWith(expect.stringContaining('/account-validations'), expect.objectContaining({ homeOutcome: 'invalid.outcome.sig' }), 'accountValidation', 'c'.repeat(43), { 'Idempotency-Key': operationId })
  })

  it('reports a home outage separately from a genuinely empty account list', async () => {
    const controllerPost = vi.fn().mockResolvedValue({
      schemaVersion: 1,
      accounts: [reference],
      capsuleRepair: 'notRequired',
    })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await expect(loadAccounts(accountFlow(controllerPost))).resolves.toEqual({
      accounts: [],
      unavailableCount: 1,
    })
  })

  it('forwards a source product route move receipt with the exact account selection', async () => {
    const controllerPost = vi.fn().mockResolvedValue({
      schemaVersion: 1,
      kind: 'relocate',
      navigationUri: 'https://product.in.example/auth/return',
      expiresAt,
    })
    const account = {
      reference,
      summary: {
        browserAccountId: operationId,
        validationReceipt: 'validation.receipt.signature',
      },
    } as unknown as DisplayAccount

    await expect(chooseAccount(accountFlow(controllerPost), account, operationId, 'route.move.receipt')).resolves.toBe('https://product.in.example/auth/return')

    expect(controllerPost).toHaveBeenCalledWith(
      `/api/auth/v1/flows/${operationId}/account-selections`,
      {
        schemaVersion: 1,
        selectionAttemptId: operationId,
        browserAccountId: operationId,
        validationReceipt: 'validation.receipt.signature',
        productRouteMoveReceipt: 'route.move.receipt',
      },
      'accountSelection',
      'c'.repeat(43),
    )
  })
})
