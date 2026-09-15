import { afterEach, expect, it, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import { FederationMethodChoices } from './federation-methods'
import { FederationHttpError } from './federation-contract'
import { federationJourneyFixture } from './dev-fixtures/federation-journey'
import { buildSecurityErrorEnvelope } from '../contracts/generated/enterprise-security-v1/fixtures.generated'
const { clients } = vi.hoisted(() => ({ clients: vi.fn() }))
vi.mock('./federation-client', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  identityFederationClient: clients,
}))
vi.mock('@polymorph/core', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  Icon: () => null,
}))
afterEach(cleanup)
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
