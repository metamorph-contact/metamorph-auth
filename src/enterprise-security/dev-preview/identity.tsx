import { AuthPage, Button, Stack, Text } from '@polymorph/ui/identity'
import { useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import i18n from '../../i18n'
import enterpriseSecurityEn from '../../i18n/locales/en/enterprise-security.json'
import { IDENTITY_FIXTURE_MARKER } from '../dev-fixtures/identity-methods'
import { identityCoreFixture } from '../dev-fixtures/identity-core'
import { coreIdentityScreens, coreIdentityStates, type CoreIdentityPayload, type CoreIdentityScreen, type CoreIdentityState } from '../identity-core-client'
import { IdentityMethodPreviewError } from '../identity-client'

i18n.addResourceBundle('en', 'enterprise-security', enterpriseSecurityEn)

const screenNames: Record<CoreIdentityScreen, string> = {
  'SCR-IDN-001': 'entry',
  'SCR-IDN-011': 'accounts',
  'SCR-IDN-012': 'signup',
  'SCR-IDN-013': 'verification',
  'SCR-IDN-014': 'organization',
  'SCR-IDN-015': 'recovery',
  'SCR-IDN-016': 'finalization',
  'SCR-IDN-017': 'safeError',
}

type LoadState =
  | { kind: 'loading'; screenId: CoreIdentityScreen; scenario: CoreIdentityState }
  | { kind: 'result'; screenId: CoreIdentityScreen; scenario: CoreIdentityState; payload: CoreIdentityPayload }
  | { kind: 'error'; screenId: CoreIdentityScreen; scenario: CoreIdentityState; code: string }

function errorMessage(code: string): string {
  if (code === 'security.owner.unavailable') return 'security.preview.error.ownerUnavailable'
  if (code === 'security.policy.changed') return 'security.preview.error.stale'
  if (code === 'security.assurance.required') return 'security.preview.error.assurance'
  if (code === 'security.route.retry') return 'security.preview.error.region'
  if (code === 'security.provider.unavailable') return 'security.preview.error.provider'
  return 'security.preview.error.generic'
}

export function IdentitySecurityPreviewPage() {
  const { locale, screenId: routeScreenId } = useParams({ strict: false }) as { locale?: string; screenId?: string }
  const { t } = useTranslation('enterprise-security')
  const screenId = coreIdentityScreens.find((candidate) => candidate === routeScreenId)
  const [scenario, setScenario] = useState<CoreIdentityState>('ready')
  const [selected, setSelected] = useState<string>()
  const [loaded, setLoaded] = useState<LoadState>()
  const client = useMemo(() => identityCoreFixture(scenario), [scenario])

  useEffect(() => {
    if (screenId === undefined) return
    const controller = new AbortController()
    setLoaded({ kind: 'loading', screenId, scenario })
    void client.load(screenId, controller.signal).then((payload) => {
      if (!controller.signal.aborted) setLoaded({ kind: 'result', screenId, scenario, payload })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoaded({
        kind: 'error', screenId, scenario,
        code: error instanceof IdentityMethodPreviewError ? error.envelope.error.code : 'security.dependency.unavailable',
      })
    })
    return () => controller.abort()
  }, [client, screenId, scenario])

  useEffect(() => { setSelected(undefined) }, [screenId, scenario])
  useEffect(() => {
    if (screenId === undefined) return
    document.title = t(`security.preview.identity.screen.${screenNames[screenId]}.title`)
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (heading !== null) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
    })
    return () => cancelAnimationFrame(frame)
  }, [screenId, t])

  if (screenId === undefined) return null
  const visible = loaded?.screenId === screenId && loaded.scenario === scenario ? loaded : undefined
  const title = t(`security.preview.identity.screen.${screenNames[screenId]}.title`)
  const description = t(`security.preview.identity.screen.${screenNames[screenId]}.description`)
  const readOnly = scenario === 'read-only' || scenario === 'assurance-challenge'

  return <div className="identity-shell" data-enterprise-fixture={IDENTITY_FIXTURE_MARKER}><AuthPage
    title={title} description={description} transitionKey={`identity-preview-${screenId}-${scenario}`} pending={false}
  >
    <Stack gap={4}>
      <Text tone="secondary">{t('security.preview.simulated')}</Text>
      <nav aria-label={t('security.preview.identity.screens')}>
        <Stack gap={2}>{coreIdentityScreens.map((candidate) => <a
          key={candidate}
          href={`/${encodeURIComponent(locale ?? 'en')}/_preview/enterprise-security/${candidate}`}
          aria-current={candidate === screenId ? 'page' : undefined}
        >{t(`security.preview.identity.screen.${screenNames[candidate]}.title`)}</a>)}</Stack>
      </nav>
      <div role="group" aria-label={t('security.preview.scenarios')}>
        <Stack gap={2}>{coreIdentityStates.map((state) => <Button
          key={state}
          label={t(`security.preview.scenario.${state}`)}
          variant="outline" tone="neutral" pressed={scenario === state}
          onClick={() => setScenario(state)}
        />)}</Stack>
      </div>
      <div role="status" aria-live="polite">
        {visible === undefined || visible.kind === 'loading' ? <Text>{t('security.preview.loading')}</Text>
          : visible.kind === 'error' ? <Text>{t(errorMessage(visible.code))}</Text>
            : <Stack gap={3}>
              {scenario !== 'ready' && <Text tone="secondary">{t(`security.preview.state.${scenario}`)}</Text>}
              {visible.payload.kind === 'empty' && <Text>{t('security.preview.identity.noResult')}</Text>}
              {visible.payload.kind === 'entry' && <>
                <Text>{visible.payload.resolution.methods.length === 0 ? t('security.preview.empty') : t('security.preview.identity.methodPrompt')}</Text>
                <Text tone="secondary">{t('security.preview.identity.privacy')}</Text>
                <Stack gap={2}>{visible.payload.resolution.methods.map((method) => <Button
                  key={method} label={t(`security.preview.method.${method}`)}
                  variant="outline" tone="neutral" disabled={readOnly}
                  onClick={() => setSelected(method)}
                />)}</Stack>
              </>}
              {visible.payload.kind === 'accounts' && <>
                <Text>{visible.payload.accounts.accounts.length === 0 ? t('security.preview.identity.noAccounts') : t('security.preview.identity.chooseAccount')}</Text>
                <Stack gap={2}>{visible.payload.accounts.accounts.map((account) => <Button
                  key={account.reference.browserAccountId}
                  label={`${account.summary.displayName} · ${account.summary.homeTenantLabel}`}
                  variant="outline" tone="neutral" disabled={readOnly}
                  onClick={() => setSelected(account.reference.browserAccountId)}
                />)}</Stack>
                {visible.payload.accounts.unavailableCount > 0 && <Text tone="secondary">{t('security.preview.identity.unavailableAccounts')}</Text>}
                <Text tone="secondary">{t('security.preview.identity.perTab')}</Text>
              </>}
              {(visible.payload.kind === 'signup' || visible.payload.kind === 'organization') && <Text>{t(`security.preview.identity.progress.${visible.payload.progress.nextStep}`)}</Text>}
              {visible.payload.kind === 'verification' && <Text>{t('security.preview.identity.verificationFor', { email: visible.payload.preview.email })}</Text>}
              {visible.payload.kind === 'recovery' && <Text>{t('security.preview.identity.recoveryAccepted')}</Text>}
              {visible.payload.kind === 'finalization' && <Text>{t('security.preview.identity.finalizationPending')}</Text>}
              {visible.payload.kind === 'safe-error' && <Text>{t('security.preview.identity.safeRestart')}</Text>}
              {selected !== undefined && <Text>{t('security.preview.identity.selectionOnly')}</Text>}
            </Stack>}
      </div>
    </Stack>
  </AuthPage></div>
}
