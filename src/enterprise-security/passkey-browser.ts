import type { IdentityPasskeyAssertResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityPasskeyAssertResultV1'
import type { IdentityPasskeyRegisterResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityPasskeyRegisterResultV1'
import type { WebAuthnCreationOptionsV1 } from '../contracts/generated/enterprise-security-v1/types/WebAuthnCreationOptionsV1'
import type { PasskeyBrowserAdapter } from './identity-ceremony-client'

// The browser only produces evidence. Identity home verifies it and decides
// whether a ceremony can advance; this adapter never creates a session.
function decode(value: string, maximumBytes: number): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/u.test(value) || value.length > Math.ceil(maximumBytes * 4 / 3) + 2) {
    throw new Error('Invalid WebAuthn input')
  }
  const padded = value.replace(/-/gu, '+').replace(/_/gu, '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  if (binary.length === 0 || binary.length > maximumBytes) throw new Error('Invalid WebAuthn input')
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  if (encode(bytes) !== value) throw new Error('Non-canonical WebAuthn input')
  return bytes
}

function encode(value: ArrayBuffer | ArrayBufferView): string {
  const bytes = value instanceof ArrayBuffer
    ? new Uint8Array(value)
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '')
}

function encodeBounded(value: ArrayBuffer | ArrayBufferView, maximumBytes: number): string {
  if (value.byteLength === 0 || value.byteLength > maximumBytes) throw new Error('Invalid WebAuthn evidence size')
  return encode(value)
}

function decodeChallenge(value: string): Uint8Array<ArrayBuffer> {
  const challenge = decode(value, 32)
  if (challenge.byteLength !== 32) throw new Error('Invalid WebAuthn challenge')
  return challenge
}

function available(signal: AbortSignal, expiresAt: string): void {
  signal.throwIfAborted()
  const expiry = Date.parse(expiresAt)
  if (!globalThis.isSecureContext || !navigator.credentials || !Number.isFinite(expiry) || expiry <= Date.now()) {
    throw new Error('WebAuthn ceremony unavailable')
  }
}

function creationOptions(options: WebAuthnCreationOptionsV1): PublicKeyCredentialCreationOptions {
  const algorithms = [-7]
  if (options.algorithmProfile === 'es256_rs256' || options.algorithmProfile === 'es256_rs256_ed_dsa') algorithms.push(-257)
  if (options.algorithmProfile === 'es256_ed_dsa' || options.algorithmProfile === 'es256_rs256_ed_dsa') algorithms.push(-8)
  return {
    rp: { id: options.rpId, name: options.rpName },
    user: { id: decode(options.userHandle, 64), name: options.userName, displayName: options.userDisplayName },
    challenge: decodeChallenge(options.challenge),
    pubKeyCredParams: algorithms.map((alg) => ({ type: 'public-key' as const, alg })),
    timeout: options.timeoutMs,
    authenticatorSelection: {
      residentKey: options.residentKey,
      userVerification: options.userVerification,
      ...(options.attachment ? { authenticatorAttachment: options.attachment === 'cross_platform' ? 'cross-platform' as const : 'platform' as const } : {}),
    },
    attestation: options.attestation,
  }
}

export const passkeyBrowserAdapter: PasskeyBrowserAdapter = {
  async assert(challenge: Extract<IdentityPasskeyAssertResultV1, { kind: 'challenge' }>, signal) {
    available(signal, challenge.expiresAt)
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: decodeChallenge(challenge.challenge),
        rpId: challenge.rpId,
        userVerification: challenge.userVerification,
      },
      signal,
    })
    if (!(credential instanceof PublicKeyCredential) || !(credential.response instanceof AuthenticatorAssertionResponse)) {
      throw new Error('Unexpected WebAuthn assertion')
    }
    signal.throwIfAborted()
    return {
      credentialId: encodeBounded(credential.rawId, 1024),
      clientDataJson: encodeBounded(credential.response.clientDataJSON, 8192),
      authenticatorData: encodeBounded(credential.response.authenticatorData, 8192),
      signature: encodeBounded(credential.response.signature, 4096),
      userHandle: credential.response.userHandle ? encodeBounded(credential.response.userHandle, 64) : null,
    }
  },
  async register(challenge: Extract<IdentityPasskeyRegisterResultV1, { kind: 'challenge' }>, signal) {
    available(signal, challenge.expiresAt)
    const credential = await navigator.credentials.create({ publicKey: creationOptions(challenge.options), signal })
    if (!(credential instanceof PublicKeyCredential) || !(credential.response instanceof AuthenticatorAttestationResponse)) {
      throw new Error('Unexpected WebAuthn registration')
    }
    signal.throwIfAborted()
    const transports = credential.response.getTransports()
    return {
      rawCredentialId: encodeBounded(credential.rawId, 1024),
      clientDataJson: encodeBounded(credential.response.clientDataJSON, 8192),
      attestationObject: encodeBounded(credential.response.attestationObject, 64 * 1024),
      transports: {
        usb: transports.includes('usb'), nfc: transports.includes('nfc'),
        ble: transports.includes('ble'), internal: transports.includes('internal'), hybrid: transports.includes('hybrid'),
      },
      attachment: credential.authenticatorAttachment === 'platform' ? 'platform'
        : credential.authenticatorAttachment === 'cross-platform' ? 'cross_platform' : null,
      discoverableCredential: null,
    }
  },
}
