import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import { FederationMethodChoices } from './federation-methods'
import { FederationHttpError } from './federation-contract'
import { federationJourneyFixture } from './dev-fixtures/federation-journey'
import { buildSecurityErrorEnvelope } from '../contracts/generated/enterprise-security-v1/fixtures.generated'
import { socialAuthorizationUri } from './dev-fixtures/social-journey'
import { assertExternalNavigationLive } from './external-navigation'
const { clients } = vi.hoisted(() => ({ clients: vi.fn() }))
vi.mock('./federation-client', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  identityFederationClient: clients,
}))
vi.mock('@polymorph/core', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  Icon: () => null,
}))
afterEach(() => { cleanup(); vi.clearAllMocks() })
describe.each(['google', 'microsoft', 'github'] as const)('%s common social choices', (provider) => {
  it('is offered without email and displays a typed denial, with no double start', async () => {
    const resolution = federationJourneyFixture().resolution
    resolution.methods.push('social')
    resolution.socialProviders = [provider]
    const call = vi.fn(async (op: string) => {
      if (op === 'identity.methods.resolve') return resolution
      throw new FederationHttpError(403, {schemaVersion:1,correlationId:resolution.continuationId,error:{code:'security.method.disabled'}})
    })
    clients.mockImplementation(() => ({call}))
    const custody = vi.fn()
    const flow = {
      bootstrap: {flowId:resolution.continuationId,expiresAt:resolution.expiresAt},
      catalog: {projection:{clientId:'octamorph-browser',realmId:'test',expiresAt:resolution.expiresAt}},
    }
    render(<FederationMethodChoices flow={flow as never} email="" disabled={false} navigate={vi.fn()} onCustodyChange={custody} />)
    const button = await screen.findByRole('button', {name:new RegExp(`Continue with ${provider}`, 'iu')})
    fireEvent.click(button); fireEvent.click(button)
    expect(await screen.findByText('This sign-in method is not allowed for this flow.')).toBeTruthy()
    expect(call).toHaveBeenCalledTimes(2)
    expect(call.mock.calls[0][0]).toBe('identity.methods.resolve')
    const discovery = call.mock.calls[0] as unknown as [string,{routeHint:unknown}]
    expect(discovery[1].routeHint).toBeNull()
    expect(custody.mock.calls.at(-1)).toEqual([false])
  })
})
it('scrubs a pending social start on page suspension and never navigates a late response', async () => {
  const resolution = federationJourneyFixture().resolution
  resolution.methods.push('social'); resolution.socialProviders = ['github']
  let release!: () => void
  const call = vi.fn(async (op: string) => {
    if (op === 'identity.methods.resolve') return resolution
    await new Promise<void>((resolve) => {release = resolve})
    return {schemaVersion:1,attemptId:resolution.continuationId,provider:'github',redirectRegistrationId:'social-callback',navigationUri:socialAuthorizationUri('github'),expiresAt:resolution.expiresAt}
  })
  clients.mockImplementation(() => ({call}))
  const navigate = vi.fn()
  const flow = {bootstrap:{flowId:resolution.continuationId,expiresAt:resolution.expiresAt},catalog:{projection:{clientId:'octamorph-browser',realmId:'test',expiresAt:resolution.expiresAt}}}
  render(<FederationMethodChoices flow={flow as never} email="" disabled={false} navigate={navigate} />)
  fireEvent.click(await screen.findByRole('button',{name:'Continue with GitHub'}))
  await waitFor(() => expect(call).toHaveBeenCalledTimes(2))
  fireEvent(window,new Event('pagehide')); release()
  expect(await screen.findByText('This sign-in choice expired. Start again.')).toBeTruthy()
  expect(navigate).not.toHaveBeenCalled()
})
it('passes the shorter exact attempt deadline to the post-fade navigation owner', async () => {
  const resolution = federationJourneyFixture().resolution
  resolution.methods.push('social'); resolution.socialProviders = ['google']
  const expiry = new Date(Date.now()+10_000).toISOString()
  const call = vi.fn(async (op:string) => op === 'identity.methods.resolve' ? resolution :
    {schemaVersion:1,attemptId:resolution.continuationId,provider:'google',redirectRegistrationId:'social-callback',navigationUri:socialAuthorizationUri('google'),expiresAt:expiry})
  clients.mockImplementation(() => ({call}))
  const assign = vi.fn()
  const navigate = vi.fn(async (_uri:string,signal:AbortSignal,deadline:string) => {
    expect(deadline).toBe(expiry)
    assertExternalNavigationLive(signal,[resolution.expiresAt,deadline],Date.parse(expiry)+1)
    assign()
  })
  const flow = {bootstrap:{flowId:resolution.continuationId,expiresAt:resolution.expiresAt},catalog:{projection:{clientId:'octamorph-browser',realmId:'test',expiresAt:resolution.expiresAt}}}
  render(<FederationMethodChoices flow={flow as never} email="" disabled={false} navigate={navigate} />)
  fireEvent.click(await screen.findByRole('button',{name:'Continue with Google'}))
  await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
  expect(assign).not.toHaveBeenCalled()
})
it('uses the newly selected provider region after a definite start denial', async () => {
  const fixture = federationJourneyFixture()
  const resolution = structuredClone(fixture.resolution)
  resolution.federationProviders[1].providerRegionId = 'local-b'
  const call = vi.fn(async (op: string) => {
    if (op === 'identity.methods.resolve') return resolution
    throw new FederationHttpError(403, buildSecurityErrorEnvelope(17))
  })
  clients.mockImplementation(() => ({ call }))
  const flow = {
    bootstrap: { flowId: '01994000-0000-7000-8000-000000000010', expiresAt: resolution.expiresAt },
    catalog: {
      projection: {
        clientId: 'octamorph-browser',
        realmId: 'test',
        expiresAt: resolution.expiresAt,
      },
    },
  }
  render(
    <FederationMethodChoices
      flow={flow as never}
      email="chosen@example.com"
      disabled={false}
      navigate={vi.fn()}
    />,
  )
  fireEvent.click(await screen.findByRole('button', { name: /Example OIDC/u }))
  await waitFor(() => expect(call).toHaveBeenCalledTimes(2))
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: /Example SAML/u }) as HTMLButtonElement).disabled,
    ).toBe(false),
  )
  fireEvent.click(screen.getByRole('button', { name: /Example SAML/u }))
  await waitFor(() => expect(call).toHaveBeenCalledTimes(3))
  expect(clients.mock.calls.map((args) => args[1])).toEqual([undefined, 'local-a', 'local-b'])
})
