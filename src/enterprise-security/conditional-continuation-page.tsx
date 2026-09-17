import { AuthPage, Button, Stack, Text } from '@polymorph/ui/identity'
import { useParams } from '@tanstack/react-router'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { armConditionalBfcacheRecovery, armCurrentBfcacheRecovery } from '../security/bfcache'
import { discardConsumedAuthFragment } from '../security/fragment'
import { installPresentationTheme } from '../presentation/theme'
import { ConditionalStepUpError, ConditionalStepUpSession, type ConditionalIdentityEntry, type ConditionalIdentityOwner, type ConditionalStepUpFailure } from './conditional-continuation-client'

export const ConditionalIdentityOwnerContext = createContext<ConditionalIdentityOwner | undefined>(undefined)

type Phase = 'ready' | 'collecting' | 'returning' | 'returned'

export function ConditionalContinuationPage() {
  const entry = useParams({ strict: false }) as ConditionalIdentityEntry
  const owner = useContext(ConditionalIdentityOwnerContext)
  return <ConditionalContinuationPresentation entry={entry} owner={owner} />
}

export function ConditionalContinuationPresentation({ entry, owner }: { entry: ConditionalIdentityEntry; owner: ConditionalIdentityOwner | undefined }) {
  const { t } = useTranslation()
  const key = JSON.stringify(entry)
  const [loaded, setLoaded] = useState<{ key: string; owner: ConditionalIdentityOwner; session: ConditionalStepUpSession }>()
  const [fault, setFault] = useState<ConditionalStepUpFailure>()
  const [phase, setPhase] = useState<Phase>('ready')
  const [seconds, setSeconds] = useState(0)
  const running = useRef(false)
  const active = useRef<AbortController | undefined>(undefined)
  const session = loaded?.key === key && loaded.owner === owner ? loaded.session : undefined

  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    running.current = false
    setLoaded(undefined); setFault(undefined); setPhase('ready')
    armCurrentBfcacheRecovery()
    discardConsumedAuthFragment()
    if (window.__MM_AUTH_FRAGMENT_V1__ !== undefined) delete window.__MM_AUTH_FRAGMENT_V1__
    if (window.location.hash !== '' || window.location.search !== '') {
      window.history.replaceState(window.history.state, '', window.location.pathname)
      setFault('mismatch'); return () => controller.abort()
    }
    if (owner === undefined) { setFault('unavailable'); return () => controller.abort() }
    const capturedEntry: ConditionalIdentityEntry = JSON.parse(key)
    const timeout = window.setTimeout(() => {
      if (!controller.signal.aborted) { controller.abort(); setFault('unavailable') }
    }, 10_000)
    void ConditionalStepUpSession.resolve(capturedEntry, owner, controller.signal).then((value) => {
      if (controller.signal.aborted) return
      installPresentationTheme(value.catalog.presentation.themePairingId)
      armConditionalBfcacheRecovery(value.catalog, capturedEntry.continuationId)
      setSeconds(value.remainingSeconds())
      setLoaded({ key, owner, session: value })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setFault(error instanceof ConditionalStepUpError ? error.kind : 'unavailable')
    }).finally(() => window.clearTimeout(timeout))
    return () => { window.clearTimeout(timeout); controller.abort(); if (active.current === controller) active.current = undefined }
  }, [key, owner])

  useEffect(() => {
    if (session === undefined) return
    const check = () => {
      const controller = active.current
      if (controller === undefined || controller.signal.aborted) return
      try { session.checkCurrent(controller.signal); setSeconds(session.remainingSeconds()) }
      catch (error) {
        controller.abort(); active.current = undefined
        setLoaded(undefined); setFault(error instanceof ConditionalStepUpError ? error.kind : 'unavailable')
      }
    }
    const timer = window.setInterval(check, 1000)
    return () => window.clearInterval(timer)
  }, [session])

  useEffect(() => {
    const scrub = () => {
      active.current?.abort(); active.current = undefined
      flushSync(() => { setLoaded(undefined); setFault('unavailable'); setPhase('ready'); setSeconds(0) })
    }
    window.addEventListener('pagehide', scrub)
    return () => window.removeEventListener('pagehide', scrub)
  }, [])

  const run = () => {
    const controller = active.current
    if (session === undefined || controller === undefined || controller.signal.aborted || phase !== 'ready' || running.current) return
    running.current = true
    setPhase('collecting')
    void session.run(controller.signal, (next) => { if (!controller.signal.aborted) setPhase(next) }).then(() => {
      if (!controller.signal.aborted) setPhase('returned')
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        controller.abort(); active.current = undefined
        setLoaded(undefined); setFault(error instanceof ConditionalStepUpError ? error.kind : 'uncertain')
      }
    })
  }
  const visibleFault = owner === undefined ? 'unavailable' : fault
  const title = t('conditional.stepUp.title')
  useEffect(() => { document.title = title }, [title])
  const action = session?.challenge.action
  const scopeId = action?.resource.kind === 'project' ? action.resource.projectId
    : action?.resource.kind === 'space' ? action.resource.spaceId
      : action?.resource.kind === 'profile' ? action.resource.ownerUserId : action?.resource.tenantId

  return <div className="identity-shell"><AuthPage title={title} description={t('conditional.stepUp.description')} transitionKey={`conditional-${key}`} pending={session === undefined && visibleFault === undefined}>
    <Stack gap={4}>
      {session === undefined || action === undefined ? <span role="status"><Text>{visibleFault === undefined ? t('conditional.stepUp.loading') : t(`conditional.stepUp.error.${visibleFault}`)}</Text></span> : <>
        <Text>{t('conditional.stepUp.product', { product: t(session.catalog.presentation.productNameMessageKey) })}</Text>
        <Text>{t('conditional.stepUp.account', { account: action.userId, home: t(session.catalog.regionMessageKey(session.challenge.identityHomeRegionId)) })}</Text>
        <Text>{t('conditional.stepUp.action', { resource: action.resourceId, action: action.actionId, tenant: action.resource.tenantId, scope: scopeId })}</Text>
        <Text>{t('conditional.stepUp.destination', { region: t(session.catalog.regionMessageKey(session.challenge.decisionRegionId)) })}</Text>
        <Text tone="secondary">{t('conditional.stepUp.fixedAccount')}</Text>
        <Stack gap={2}>
          {session.challenge.required.map((requirement) => <Text key={requirement}>{t(`conditional.stepUp.required.${requirement}`)}</Text>)}
          {session.challenge.baselineRequired.map((requirement) => <Text key={requirement}>{t(`conditional.stepUp.baseline.${requirement}`)}</Text>)}
        </Stack>
        <span role="status" aria-live="polite"><Text>{t(`conditional.stepUp.phase.${phase}`)}</Text></span>
        <Text tone="secondary">{t('conditional.stepUp.expires', { seconds })}</Text>
        <Button label={t('conditional.stepUp.continue')} disabled={phase !== 'ready' || seconds === 0} onClick={run} />
        <Button label={t('conditional.stepUp.abandon')} variant="outline" tone="neutral" onClick={() => {
          active.current?.abort(); active.current = undefined
          setLoaded(undefined); setFault('rejected')
        }} />
      </>}
    </Stack>
  </AuthPage></div>
}
