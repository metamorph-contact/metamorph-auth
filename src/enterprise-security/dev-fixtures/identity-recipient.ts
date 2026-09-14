import { buildRecipientFixtures } from '../../contracts/generated/authorization-recipient-v1/fixtures.generated'
import type { RecipientInvitationCardV1 } from '../../contracts/generated/authorization-recipient-v1/types/RecipientInvitationCardV1'
import type { RecipientInvitationDecisionRequestV1 } from '../../contracts/generated/authorization-recipient-v1/types/RecipientInvitationDecisionRequestV1'
import type { RecipientInvitationDetailResultV1 } from '../../contracts/generated/authorization-recipient-v1/types/RecipientInvitationDetailResultV1'
import type { RecipientInvitationListResultV1 } from '../../contracts/generated/authorization-recipient-v1/types/RecipientInvitationListResultV1'
import type { RecipientInvitationOperationV1 } from '../../contracts/generated/authorization-recipient-v1/types/RecipientInvitationOperationV1'
import { RecipientPreviewError, type IdentityRecipientClient } from '../identity-recipient-client'
import { identityPreviewStates, type IdentityPreviewState } from './identity-states'

export const recipientIdentityScenarios = identityPreviewStates.map((state) => ({ screenId: 'SCR-IDN-009' as const, state, id: `SCR-IDN-009:${state}` as const }))
export const FIXTURE_PINNED_INVITATION_ID = '0198f1cb-5661-7c52-90b7-2c0000000001'
export const FIXTURE_CLAIM_INVITATION_ID = '0198f1cb-5661-7c52-90b7-2c0000000007'
export const fixtureEmailLink = buildRecipientFixtures().emailedLink

function wait(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return }
    const timer = globalThis.setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, 45)
    const abort = () => { globalThis.clearTimeout(timer); reject(signal.reason) }
    signal.addEventListener('abort', abort, { once: true })
  })
}

function waitUntilCancelled(signal: AbortSignal): Promise<never> {
  return new Promise((_resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return }
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

const errors: Partial<Record<IdentityPreviewState, string>> = {
  'retryable-error': 'authorization.recipient.owner_unavailable',
  'terminal-error': 'authorization.recipient.denied',
  'stale-revision': 'authorization.pagination.snapshot_changed',
  'assurance-challenge': 'authorization.recipient.capability_expired',
  'regional-correction': 'authorization.route.retry',
  'provider-outage': 'authorization.recipient.delivery_unavailable',
}

export function identityRecipientFixture(state: IdentityPreviewState): IdentityRecipientClient {
  if (!identityPreviewStates.includes(state)) throw new Error('Unknown recipient fixture state')
  const fixtures = buildRecipientFixtures()
  const pinned = fixtures.pinned.items[0]
  if (pinned?.kind !== 'full') throw new Error('Generated pinned fixture is missing')
  const card: RecipientInvitationCardV1 = pinned.invitation
  const emailedLink = fixtures.emailedLink
  let decision: 'accept' | 'reject' | null = null
  let decidedInvitationId: string | null = null
  let operation: RecipientInvitationOperationV1 | null = null
  let statusReads = 0

  async function ready(signal: AbortSignal) {
    if (state === 'loading') return waitUntilCancelled(signal)
    await wait(signal)
    const code = errors[state]
    if (code !== undefined) throw new RecipientPreviewError(code)
  }
  function matchingRequest(invitationId: string, request: RecipientInvitationDecisionRequestV1): void {
    const isPinned = invitationId === FIXTURE_PINNED_INVITATION_ID
    const isClaim = invitationId === FIXTURE_CLAIM_INVITATION_ID
    if ((!isPinned && !isClaim) || request.schemaVersion !== 1 ||
      request.expected.invitationVersion !== (isPinned ? card.invitationVersion : emailedLink.invitationVersion)) {
      throw new RecipientPreviewError('authorization.recipient.version_changed')
    }
    if (isClaim && request.emailedToken !== emailedLink.emailedToken) throw new RecipientPreviewError('authorization.recipient.full_token_required')
    if (isPinned && request.emailedToken != null) throw new RecipientPreviewError('authorization.recipient.unexpected_token')
    if (state === 'partial') throw new RecipientPreviewError('authorization.recipient.status_uncertain')
  }
  function operationAfterDecision(kind: 'accept' | 'reject', invitationId: string): RecipientInvitationOperationV1 {
    decision = kind
    decidedInvitationId = invitationId
    operation = { ...fixtures.pending, invitationId }
    statusReads = 0
    return { ...operation }
  }
  function terminalHistory(): RecipientInvitationListResultV1 {
    const result = structuredClone(decision === 'reject' ? fixtures.rejectedHistory : fixtures.history)
    const item = result.items[0]
    if (item?.kind === 'full' && decidedInvitationId !== null) {
      item.invitation.invitationId = decidedInvitationId
      item.invitation.claimRequired = decidedInvitationId === FIXTURE_CLAIM_INVITATION_ID
    }
    return result
  }

  return {
    async bootstrap(signal) {
      await ready(signal)
      return { ...fixtures.bootstrap, route: { ...fixtures.bootstrap.route } }
    },
    async list(filter, signal): Promise<RecipientInvitationListResultV1> {
      await ready(signal)
      if (filter === 'history') {
        if (decision !== null && operation?.state === 'completed') return terminalHistory()
        return state === 'read-only' ? structuredClone(fixtures.history) : { ...fixtures.history, items: [] }
      }
      if (state === 'empty') return { ...fixtures.pinned, items: [] }
      const result = structuredClone(fixtures.pinned)
      if (state === 'partial') {
        result.backfillPending = true
        const item = result.items[0]
        if (item?.kind === 'full') item.invitation.statusUncertain = true
      }
      if (state === 'read-only') return { ...result, items: [] }
      if (operation?.state === 'completed' && decidedInvitationId === FIXTURE_PINNED_INVITATION_ID) result.items = []
      if (operation?.state !== 'completed' || decidedInvitationId !== FIXTURE_CLAIM_INVITATION_ID) {
        result.items.push(...structuredClone(fixtures.claimRequired.items))
      }
      return result
    },
    async detail(invitationId, signal): Promise<RecipientInvitationDetailResultV1> {
      await ready(signal)
      if (invitationId !== FIXTURE_PINNED_INVITATION_ID && invitationId !== FIXTURE_CLAIM_INVITATION_ID) {
        throw new RecipientPreviewError('authorization.recipient.not_found')
      }
      const selected = operation?.state === 'completed' && decidedInvitationId === invitationId
        ? terminalHistory().items[0] : invitationId === FIXTURE_PINNED_INVITATION_ID ? pinned : null
      if (selected?.kind === 'full') return { schemaVersion: 1, invitation: { ...selected.invitation } }
      throw new RecipientPreviewError('authorization.recipient.not_found')
    },
    async accept(invitationId, request, signal) {
      await ready(signal)
      matchingRequest(invitationId, request)
      return operationAfterDecision('accept', invitationId)
    },
    async reject(invitationId, request, signal) {
      await ready(signal)
      matchingRequest(invitationId, request)
      return operationAfterDecision('reject', invitationId)
    },
    async status(operationId, signal) {
      await ready(signal)
      if (operationId !== fixtures.pending.operationId || operation === null) throw new RecipientPreviewError('authorization.recipient.operation_not_found')
      statusReads += 1
      if (state !== 'async-progress' && statusReads >= 2) operation = {
        ...(decision === 'reject' ? fixtures.rejected : fixtures.completed),
        invitationId: operation.invitationId,
      }
      return { ...operation }
    },
  }
}
