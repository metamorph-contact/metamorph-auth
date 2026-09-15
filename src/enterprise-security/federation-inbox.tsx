import { Button, Stack, Text } from '@polymorph/ui/identity'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IdentityRecipientClient } from './identity-recipient-client'
import type { RecipientInvitationListResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationListResultV1'
import type { RecipientInvitationOperationV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationOperationV1'
import { randomUuid7 } from '../protocol/random'

export function FederationInvitationInbox({
  client,
  leave,
}: {
  client: IdentityRecipientClient
  leave: () => void
}) {
  const { t } = useTranslation('enterprise-security')
  const [page, setPage] = useState<RecipientInvitationListResultV1>()
  const [receipts, setReceipts] = useState<Record<string, RecipientInvitationOperationV1>>({})
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
      .then(() => client.list('pending', controller.signal))
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
      setReceipts({})
    }
    window.addEventListener('pagehide', scrub)
    return () => {
      window.removeEventListener('pagehide', scrub)
      scrub()
    }
  }, [client])
  async function execute(
    invitationId: string,
    work: (signal: AbortSignal) => Promise<RecipientInvitationOperationV1>,
  ) {
    if (action.current) return
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
  function decide(invitationId: string, version: string, kind: 'accept' | 'reject') {
    const prior = commands.current.get(invitationId)
    if (prior && (prior.version !== version || prior.kind !== kind)) return
    const command = prior ?? { version, kind, mutationId: randomUuid7() }
    commands.current.set(invitationId, command)
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
      {page?.items.map((item, index) => {
        if (item.kind === 'claim_required')
          return <Text key={index}>{t('security.preview.recipient.teaser')}</Text>
        const invitation = item.invitation
        const receipt = receipts[invitation.invitationId]
        return (
          <Stack key={invitation.invitationId} gap={2}>
            <Text>{invitation.tenantDisplay}</Text>
            <Text>
              {t(
                receipt
                  ? `security.preview.recipient.operation.${receipt.state}`
                  : 'security.preview.recipient.state.pending',
              )}
            </Text>
            {invitation.state === 'pending' && !invitation.statusUncertain && !receipt && (
              <Stack gap={2}>
                {(['accept', 'reject'] as const).map((kind) => (
                  <Button
                    key={kind}
                    label={t(`security.journey.${kind}`)}
                    variant="outline"
                    tone="neutral"
                    disabled={pending}
                    onClick={() =>
                      decide(invitation.invitationId, invitation.invitationVersion, kind)
                    }
                  />
                ))}
              </Stack>
            )}
            {receipt?.state === 'pending' && (
              <>
                <Text>{t('security.journey.noGrant')}</Text>
                <Button
                  label={t('security.preview.recipient.checkStatus')}
                  disabled={pending}
                  onClick={() => {
                    void execute(invitation.invitationId, async (signal) => {
                      const result = await client.status(receipt.operationId, signal)
                      if (result.operationId !== receipt.operationId)
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
      {failed && <Text>{t('security.journey.unavailable')}</Text>}
      <Button
        label={t('security.journey.skip')}
        variant="outline"
        tone="neutral"
        disabled={pending}
        onClick={leave}
      />
    </Stack>
  )
}
