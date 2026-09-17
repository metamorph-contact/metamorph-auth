import { expect, it, vi, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { buildRecipientFixtures } from '../contracts/generated/authorization-recipient-v1/fixtures.generated'
import type { IdentityRecipientClient } from './identity-recipient-client'
import { FederationInvitationInbox } from './federation-inbox'
import i18n from '../i18n'
import en from '../i18n/locales/en/enterprise-security.json'
vi.mock('@polymorph/core', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  Icon: () => null,
}))
i18n.addResourceBundle('en', 'enterprise-security', en)
afterEach(cleanup)
it('keeps a second invitation actionable while reconciling the first pending decision', async () => {
  const fixtures = buildRecipientFixtures()
  const first = fixtures.pinned.items[0]
  if (first.kind !== 'full') throw new Error('wrong fixture')
  const second = structuredClone(first)
  second.invitation.invitationId = '01994000-0000-7000-8000-000000000044'
  second.invitation.tenantDisplay = 'Another studio'
  const accept = vi.fn(async (invitationId: string) => ({ ...fixtures.pending, invitationId }))
  const reject = vi.fn(async (invitationId: string) => ({ ...fixtures.completed, invitationId }))
  const status = vi.fn(async () => ({
    ...fixtures.completed,
    invitationId: first.invitation.invitationId,
  }))
  const client = {
    bootstrap: async () => ({}),
    list: async () => ({ ...fixtures.pinned, items: [first, second] }),
    accept,
    reject,
    status,
  } as unknown as IdentityRecipientClient
  render(<FederationInvitationInbox client={client} leave={vi.fn()} />)
  const accepts = await screen.findAllByRole('button', { name: en['security.journey.accept'] })
  fireEvent.click(accepts[0])
  await screen.findByRole('button', { name: 'Check decision status' })
  expect(screen.getAllByRole('button', { name: en['security.journey.accept'] })).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: en['security.journey.reject'] }))
  await screen.findByText('The owning region confirmed the decision.')
  expect(reject).toHaveBeenCalledWith(
    second.invitation.invitationId,
    expect.anything(),
    expect.anything(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Check decision status' }))
  await screen.findAllByText('The owning region confirmed the decision.')
  expect(status).toHaveBeenCalledWith(fixtures.pending.operationId, expect.anything())
})
