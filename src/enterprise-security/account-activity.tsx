import { AuthPage, Avatar, Button, Stack, Text } from '@polymorph/ui/identity'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { SecurityActivityCardV1 } from '../contracts/generated/enterprise-security-v1/types/SecurityActivityCardV1'
import { AccountSecurityActivityClient, accountSlotFromSearch, type AccountActivitySession } from './account-activity-client'

interface ActivityState {
  readonly session: AccountActivitySession
  readonly items: readonly SecurityActivityCardV1[]
  readonly nextCursor: string | null
}

function ActivityCard({ activity }: { activity: SecurityActivityCardV1 }) {
  const { t, i18n } = useTranslation()
  const location = activity.countryCode === null
    ? activity.regionId === null ? null : t('securityActivity.region', { region: activity.regionId })
    : activity.regionId === null ? activity.countryCode : t('securityActivity.location', { country: activity.countryCode, region: activity.regionId })
  return <li className="identity-security-activity-card">
    <div className="identity-security-activity-heading">
      <strong>{t(`securityActivity.kind.${activity.kind}`)}</strong>
      <span data-outcome={activity.outcome}>{t(`securityActivity.outcome.${activity.outcome}`)}</span>
    </div>
    <Text tone="secondary">
      <time dateTime={activity.occurredAt}>{new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.occurredAt))}</time>
      {location === null ? null : <> · <bdi>{location}</bdi></>}
    </Text>
    {activity.reason === null ? null : <Text tone="secondary">{t(`securityActivity.reason.${activity.reason}`)}</Text>}
  </li>
}

export function AccountSecurityActivityPage() {
  const { t } = useTranslation()
  const [state, setState] = useState<ActivityState>()
  const [failure, setFailure] = useState(false)
  const [pending, setPending] = useState(true)
  const attempt = useRef(0)
  const client = useRef(new AccountSecurityActivityClient())

  const loadInitial = () => {
    const generation = ++attempt.current
    setPending(true)
    setFailure(false)
    void (async () => {
      const session = await client.current.bootstrap(accountSlotFromSearch(window.location.search))
      const page = await client.current.page(session)
      if (generation === attempt.current) setState({ session, items: page.page.items, nextCursor: page.page.nextCursor })
    })().catch(() => { if (generation === attempt.current) setFailure(true) }).finally(() => {
      if (generation === attempt.current) setPending(false)
    })
  }

  useEffect(() => {
    loadInitial()
    return () => { attempt.current += 1 }
  }, [])

  useEffect(() => {
    document.title = t('securityActivity.title')
  }, [t])

  const loadMore = () => {
    if (state === undefined || state.nextCursor === null || pending) return
    const generation = ++attempt.current
    setPending(true)
    setFailure(false)
    void client.current.page(state.session, state.nextCursor).then((page) => {
      if (generation !== attempt.current) return
      const ids = new Set(state.items.map((item) => item.eventId))
      if (page.page.items.some((item) => ids.has(item.eventId))) throw new Error('Activity cursor repeated an event')
      setState({ session: state.session, items: [...state.items, ...page.page.items], nextCursor: page.page.nextCursor })
    }).catch(() => { if (generation === attempt.current) setFailure(true) }).finally(() => {
      if (generation === attempt.current) setPending(false)
    })
  }

  const principal = state?.session.bootstrap.principal
  return <div className="identity-shell" data-busy={pending}>
    <AuthPage
      title={t('securityActivity.title')}
      description={t('securityActivity.description')}
      transitionKey="security-activity"
      pending={pending}
      backAction={<Button label={t('securityActivity.back')} variant="ghost" tone="neutral" onClick={() => window.history.back()} />}
    >
      <Stack gap={4}>
        {principal === undefined ? null : <div className="identity-security-activity-account">
          <Avatar name={principal.displayName} />
          <strong><bdi dir="auto">{principal.displayName}</bdi></strong>
        </div>}
        {state !== undefined && state.items.length === 0 && !failure ? <Text tone="secondary">{t('securityActivity.empty')}</Text> : null}
        {state === undefined && pending ? <Text tone="secondary"><span role="status">{t('securityActivity.loading')}</span></Text> : null}
        {state === undefined ? null : <ol className="identity-security-activity-list">{state.items.map((activity) => <ActivityCard key={activity.eventId} activity={activity} />)}</ol>}
        {failure ? <div role="alert" className="identity-security-activity-error"><Text tone="secondary">{t('securityActivity.error')}</Text><Button label={t('securityActivity.retry')} variant="outline" tone="neutral" onClick={state === undefined ? loadInitial : loadMore} /></div> : null}
        {!failure && state?.nextCursor !== null && state !== undefined ? <Button label={t('securityActivity.loadMore')} variant="outline" tone="neutral" loading={pending} onClick={loadMore} /> : null}
      </Stack>
    </AuthPage>
  </div>
}
