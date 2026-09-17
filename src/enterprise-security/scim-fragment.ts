import { decodeBoundedJsonText } from '../contracts/decode'
import {
  scim_entry,
  identity_scim_primary_email_verify_request,
} from './scim-validators.generated'
import type { IdentityScimActivationEntryV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityScimActivationEntryV1'

export type ScimActivationFragment = {
  entry: IdentityScimActivationEntryV1
  catalogDigest: string
  challenge?: { challengeId: string; proof: string }
}
export function parseScimFragment(hash: string): ScimActivationFragment {
  if (!/^#scim=[A-Za-z0-9_-]+$/u.test(hash) || hash.length > 65_536)
    throw new Error('Invalid activation link')
  const encoded = hash.slice(6)
  if (encoded.length % 4 === 1) throw new Error('Invalid activation link')
  const bytes = Uint8Array.from(
    atob(encoded.replaceAll('-', '+').replaceAll('_', '/')),
    (c) => c.charCodeAt(0),
  )
  const canonical = btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
  if (canonical !== encoded) throw new Error('Invalid activation link')
  const value = decodeBoundedJsonText(
    new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    49_152,
  ) as Record<string, unknown>
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some(
      (key) => !['entry', 'catalogDigest', 'challenge'].includes(key),
    ) ||
    !scim_entry(value.entry) ||
    typeof value.catalogDigest !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/u.test(value.catalogDigest)
  )
    throw new Error('Invalid activation link')
  const entry = value.entry as IdentityScimActivationEntryV1
  if (value.challenge !== undefined) {
    const challenge = value.challenge as Record<string, unknown>
    if (
      challenge === null ||
      typeof challenge !== 'object' ||
      Array.isArray(challenge) ||
      Object.keys(challenge).length !== 2 ||
      !identity_scim_primary_email_verify_request({
        ceremony: entry.ceremony,
        startCapability: entry.startCapability,
        ...challenge,
      })
    )
      throw new Error('Invalid activation link')
  }
  return value as unknown as ScimActivationFragment
}
export function consumeScimFragment(): ScimActivationFragment {
  const hash = window.__MM_AUTH_FRAGMENT_V1__ ?? window.location.hash
  delete window.__MM_AUTH_FRAGMENT_V1__
  if (window.location.hash)
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search,
    )
  return parseScimFragment(hash)
}
