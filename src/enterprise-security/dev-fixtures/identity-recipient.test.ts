import { describe, expect, it } from 'vitest'

import { recipientIdentityScreens } from '../identity-recipient-client'
import { FIXTURE_CLAIM_INVITATION_ID, FIXTURE_PINNED_INVITATION_ID, fixtureEmailLink, identityRecipientFixture, recipientIdentityScenarios } from './identity-recipient'
import { identityPreviewStates } from './identity-states'

const signal = () => new AbortController().signal
const request = (emailedToken?: string) => ({
  schemaVersion: 1 as const,
  mutationId: '0198f1cb-5661-7c52-90b7-2c0000000003',
  expected: { invitationVersion: '3' },
  ...(emailedToken === undefined ? {} : { emailedToken }),
})

describe('EA-01L authorization recipient fixtures', () => {
  it('registers twelve distinct states for the inbox screen', () => {
    expect(recipientIdentityScreens).toEqual(['SCR-IDN-009'])
    expect(recipientIdentityScenarios).toHaveLength(identityPreviewStates.length)
    expect(new Set(recipientIdentityScenarios.map((scenario) => scenario.id)).size).toBe(identityPreviewStates.length)
  })

  it('keeps an unpinned teaser free of tenant, inviter, target, and invitation ID', async () => {
    const client = identityRecipientFixture('ready')
    const page = await client.list('pending', signal())
    expect(page.items).toHaveLength(2)
    const teaser = page.items[1]
    expect(teaser).toMatchObject({ kind: 'claim_required' })
    const serialized = JSON.stringify(teaser)
    for (const sensitive of ['invitationId', 'tenantId', 'inviterDisplay', 'target', 'Example Studio']) {
      expect(serialized).not.toContain(sensitive)
    }
    await expect(client.detail(FIXTURE_CLAIM_INVITATION_ID, signal()))
      .rejects.toMatchObject({ code: 'authorization.recipient.not_found' })
    await expect(client.accept(FIXTURE_CLAIM_INVITATION_ID, request(), signal()))
      .rejects.toMatchObject({ code: 'authorization.recipient.full_token_required' })
    expect(await client.accept(FIXTURE_CLAIM_INVITATION_ID, request(fixtureEmailLink.emailedToken), signal()))
      .toMatchObject({ state: 'pending' })
    await client.status('0198f1cb-5661-7c52-90b7-2c0000000004', signal())
    await client.status('0198f1cb-5661-7c52-90b7-2c0000000004', signal())
    expect((await client.list('pending', signal())).items).toMatchObject([{ kind: 'full' }])
    expect((await client.list('history', signal())).items[0]).toMatchObject({ kind: 'full', invitation: { invitationId: FIXTURE_CLAIM_INVITATION_ID, claimRequired: true } })
    expect(await client.detail(FIXTURE_CLAIM_INVITATION_ID, signal())).toMatchObject({ invitation: { invitationId: FIXTURE_CLAIM_INVITATION_ID, state: 'completed' } })
  })

  it('separates queued acceptance from completion and actor-bound history', async () => {
    const client = identityRecipientFixture('ready')
    expect(await client.detail(FIXTURE_PINNED_INVITATION_ID, signal())).toMatchObject({ invitation: { claimRequired: false } })
    expect(await client.accept(FIXTURE_PINNED_INVITATION_ID, request(), signal())).toMatchObject({ state: 'pending' })
    const first = await client.status('0198f1cb-5661-7c52-90b7-2c0000000004', signal())
    expect(first.state).toBe('pending')
    const second = await client.status(first.operationId, signal())
    expect(second.state).toBe('completed')
    const history = await client.list('history', signal())
    expect(history.items[0]).toMatchObject({ kind: 'full', invitation: { state: 'completed' } })
    expect((await client.list('pending', signal())).items).toMatchObject([{ kind: 'claim_required' }])
  })

  it('makes rejection terminal without an access grant and disables uncertain decisions', async () => {
    const client = identityRecipientFixture('ready')
    await client.reject(FIXTURE_PINNED_INVITATION_ID, request(), signal())
    await client.status('0198f1cb-5661-7c52-90b7-2c0000000004', signal())
    await client.status('0198f1cb-5661-7c52-90b7-2c0000000004', signal())
    expect((await client.list('history', signal())).items[0])
      .toMatchObject({ kind: 'full', invitation: { state: 'revoked', terminalReason: 'recipient_rejected' } })
    const partial = await identityRecipientFixture('partial').list('pending', signal())
    expect(partial.backfillPending).toBe(true)
    expect(partial.items[0]).toMatchObject({ kind: 'full', invitation: { statusUncertain: true } })
  })

  it('fails safely on a changed snapshot and cancels a pending lookup', async () => {
    await expect(identityRecipientFixture('stale-revision').list('pending', signal()))
      .rejects.toMatchObject({ code: 'authorization.pagination.snapshot_changed' })
    const controller = new AbortController()
    const pending = identityRecipientFixture('loading').list('pending', controller.signal)
    controller.abort('account switched')
    await expect(pending).rejects.toBe('account switched')
  })
})
