import { AuthPage, Button, Stack, Text } from '@polymorph/ui/identity'
import { useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { RecipientInvitationCardV1 } from '../../contracts/generated/authorization-recipient-v1/types/RecipientInvitationCardV1'
import type { RecipientInvitationFilterV1 } from '../../contracts/generated/authorization-recipient-v1/types/RecipientInvitationFilterV1'
import type { RecipientInvitationListResultV1 } from '../../contracts/generated/authorization-recipient-v1/types/RecipientInvitationListResultV1'
import type { RecipientInvitationOperationV1 } from '../../contracts/generated/authorization-recipient-v1/types/RecipientInvitationOperationV1'
import i18n from '../../i18n'
import enterpriseSecurityEn from '../../i18n/locales/en/enterprise-security.json'
import { fixtureEmailLink, identityRecipientFixture } from '../dev-fixtures/identity-recipient'
import { IDENTITY_FIXTURE_MARKER } from '../dev-fixtures/identity-methods'
import { identityPreviewStates, type IdentityPreviewState } from '../dev-fixtures/identity-states'
import { RecipientPreviewError } from '../identity-recipient-client'

i18n.addResourceBundle('en', 'enterprise-security', enterpriseSecurityEn)

type LoadState =
  | { kind: 'loading'; scenario: IdentityPreviewState; filter: RecipientInvitationFilterV1 }
  | { kind: 'error'; scenario: IdentityPreviewState; filter: RecipientInvitationFilterV1; code: string }
  | { kind: 'result'; scenario: IdentityPreviewState; filter: RecipientInvitationFilterV1; page: RecipientInvitationListResultV1 }

function messageFor(code: string): string {
  if (code === 'authorization.pagination.snapshot_changed' || code === 'authorization.recipient.version_changed') return 'security.preview.recipient.error.stale'
  if (code === 'authorization.route.retry') return 'security.preview.recipient.error.route'
  if (code === 'authorization.recipient.capability_expired') return 'security.preview.recipient.error.capability'
  if (code === 'authorization.recipient.full_token_required') return 'security.preview.recipient.error.token'
  if (code === 'authorization.recipient.denied') return 'security.preview.recipient.error.denied'
  return 'security.preview.recipient.error.unavailable'
}

function targetLabel(card: RecipientInvitationCardV1): string {
  switch (card.target.kind) {
    case 'tenant': return card.tenantDisplay
    case 'homeRole': return card.target.roleDisplay
    case 'team': return card.target.teamDisplay
    case 'spaceRole':
    case 'projectRole': return `${card.target.resourceDisplay} · ${card.target.roleDisplay}`
  }
}

export function RecipientIdentityPreviewPage() {
  const { screenId } = useParams({ strict: false }) as { screenId?: string }
  const { t } = useTranslation('enterprise-security')
  const [scenario, setScenario] = useState<IdentityPreviewState>('ready')
  const [filter, setFilter] = useState<RecipientInvitationFilterV1>('pending')
  const [loaded, setLoaded] = useState<LoadState>()
  const [emailedLinkReady, setEmailedLinkReady] = useState(false)
  const [openedCard, setOpenedCard] = useState<RecipientInvitationCardV1>()
  const [operation, setOperation] = useState<RecipientInvitationOperationV1>()
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [notice, setNotice] = useState<string>()
  const [skipped, setSkipped] = useState(false)
  const action = useRef<AbortController | null>(null)
  const emailedToken = useRef<string | null>(null)
  const client = useMemo(() => identityRecipientFixture(scenario), [scenario])

  useEffect(() => {
    if (screenId !== 'SCR-IDN-009') return
    const controller = new AbortController()
    setLoaded({ kind: 'loading', scenario, filter })
    void client.bootstrap(controller.signal).then(() => client.list(filter, controller.signal)).then((page) => {
      if (!controller.signal.aborted) setLoaded({ kind: 'result', scenario, filter, page })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoaded({
        kind: 'error', scenario, filter,
        code: error instanceof RecipientPreviewError ? error.code : 'authorization.recipient.owner_unavailable',
      })
    })
    return () => controller.abort()
  }, [client, filter, scenario, screenId])

  useEffect(() => {
    action.current?.abort()
    action.current = null
    setEmailedLinkReady(false)
    emailedToken.current = null
    setOpenedCard(undefined)
    setOperation(undefined)
    setCheckingStatus(false)
    setNotice(undefined)
    setSkipped(false)
  }, [scenario])

  useEffect(() => {
    if (screenId !== 'SCR-IDN-009') return
    document.title = t('security.preview.recipient.title')
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (heading !== null) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
    })
    const clear = () => {
      action.current?.abort()
      setEmailedLinkReady(false)
      emailedToken.current = null
    }
    window.addEventListener('pagehide', clear)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pagehide', clear); clear() }
  }, [screenId, t])

  if (screenId !== 'SCR-IDN-009') return null
  const visible = loaded?.scenario === scenario && loaded.filter === filter ? loaded : undefined
  const page = visible?.kind === 'result' ? visible.page : undefined
  const busy = operation?.state === 'pending'

  function beginAction(): AbortController {
    action.current?.abort()
    const controller = new AbortController()
    action.current = controller
    return controller
  }

  function claimFromFixtureEmailLink() {
    setNotice(undefined)
    emailedToken.current = fixtureEmailLink.emailedToken
    setEmailedLinkReady(true)
  }

  async function decide(card: Pick<RecipientInvitationCardV1, 'invitationId' | 'invitationVersion' | 'state' | 'statusUncertain'>, kind: 'accept' | 'reject', fromEmailLink: boolean) {
    if (card.state !== 'pending' || card.statusUncertain || busy) return
    const token = emailedToken.current
    if (fromEmailLink && token === null) return
    const controller = beginAction()
    setNotice(undefined)
    const request = {
      schemaVersion: 1,
      mutationId: kind === 'accept' ? '0198f1cb-5661-7c52-90b7-2c0000000003' : '0198f1cb-5661-7c52-90b7-2c0000000006',
      expected: { invitationVersion: card.invitationVersion },
      ...(fromEmailLink && token !== null ? { emailedToken: token } : {}),
    } as const
    try {
      const receipt = await client[kind](card.invitationId, request, controller.signal)
      if (!controller.signal.aborted) {
        emailedToken.current = null
        setEmailedLinkReady(false)
        setOperation(receipt)
        setNotice(kind)
      }
    } catch (error) {
      if (!controller.signal.aborted) setNotice(error instanceof RecipientPreviewError ? error.code : 'authorization.recipient.owner_unavailable')
    }
  }

  async function checkStatus() {
    if (operation === undefined || checkingStatus) return
    const controller = beginAction()
    setCheckingStatus(true)
    try {
      const updated = await client.status(operation.operationId, controller.signal)
      if (!controller.signal.aborted) { setOperation(updated); if (updated.state === 'completed') setFilter('history') }
    } catch (error) {
      if (!controller.signal.aborted) setNotice(error instanceof RecipientPreviewError ? error.code : 'authorization.recipient.owner_unavailable')
    } finally {
      if (!controller.signal.aborted) setCheckingStatus(false)
    }
  }

  async function openCompleted(card: RecipientInvitationCardV1) {
    const controller = beginAction()
    try {
      const detail = await client.detail(card.invitationId, controller.signal)
      if (!controller.signal.aborted) setOpenedCard(detail.invitation)
    } catch (error) {
      if (!controller.signal.aborted) setNotice(error instanceof RecipientPreviewError ? error.code : 'authorization.recipient.owner_unavailable')
    }
  }

  return <div className="identity-shell" data-enterprise-fixture={IDENTITY_FIXTURE_MARKER}><AuthPage
    title={t('security.preview.recipient.title')} description={t('security.preview.recipient.description')}
    transitionKey={`recipient-preview-${scenario}-${filter}`} pending={false}
  >
    <Stack gap={4}>
      <Text tone="secondary">{t('security.preview.simulated')}</Text>
      <div role="group" aria-label={t('security.preview.scenarios')}><Stack gap={2}>
        {identityPreviewStates.map((candidate) => <Button key={candidate}
          label={t(`security.preview.scenario.${candidate}`)} variant="outline" tone="neutral"
          pressed={candidate === scenario} onClick={() => setScenario(candidate)} />)}
      </Stack></div>
      <div role="group" aria-label={t('security.preview.recipient.views')}><Stack gap={2}>
        {(['pending', 'history'] as const).map((candidate) => <Button key={candidate}
          label={t(`security.preview.recipient.view.${candidate}`)} variant="outline" tone="neutral"
          pressed={filter === candidate} onClick={() => { setOpenedCard(undefined); setFilter(candidate) }} />)}
      </Stack></div>
      <div role="status" aria-live="polite">
        {visible === undefined || visible.kind === 'loading' ? <Text>{t('security.preview.recipient.loading')}</Text>
          : visible.kind === 'error' ? <Text>{t(messageFor(visible.code))}</Text>
            : skipped ? <Text>{t('security.preview.recipient.skipped')}</Text>
              : <Stack gap={3}>
                {page?.backfillPending && <Text>{t('security.preview.recipient.backfill')}</Text>}
                {page?.items.length === 0 && <Text>{t(`security.preview.recipient.empty.${filter}`)}</Text>}
                {page?.items.map((item, index) => item.kind === 'claim_required'
                  ? <Stack key={`claim-${index}`} gap={2}>
                      <Text>{t('security.preview.recipient.teaser')}</Text>
                      <Text tone="secondary">{t('security.preview.recipient.teaserPrivacy')}</Text>
                      <Button label={t('security.preview.recipient.useFixtureLink')} variant="outline" tone="neutral"
                        onClick={claimFromFixtureEmailLink} />
                    </Stack>
                  : <Stack key={item.invitation.invitationId} gap={2}>
                      <Text>{item.invitation.tenantDisplay} · {targetLabel(item.invitation)}</Text>
                      <Text tone="secondary">{t('security.preview.recipient.invitedBy', { inviter: item.invitation.inviterDisplay })}</Text>
                      <Text>{t(`security.preview.recipient.state.${item.invitation.state}`)}</Text>
                      {item.invitation.statusUncertain && <Text>{t('security.preview.recipient.uncertain')}</Text>}
                      {item.invitation.state === 'pending' && !item.invitation.statusUncertain && <Stack gap={2}>
                        <Button label={t('security.preview.recipient.accept')} variant="outline" tone="neutral" disabled={busy}
                          onClick={() => { void decide(item.invitation, 'accept', false) }} />
                        <Button label={t('security.preview.recipient.reject')} variant="outline" tone="neutral" disabled={busy}
                          onClick={() => { void decide(item.invitation, 'reject', false) }} />
                      </Stack>}
                      {item.invitation.state !== 'pending' && <Button label={t('security.preview.recipient.openCompleted')}
                        variant="outline" tone="neutral" onClick={() => { void openCompleted(item.invitation) }} />}
                    </Stack>)}
                {emailedLinkReady && <Stack gap={2}>
                  <Text>{t('security.preview.recipient.claimed')}</Text>
                  <Text tone="secondary">{t('security.preview.recipient.tokenMemory')}</Text>
                  <Button label={t('security.preview.recipient.accept')} variant="outline" tone="neutral" disabled={busy}
                    onClick={() => { void decide({ invitationId: fixtureEmailLink.invitationId, invitationVersion: fixtureEmailLink.invitationVersion, state: 'pending', statusUncertain: false }, 'accept', true) }} />
                  <Button label={t('security.preview.recipient.reject')} variant="outline" tone="neutral" disabled={busy}
                    onClick={() => { void decide({ invitationId: fixtureEmailLink.invitationId, invitationVersion: fixtureEmailLink.invitationVersion, state: 'pending', statusUncertain: false }, 'reject', true) }} />
                </Stack>}
                {openedCard !== undefined && <Text>{t('security.preview.recipient.completedDetail', { state: openedCard.state, reason: openedCard.terminalReason ?? '' })}</Text>}
                {operation !== undefined && <Stack gap={2}>
                  <Text>{t(`security.preview.recipient.operation.${operation.state}`)}</Text>
                  {checkingStatus && <Text>{t('security.preview.recipient.checkingStatus')}</Text>}
                  {operation.state === 'pending' && <Button label={t('security.preview.recipient.checkStatus')}
                    variant="outline" tone="neutral" disabled={checkingStatus} onClick={() => { void checkStatus() }} />}
                </Stack>}
                {notice !== undefined && <Text>{notice === 'accept' || notice === 'reject'
                  ? t(`security.preview.recipient.queued.${notice}`) : t(messageFor(notice))}</Text>}
                <Button label={t('security.preview.recipient.skip')} variant="outline" tone="neutral"
                  onClick={() => { setSkipped(true); setEmailedLinkReady(false); emailedToken.current = null }} />
              </Stack>}
      </div>
    </Stack>
  </AuthPage></div>
}
