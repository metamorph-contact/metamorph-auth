import { Button, Stack, Text } from '@polymorph/ui/identity'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IdentityRecipientClient } from './identity-recipient-client'
import type { RecipientInvitationListResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationListResultV1'
import type { RecipientInvitationOperationV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationOperationV1'
import type { RecipientEmailedEntryResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientEmailedEntryResultV1'
import type { RecipientInvitationCardV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationCardV1'
import { randomUuid7 } from '../protocol/random'

export function FederationInvitationInbox({
  client,
  leave,
  disabled = false,
}: {
  client: IdentityRecipientClient
  leave: () => void
  disabled?: boolean
}) {
  const { t } = useTranslation('enterprise-security')
  const [page, setPage] = useState<RecipientInvitationListResultV1>()
  const [emailed,setEmailed]=useState<RecipientEmailedEntryResultV1>()
  const [receipts, setReceipts] = useState<Record<string, RecipientInvitationOperationV1>>({})
  const [heldOffers, setHeldOffers] = useState<Record<string, RecipientInvitationCardV1>>({})
  const [failed, setFailed] = useState(false)
  const [pending, setPending] = useState(false)
  const action = useRef<AbortController | undefined>(undefined)
  // One uncertain decision is retained per invitation, so other invitations
  // remain actionable without changing an already submitted command.
  const commands = useRef(
    new Map<string, { version: string; kind: 'accept' | 'reject'; mutationId: string }>(),
  )
  useEffect(() => {
    const controller = new AbortController()
    void client
      .bootstrap(controller.signal)
      .then(async () => {
        const [page,entry]=await Promise.allSettled([client.list('pending',controller.signal),client.readEmailed?.(controller.signal)])
        controller.signal.throwIfAborted()
        if(entry.status==='fulfilled')setEmailed(entry.value);else setFailed(true)
        if(page.status==='rejected')throw page.reason
        return page.value
      })
      .then((value) => {
        if (!controller.signal.aborted) setPage(value)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    const scrub = () => {
      controller.abort()
      action.current?.abort()
      action.current = undefined
      commands.current.clear()
      setPage(undefined)
      setEmailed(undefined)
      setReceipts({})
      setHeldOffers({})
    }
    window.addEventListener('pagehide', scrub)
    return () => {
      window.removeEventListener('pagehide', scrub)
      scrub()
      client.dispose?.()
    }
  }, [client])
  useEffect(()=>{
    if(emailed===undefined)return
    const timer=window.setTimeout(()=>{setEmailed(undefined);setFailed(true)},Math.max(0,Date.parse(emailed.expiresAt)-Date.now()))
    return ()=>window.clearTimeout(timer)
  },[emailed])
  async function execute(
    invitationId: string,
    work: (signal: AbortSignal) => Promise<RecipientInvitationOperationV1>,
  ) {
    if (action.current || disabled) return
    const controller = new AbortController()
    action.current = controller
    setPending(true)
    setFailed(false)
    const timer = window.setTimeout(() => controller.abort(), 20_000)
    try {
      const result = await work(controller.signal)
      controller.signal.throwIfAborted()
      if (result.invitationId !== invitationId) throw new Error('security.ceremony.mismatch')
      setReceipts((current) => ({ ...current, [invitationId]: result }))
      commands.current.delete(invitationId)
      if (result.state !== 'pending') setHeldOffers(current => {
        const next = { ...current }
        delete next[invitationId]
        return next
      })
    } catch {
      if (action.current === controller) setFailed(true)
    } finally {
      window.clearTimeout(timer)
      if (action.current === controller) {
        action.current = undefined
        setPending(false)
      }
    }
  }
  async function readPage(cursor?: string) {
    if (action.current || disabled) return
    const controller = new AbortController()
    action.current = controller
    setPending(true)
    setFailed(false)
    try {
      const [result,entry] = await Promise.all([client.list('pending', controller.signal, cursor),client.readEmailed?.(controller.signal)])
      controller.signal.throwIfAborted()
      setPage(result);setEmailed(entry)
      setReceipts({})
    } catch {
      if (action.current === controller) setFailed(true)
    } finally {
      if (action.current === controller) {
        action.current = undefined
        setPending(false)
      }
    }
  }
  function decide(invitation: RecipientInvitationCardV1, kind: 'accept' | 'reject') {
    const invitationId = invitation.invitationId
    const version = invitation.invitationVersion
    const prior = commands.current.get(invitationId)
    if (prior && (prior.version !== version || prior.kind !== kind)) return
    const command = prior ?? { version, kind, mutationId: randomUuid7() }
    commands.current.set(invitationId, command)
    setHeldOffers(current => ({ ...current, [invitationId]: invitation }))
    void execute(invitationId, (signal) =>
      client[kind](
        invitationId,
        {
          schemaVersion: 1,
          mutationId: command.mutationId,
          expected: { invitationVersion: version },
        },
        signal,
      ),
    )
  }
  return (
    <Stack gap={3}>
      <Text>{t('security.journey.invitations')}</Text>
      {[...Object.values(heldOffers).map(invitation => ({kind:'full' as const, invitation})),
        ...(emailed===undefined||heldOffers[emailed.invitation.invitationId]!==undefined?[]:[{kind:'full' as const,invitation:emailed.invitation}]),
        ...(page?.items??[]).filter(item=>item.kind==='claim_required'||(heldOffers[item.invitation.invitationId]===undefined&&item.invitation.invitationId!==emailed?.invitation.invitationId))].map((item, index) => {
        if (item.kind === 'claim_required')
          return <Text key={index}>{t('security.preview.recipient.teaser')}</Text>
        const invitation = item.invitation
        const receipt = receipts[invitation.invitationId]
        const uncertain = commands.current.get(invitation.invitationId)
        return (
          <Stack key={invitation.invitationId} gap={2}>
            <Text><bdi dir="auto">{invitation.tenantDisplay}</bdi></Text>
            <Text>{invitation.target.kind==='tenant'?t('security.journey.target.tenant')
              :invitation.target.kind==='homeRole'?t(`security.journey.target.${invitation.target.boundary}`,{role:invitation.target.roleDisplay})
              :invitation.target.kind==='team'?t('security.journey.target.team',{team:invitation.target.teamDisplay})
              :t('security.journey.target.role',{resource:invitation.target.resourceDisplay,role:invitation.target.roleDisplay})}</Text>
            <Text tone="secondary">{t('security.journey.invitedBy',{inviter:invitation.inviterDisplay})}</Text>
            <Text>
              {t(
                receipt
                  ? `security.preview.recipient.operation.${receipt.state}`
                  : 'security.preview.recipient.state.pending',
              )}
            </Text>
            {invitation.statusUncertain && <Text>{t('security.preview.recipient.uncertain')}</Text>}
            {invitation.state === 'pending' && !invitation.statusUncertain && !receipt && (
              <Stack gap={2}>
                {(['accept', 'reject'] as const).map((kind) => (
                  <Button
                    key={kind}
                    label={t(`security.journey.${kind}`)}
                    variant="outline"
                    tone="neutral"
                    disabled={pending || disabled || (uncertain !== undefined && uncertain.kind !== kind)
                      || (uncertain === undefined && Date.parse(invitation.expiresAt) <= Date.now())}
                    onClick={() =>
                      decide(invitation, kind)
                    }
                  />
                ))}
              </Stack>
            )}
            {(receipt?.state === 'pending' || uncertain !== undefined) && (
              <>
                <Text>{t('security.journey.noGrant')}</Text>
                <Button
                  label={t('security.preview.recipient.checkStatus')}
                  disabled={pending || disabled}
                  onClick={() => {
                    void execute(invitation.invitationId, async (signal) => {
                      const operationId = receipt?.operationId ?? uncertain!.mutationId
                      const result = await client.status(operationId, signal)
                      if (result.operationId !== operationId)
                        throw new Error('security.ceremony.mismatch')
                      return result
                    })
                  }}
                />
              </>
            )}
          </Stack>
        )
      })}
      {page?.nextCursor && (
        <Button
          label={t('security.journey.invitationsNext')}
          disabled={disabled || pending || commands.current.size > 0 || Object.values(receipts).some(receipt => receipt.state === 'pending')}
          onClick={() => { void readPage(page.nextCursor ?? undefined) }}
        />
      )}
      <Button
        label={t('security.journey.invitationsRefresh')}
        variant="outline"
        tone="neutral"
        disabled={disabled || pending || commands.current.size > 0 || Object.values(receipts).some(receipt => receipt.state === 'pending')}
        onClick={() => { void readPage() }}
      />
      {failed && <Text>{t('security.journey.unavailable')}</Text>}
      <Button
        label={t('security.journey.skip')}
        variant="outline"
        tone="neutral"
        disabled={pending || disabled}
        onClick={leave}
      />
    </Stack>
  )
}
