import { afterEach, describe, expect, it, vi } from 'vitest'
import type { IdentityPasskeyAssertResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityPasskeyAssertResultV1'
import type { IdentityPasskeyRegisterResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityPasskeyRegisterResultV1'
import { passkeyBrowserAdapter } from './passkey-browser'

const bytes = (...values: number[]) => Uint8Array.from(values).buffer
const future = '2099-01-01T00:00:00Z'
const challengeBytes = new Uint8Array(32).fill(1)
const challengeValue = 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE'
const assertion: Extract<IdentityPasskeyAssertResultV1, { kind: 'challenge' }> = {
  kind: 'challenge', schemaVersion: 1, ceremonyId: 'ceremony', rpId: 'example.com',
  challenge: challengeValue, userVerification: 'required', expiresAt: future,
}
const registration: Extract<IdentityPasskeyRegisterResultV1, { kind: 'challenge' }> = {
  kind: 'challenge', schemaVersion: 1, ceremonyId: 'ceremony', expiresAt: future,
  options: {
    rpId: 'example.com', rpName: 'Example', userHandle: 'BAUG', userName: 'person@example.com',
    userDisplayName: 'Person', challenge: challengeValue, algorithmProfile: 'es256_rs256_ed_dsa',
    timeoutMs: 60_000, residentKey: 'required', userVerification: 'required',
    attachment: 'cross_platform', attestation: 'none',
  },
}

class AssertionResponse {
  clientDataJSON = bytes(1)
  authenticatorData = bytes(2)
  signature = bytes(3)
  userHandle = bytes(4)
}
class AttestationResponse {
  clientDataJSON = bytes(1)
  attestationObject = bytes(2)
  getTransports = () => ['usb', 'hybrid', 'unexpected']
}
class Credential {
  rawId = bytes(5)
  authenticatorAttachment = 'cross-platform'
  constructor(readonly response: AssertionResponse | AttestationResponse) {}
}

afterEach(() => vi.unstubAllGlobals())

describe('passkey browser evidence adapter', () => {
  it('passes RP-bound assertion options and serializes only credential evidence', async () => {
    const get = vi.fn().mockResolvedValue(new Credential(new AssertionResponse()))
    vi.stubGlobal('isSecureContext', true)
    vi.stubGlobal('PublicKeyCredential', Credential)
    vi.stubGlobal('AuthenticatorAssertionResponse', AssertionResponse)
    vi.stubGlobal('navigator', { credentials: { get } })

    const result = await passkeyBrowserAdapter.assert(assertion, new AbortController().signal)
    expect(get).toHaveBeenCalledWith(expect.objectContaining({
      publicKey: { challenge: challengeBytes, rpId: 'example.com', userVerification: 'required' },
    }))
    expect(result).toEqual({ credentialId: 'BQ', clientDataJson: 'AQ', authenticatorData: 'Ag', signature: 'Aw', userHandle: 'BA' })
  })

  it('maps the closed algorithm profile and ignores unsupported transport hints', async () => {
    const create = vi.fn().mockResolvedValue(new Credential(new AttestationResponse()))
    vi.stubGlobal('isSecureContext', true)
    vi.stubGlobal('PublicKeyCredential', Credential)
    vi.stubGlobal('AuthenticatorAttestationResponse', AttestationResponse)
    vi.stubGlobal('navigator', { credentials: { create } })

    const result = await passkeyBrowserAdapter.register(registration, new AbortController().signal)
    const options = create.mock.calls[0][0].publicKey as PublicKeyCredentialCreationOptions
    expect(options.pubKeyCredParams.map((entry) => entry.alg)).toEqual([-7, -257, -8])
    expect(options.user.id).toEqual(Uint8Array.from([4, 5, 6]))
    expect(options.authenticatorSelection?.authenticatorAttachment).toBe('cross-platform')
    expect(result).toEqual({
      rawCredentialId: 'BQ', clientDataJson: 'AQ', attestationObject: 'Ag',
      transports: { usb: true, nfc: false, ble: false, internal: false, hybrid: true },
      attachment: 'cross_platform', discoverableCredential: null,
    })
  })

  it('preserves an RSA-sized assertion signature admitted by the contract', async () => {
    const response = new AssertionResponse()
    response.signature = new Uint8Array(256).fill(7).buffer
    vi.stubGlobal('isSecureContext', true)
    vi.stubGlobal('PublicKeyCredential', Credential)
    vi.stubGlobal('AuthenticatorAssertionResponse', AssertionResponse)
    vi.stubGlobal('navigator', { credentials: { get: vi.fn().mockResolvedValue(new Credential(response)) } })

    const result = await passkeyBrowserAdapter.assert(assertion, new AbortController().signal)
    expect(result.signature.length).toBe(342)
  })

  it('rejects non-canonical challenge bytes before calling the authenticator', async () => {
    const get = vi.fn()
    vi.stubGlobal('isSecureContext', true)
    vi.stubGlobal('navigator', { credentials: { get } })
    await expect(passkeyBrowserAdapter.assert({ ...assertion, challenge: 'AR' }, new AbortController().signal))
      .rejects.toThrow('Non-canonical WebAuthn input')
    await expect(passkeyBrowserAdapter.assert({ ...assertion, challenge: 'AQID' }, new AbortController().signal))
      .rejects.toThrow('Invalid WebAuthn challenge')
    await expect(passkeyBrowserAdapter.assert({ ...assertion, expiresAt: 'not-a-date' }, new AbortController().signal))
      .rejects.toThrow('WebAuthn ceremony unavailable')
    expect(get).not.toHaveBeenCalled()
  })
})
