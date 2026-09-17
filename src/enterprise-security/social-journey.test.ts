import { describe, expect, it, vi } from 'vitest'
import { FederationJourney } from './federation-journey'
import { transportedFederationClient } from './federation-client'
import { FederationHttpError, type FederationTransport } from './federation-contract'
import { decodeFederationResponse, socialProviderNavigation } from './federation-decode'
import { federationRoutes } from '../contracts/generated/enterprise-security-v1/federation-routes.generated'
import { federationJourneyFixture } from './dev-fixtures/federation-journey'
import { socialAuthorizationUri } from './dev-fixtures/social-journey'
import { assertExternalNavigationLive } from './external-navigation'
import type { SocialProviderV1 } from '../contracts/generated/enterprise-security-v1/types/SocialProviderV1'

const providers: SocialProviderV1[] = ['google', 'microsoft', 'github']
const id = '01994000-0000-7000-8000-000000000071'
function setup(provider: SocialProviderV1, transport?: FederationTransport) {
  const resolution = federationJourneyFixture().resolution
  resolution.methods.push('social')
  resolution.socialProviders = providers.slice()
  const result = {
    schemaVersion: 1, attemptId: id, provider, redirectRegistrationId: 'social-callback',
    navigationUri: socialAuthorizationUri(provider), expiresAt: resolution.expiresAt,
  }
  const calls = vi.fn(transport ?? (async () => ({
    status: 200, contentType: 'application/json', body: JSON.stringify(result), headers: {},
  })))
  const journey = new FederationJourney(id, 'octamorph-browser', transportedFederationClient(calls), resolution.expiresAt)
  return { resolution, result, calls, journey }
}
describe.each(providers)('%s typed social entry', (provider) => {
  it('uses the exact generated start and no browser callback operation or token', async () => {
    const { resolution, result, calls, journey } = setup(provider)
    expect(await journey.startSocial(resolution, provider)).toBe(result.navigationUri)
    const request = calls.mock.calls[0][0]!
    expect(request.path).toBe('/api/auth/v1/security/identity/social/start')
    expect(request.credentials).toBe('include')
    expect(request.redirect).toBe('error')
    expect(JSON.parse(request.body)).toEqual({schemaVersion:1, flowId:id, provider, clientRegistrationId:'octamorph-browser', targetTenantIntentId:null})
    expect(Object.keys(federationRoutes)).not.toContain('identity.social.callback')
    expect(Object.keys(federationRoutes)).not.toContain('identity.social.link_callback')
    expect(journey.hasUnresolvedCommand).toBe(false)
  })
  it('shows typed policy denial and retains the exact command across provider outage', async () => {
    let outage = true
    const { resolution, calls, journey } = setup(provider, async () => ({
      status: outage ? 503 : 403, contentType: 'application/json', headers: {},
      body: JSON.stringify({schemaVersion:1, correlationId:id, error:{code:outage ? 'security.provider.unavailable' : 'security.method.disabled'}}),
    }))
    await expect(journey.startSocial(resolution, provider)).rejects.toBeInstanceOf(FederationHttpError)
    expect(journey.hasUnresolvedCommand).toBe(true)
    outage = false
    await expect(journey.startSocial(resolution, provider)).rejects.toBeInstanceOf(FederationHttpError)
    expect(calls.mock.calls[1][0]).toEqual(calls.mock.calls[0][0])
    expect(journey.hasUnresolvedCommand).toBe(false)
  })
  it('never starts a hidden choice and rejects endpoint/scope/token/duplicate mixup', async () => {
    const { resolution, result, calls, journey } = setup(provider)
    resolution.socialProviders = []
    await expect(journey.startSocial(resolution, provider)).rejects.toThrow('security.method.disabled')
    expect(calls).not.toHaveBeenCalled()
    for (const mutate of [
      (u: URL) => { u.hostname = 'attacker.example' },
      (u: URL) => { u.searchParams.set('scope', 'repo mail calendar') },
      (u: URL) => { u.searchParams.set('access_token', 'never-retained') },
      (u: URL) => { u.searchParams.append('state', 'D'.repeat(43)) },
      (u: URL) => { u.pathname += '/other' },
    ]) {
      const u = new URL(result.navigationUri); mutate(u)
      expect(socialProviderNavigation(u.href, provider)).toBe(false)
      expect(() => decodeFederationResponse('identity.social.start', JSON.stringify({...result,navigationUri:u.href}))).toThrow()
    }
  })
})
it('keeps one original command after loss, refuses another provider, and erases it on scope exit', async () => {
  const {resolution,journey,calls} = setup('google', async () => { throw new TypeError('lost response') })
  await expect(journey.startSocial(resolution,'google')).rejects.toThrow('lost response')
  await expect(journey.startSocial(resolution,'microsoft')).rejects.toThrow('security.operation.conflict')
  await expect(journey.startSocial(resolution,'google')).rejects.toThrow('lost response')
  expect(calls.mock.calls[0][0]).toEqual(calls.mock.calls[1][0])
  journey.stop()
  expect(journey.signal.aborted).toBe(true)
  expect(journey.hasUnresolvedCommand).toBe(false)
  await expect(journey.startSocial(resolution,'google')).rejects.toThrow('security.ceremony.expired')
})
it('rejects duplicate social choices and missing method/provider bijection in common resolution', () => {
  const {resolution} = setup('google')
  for (const invalid of [
    {...resolution,socialProviders:['google','google']},
    {...resolution,socialProviders:[]},
    {...resolution,methods:['password','federation']},
  ]) expect(() => decodeFederationResponse('identity.methods.resolve',JSON.stringify(invalid))).toThrow()
})
it('refuses concurrent starts and late responses after teardown', async () => {
  let release!: () => void
  const {resolution,result,calls,journey} = setup('github', async () => {
    await new Promise<void>((resolve) => { release = resolve })
    return {status:200,contentType:'application/json',headers:{},body:JSON.stringify(result)}
  })
  const first = journey.startSocial(resolution,'github')
  await expect(journey.startSocial(resolution,'github')).rejects.toThrow('security.operation.conflict')
  journey.stop(); release()
  await expect(first).rejects.toThrow()
  expect(calls).toHaveBeenCalledTimes(1)
})
it('carries an exact short attempt deadline through delayed page navigation', async () => {
  const {resolution, result, journey} = setup('google', async () => ({
    status:200,contentType:'application/json',headers:{},
    body:JSON.stringify({...result,expiresAt:new Date(Date.now()+1000).toISOString()}),
  }))
  await journey.startSocial(resolution,'google')
  const attemptDeadline = journey.navigationExpiresAt
  const afterFade = Date.parse(attemptDeadline)+1
  expect(() => assertExternalNavigationLive(journey.signal,[resolution.expiresAt],afterFade)).not.toThrow()
  expect(() => assertExternalNavigationLive(journey.signal,[resolution.expiresAt,attemptDeadline],afterFade)).toThrow('security.ceremony.expired')
})
