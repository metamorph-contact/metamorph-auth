import { afterEach, describe, expect, it, vi } from 'vitest'

import type { LoadedIdentityCatalog } from '../catalog/runtime'
import { chooseAccount, loadAccounts, startSignup, type DisplayAccount, type IdentityFlow, type SignupStartAttempt } from './client'
import { ProtocolError } from './http'

const operationId = '01890f3a-6e3a-7c15-8c65-450b85e12a01'
const expiresAt = '2030-01-01T00:00:00Z'

describe('identity workflow recovery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reuses the exact signup operation after a lost creation response', async () => {
    const controllerPost = vi.fn()
      .mockResolvedValueOnce({
        action: 'signUp', schemaVersion: 1, establishmentOperationId: operationId,
        destinationCapability: 'a.b.c', expiresAt,
      })
      .mockResolvedValueOnce({
        schemaVersion: 1, kind: 'registered', signupId: operationId,
        registrationProof: 'd.e.f', expiresAt,
      })
    const preparation = new Response(JSON.stringify({
      schemaVersion: 1, preparationReceipt: 'g.h.i', expiresAt,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    const progress = new Response(JSON.stringify({
      schemaVersion: 1,
      kind: 'verificationPending',
      signupId: operationId,
      nextStep: 'checkEmail',
      csrfToken: 's'.repeat(43),
      resendAvailableAt: expiresAt,
      expiresAt,
    }), { status: 202, headers: { 'Content-Type': 'application/json' } })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(preparation)
      .mockRejectedValueOnce(new TypeError('response lost'))
      .mockResolvedValueOnce(progress)
    vi.stubGlobal('fetch', fetchMock)

    const catalog = {
      projection: {
        catalogVersion: 'v1',
        regions: [{
          regionId: 'eu', identityOrigin: 'https://identity.eu.example',
          controllerOrigin: 'https://controller.eu.example', productApiOrigin: 'https://api.eu.example',
        }],
      },
    } as unknown as LoadedIdentityCatalog
    const flow = {
      catalog,
      controller: { post: controllerPost },
      bootstrap: { flowId: operationId, csrfToken: 'c'.repeat(43) },
    } as unknown as IdentityFlow
    const attempt: SignupStartAttempt = { email: 'person@example.com', regionId: 'eu' }

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
    const controllerPost = vi.fn().mockImplementation((path: string) => path.endsWith('/accounts')
      ? Promise.resolve({ schemaVersion: 1, accounts: [reference], capsuleRepair: 'notRequired' })
      : Promise.resolve({ schemaVersion: 1, kind: 'invalid', browserAccountId: operationId }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schemaVersion: 1,
      kind: 'invalid',
      validationAttemptId: operationId,
      outcome: 'invalid.outcome.sig',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(loadAccounts(accountFlow(controllerPost))).resolves.toEqual({
      accounts: [],
      unavailableCount: 0,
    })
    expect(controllerPost).toHaveBeenLastCalledWith(
      expect.stringContaining('/account-validations'),
      expect.objectContaining({ homeOutcome: 'invalid.outcome.sig' }),
      'accountValidation',
      'c'.repeat(43),
      { 'Idempotency-Key': operationId },
    )
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

    await expect(chooseAccount(
      accountFlow(controllerPost),
      account,
      operationId,
      'route.move.receipt',
    )).resolves.toBe('https://product.in.example/auth/return')

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
