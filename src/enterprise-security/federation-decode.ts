import { decodeBoundedJsonText } from '../contracts/decode'
import { federationRoutes } from '../contracts/generated/enterprise-security-v1/federation-routes.generated'
import type { FederationResponseMap } from '../contracts/generated/enterprise-security-v1/federation-operations.generated'
import { federationResponseValidators } from './federation-validators.generated'
import type { SecurityApiErrorV1 } from '../contracts/generated/enterprise-security-v1/types/SecurityApiErrorV1'
import type { SocialProviderV1 } from '../contracts/generated/enterprise-security-v1/types/SocialProviderV1'

type ResponseValidator = (input: unknown) => boolean
const validators = federationResponseValidators as unknown as Readonly<Record<string, ResponseValidator>>

function providerHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname
    const hasAsciiControl = [...value].some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
    return new TextEncoder().encode(value).byteLength <= 2048 && value.trim() === value && !hasAsciiControl && new TextEncoder().encode(url.href).byteLength <= 2048 && url.protocol === 'https:' && !url.username && !url.password && !value.includes('#') && !host.includes(':') && !/^\d+\.\d+\.\d+\.\d+$/.test(host) && !host.endsWith('.') && host.length <= 253 && host.split('.').every((label) => label.length >= 1 && label.length <= 63) && url.port !== '0'
  } catch {
    return false
  }
}

function socialCallbackUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname
    const hasAsciiControl = [...value].some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
    const loopbackDevelopment = url.protocol === 'http:' && (host === 'localhost' || host.endsWith('.localhost'))
    return new TextEncoder().encode(value).byteLength <= 2048 && value.trim() === value && !hasAsciiControl && new TextEncoder().encode(url.href).byteLength <= 2048 && (url.protocol === 'https:' || loopbackDevelopment) && !url.username && !url.password && !value.includes('#') && !url.search && !host.includes(':') && !/^\d+\.\d+\.\d+\.\d+$/u.test(host) && !host.endsWith('.') && host.length <= 253 && host.split('.').every((label) => label.length >= 1 && label.length <= 63) && url.port !== '0'
  } catch {
    return false
  }
}

/** Browser navigation is bounded to the adapter's fixed authorization endpoint.
 * No callback code/token parsing, storage, or vendor API client belongs here. */
export function socialProviderNavigation(value: string, provider: SocialProviderV1, expectedRedirectUri?: string): boolean {
  if (!providerHttpsUrl(value)) return false
  const endpoint = {
    google: 'https://accounts.google.com/o/oauth2/v2/auth',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    github: 'https://github.com/login/oauth/authorize',
  }[provider]
  if (!endpoint) return false
  const url = new URL(value)
  if (`${url.origin}${url.pathname}` !== endpoint) return false
  const params = url.searchParams
  const keys = [...params.keys()]
  const expected = ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'code_challenge', 'code_challenge_method']
  if (provider !== 'github') expected.push('nonce')
  const secret = /^[A-Za-z0-9_-]{43}$/u
  return keys.length === expected.length && new Set(keys).size === keys.length && keys.every((key) => expected.includes(key)) && params.get('response_type') === 'code' && params.get('code_challenge_method') === 'S256' && params.get('scope') === (provider === 'github' ? 'user:email' : 'openid email') && secret.test(params.get('state') ?? '') && secret.test(params.get('code_challenge') ?? '') && (provider === 'github' || secret.test(params.get('nonce') ?? '')) && (params.get('client_id')?.length ?? 0) > 0 && (params.get('client_id')?.length ?? 0) <= 512 && socialCallbackUrl(params.get('redirect_uri') ?? '') && (expectedRedirectUri === undefined || params.get('redirect_uri') === expectedRedirectUri)
}

function validatorFor(name: string): ResponseValidator {
  if (!Object.hasOwn(validators, name)) throw new Error('Missing Plan 06 response schema')
  const validator = validators[name]
  return validator
}

function decode(name: string, text: string, maxBytes: number): unknown {
  const value = decodeBoundedJsonText(text, maxBytes)
  if (!validatorFor(name)(value)) throw new Error('Invalid Plan 06 response')
  if (['identity.federation.start', 'identity.federation.dashboard_launch'].includes(name)) {
    const result = value as { navigationUri: string }
    if (!providerHttpsUrl(result.navigationUri)) throw new Error('Invalid Plan 06 navigation')
  }
  if (name === 'identity.social.start') {
    const result = value as {
      navigationUri: string
      provider: SocialProviderV1
    }
    if (!socialProviderNavigation(result.navigationUri, result.provider)) throw new Error('Invalid social navigation')
  }
  if (name === 'identity.federation.callback') {
    const request = value as { progress: { nextStep: string } }
    if (request.progress.nextStep === 'confirm_federation') throw new Error('Continuation cannot restart handoff confirmation')
  }

  if (name === 'identity.methods.resolve') {
    const result = value as {
      methods: string[]
      federationProviders: { targetTenantId: string; providerId: string }[]
      socialProviders: SocialProviderV1[]
    }
    const keys = result.federationProviders.map((p) => `${p.targetTenantId}/${p.providerId}`)
    if (new Set(result.methods).size !== result.methods.length || new Set(keys).size !== keys.length || result.methods.includes('federation') !== keys.length > 0 || new Set(result.socialProviders).size !== result.socialProviders.length || result.methods.includes('social') !== result.socialProviders.length > 0) throw new Error('Invalid federation choices')
  }
  if (['identity.federation.callback', 'identity.jit.primary_email.verify', 'identity.jit.profile_complete'].includes(name)) {
    const result = value as {
      progress: { nextStep: string }
      jitProfile: unknown
    }
    if ((result.progress.nextStep === 'complete_profile') !== (result.jitProfile !== null)) throw new Error('Invalid JIT profile context')
  }
  return value
}

export function decodeFederationResponse<K extends keyof FederationResponseMap>(operation: K, text: string): FederationResponseMap[K] {
  if (!Object.hasOwn(federationRoutes, operation)) throw new Error('Missing Plan 06 route')
  return decode(operation, text, federationRoutes[operation].maxResponseBytes) as FederationResponseMap[K]
}

export function decodeFederationError(text: string): SecurityApiErrorV1 {
  return decode('error', text, 16 * 1024) as SecurityApiErrorV1
}
