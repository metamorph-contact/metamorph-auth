import { AuthPage, Button, Stack, Text } from '@polymorph/ui/identity'
import { useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import i18n from '../../i18n'
import enterpriseSecurityEn from '../../i18n/locales/en/enterprise-security.json'
import { identityFederationFixture } from '../dev-fixtures/identity-federation'
import { IDENTITY_FIXTURE_MARKER } from '../dev-fixtures/identity-methods'
import { identityPreviewStates, type IdentityPreviewState } from '../dev-fixtures/identity-states'
import { federationIdentityScreens, type FederationIdentityScreen, type FederationPayload } from '../identity-federation-client'
import { IdentityMethodPreviewError } from '../identity-client'

i18n.addResourceBundle('en', 'enterprise-security', enterpriseSecurityEn)

const names: Record<FederationIdentityScreen, string> = {
  'SCR-IDN-006': 'federation',
  'SCR-IDN-007': 'emergency',
  'SCR-IDN-008': 'jitProfile',
  'SCR-IDN-018': 'scimActivation',
}
type LoadState =
  | { kind: 'loading'; screenId: FederationIdentityScreen; scenario: IdentityPreviewState; protocol: 'saml' | 'oidc' }
  | { kind: 'result'; screenId: FederationIdentityScreen; scenario: IdentityPreviewState; protocol: 'saml' | 'oidc'; payload: FederationPayload }
  | { kind: 'error'; screenId: FederationIdentityScreen; scenario: IdentityPreviewState; protocol: 'saml' | 'oidc'; code: string }

function errorMessage(code: string): string {
  if (code === 'security.provider.unavailable') return 'security.preview.federation.providerOutage'
  if (code === 'security.policy.changed') return 'security.preview.error.stale'
  if (code === 'security.route.retry') return 'security.preview.error.region'
  if (code === 'security.assurance.required') return 'security.preview.error.assurance'
  if (code === 'security.owner.unavailable') return 'security.preview.error.ownerUnavailable'
  return 'security.preview.error.generic'
}

export function FederationIdentityPreviewPage() {
  const { locale, screenId: routeScreenId } = useParams({ strict: false }) as { locale?: string; screenId?: string }
  const { t } = useTranslation('enterprise-security')
  const screenId = federationIdentityScreens.find((candidate) => candidate === routeScreenId)
  const [scenario, setScenario] = useState<IdentityPreviewState>('ready')
  const [protocol, setProtocol] = useState<'saml' | 'oidc'>('saml')
  const [continued, setContinued] = useState(false)
  const [loaded, setLoaded] = useState<LoadState>()
  const client = useMemo(() => identityFederationFixture(scenario, protocol), [scenario, protocol])

  useEffect(() => {
    if (screenId === undefined) return
    const controller = new AbortController()
    setLoaded({ kind: 'loading', screenId, scenario, protocol })
    void client.load(screenId, controller.signal).then((payload) => {
      if (!controller.signal.aborted) setLoaded({ kind: 'result', screenId, scenario, protocol, payload })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoaded({
        kind: 'error', screenId, scenario, protocol,
        code: error instanceof IdentityMethodPreviewError ? error.envelope.error.code : 'security.dependency.unavailable',
      })
    })
    return () => controller.abort()
  }, [client, screenId, scenario, protocol])

  useEffect(() => { setContinued(false) }, [screenId, scenario, protocol])
  useEffect(() => {
    if (screenId === undefined) return
    document.title = t(`security.preview.federation.screen.${names[screenId]}.title`)
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (heading !== null) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
    })
    return () => cancelAnimationFrame(frame)
  }, [screenId, t])

  if (screenId === undefined) return null
  const visible = loaded?.screenId === screenId && loaded.scenario === scenario && loaded.protocol === protocol ? loaded : undefined
  const title = t(`security.preview.federation.screen.${names[screenId]}.title`)
  const description = t(`security.preview.federation.screen.${names[screenId]}.description`)

  return <div className="identity-shell" data-enterprise-fixture={IDENTITY_FIXTURE_MARKER}><AuthPage
    title={title} description={description} transitionKey={`federation-preview-${screenId}-${scenario}-${protocol}`} pending={false}
  >
    <Stack gap={4}>
      <Text tone="secondary">{t('security.preview.simulated')}</Text>
      <nav aria-label={t('security.preview.federation.screens')}>
        <Stack gap={2}>{federationIdentityScreens.map((candidate) => <a
          key={candidate}
          href={`/${encodeURIComponent(locale ?? 'en')}/_preview/enterprise-security/${candidate}`}
          aria-current={candidate === screenId ? 'page' : undefined}
        >{t(`security.preview.federation.screen.${names[candidate]}.title`)}</a>)}</Stack>
      </nav>
      {screenId === 'SCR-IDN-006' && <div role="group" aria-label={t('security.preview.federation.protocol')}>
        <Stack gap={2}>{(['saml', 'oidc'] as const).map((candidate) => <Button
          key={candidate} label={t(`security.preview.federation.protocol.${candidate}`)}
          variant="outline" tone="neutral" pressed={protocol === candidate}
          onClick={() => setProtocol(candidate)}
        />)}</Stack>
      </div>}
      <div role="group" aria-label={t('security.preview.scenarios')}>
        <Stack gap={2}>{identityPreviewStates.map((state) => <Button
          key={state} label={t(`security.preview.scenario.${state}`)}
          variant="outline" tone="neutral" pressed={scenario === state}
          onClick={() => setScenario(state)}
        />)}</Stack>
      </div>
      <div role="status" aria-live="polite">
        {visible === undefined || visible.kind === 'loading' ? <Text>{t('security.preview.loading')}</Text>
          : visible.kind === 'error' ? <Text>{t(errorMessage(visible.code))}</Text>
            : <Stack gap={3}>
              {scenario !== 'ready' && <Text tone="secondary">{t(`security.preview.state.${scenario}`)}</Text>}
              {visible.payload.kind === 'empty' && <Text>{t('security.preview.federation.empty')}</Text>}
              {visible.payload.kind === 'federation' && <>
                <Text>{t('security.preview.federation.configured', { protocol: visible.payload.request.protocol.toUpperCase() })}</Text>
                <Text tone="secondary">{t('security.preview.federation.noRedirect')}</Text>
                {visible.payload.handoff !== null && <Text>{t('security.preview.federation.handoff', { tenant: visible.payload.handoff.tenantDisplayName, provider: visible.payload.handoff.providerDisplayName })}</Text>}
                <Button label={t('security.preview.federation.continue')} variant="outline" tone="neutral" onClick={() => setContinued(true)} />
                {continued && <Text>{t('security.preview.federation.continuation', { step: visible.payload.callback.nextStep })}</Text>}
              </>}
              {visible.payload.kind === 'emergency' && <>
                <Text>{t('security.preview.federation.ssoOnly')}</Text>
                <Text>{t('security.preview.federation.emergency')}</Text>
              </>}
              {visible.payload.kind === 'jit-profile' && <>
                <Text>{t('security.preview.federation.jitEmail')}</Text>
                <Text>{t('security.preview.federation.jitProfile')}</Text>
                <Text>{t('security.preview.federation.jitProfileSample', {
                  handle: visible.payload.profileRequest.profile.handle,
                  firstName: visible.payload.profileRequest.profile.firstName,
                  avatarColor: visible.payload.profileRequest.profile.avatarColor,
                })}</Text>
                <Text tone="secondary">{t('security.preview.federation.privacyHandoff')}</Text>
                <Text tone="secondary">{t('security.preview.federation.pictureImport')}</Text>
              </>}
              {visible.payload.kind === 'scim-activation' && <>
                <Text>{t('security.preview.federation.scimVerify')}</Text>
                <Text>{t(visible.payload.activation.nextStep === 'ready' ? 'security.preview.federation.scimActivated' : 'security.preview.federation.scimPending')}</Text>
                <Text tone="secondary">{t('security.preview.federation.noAccessGrant')}</Text>
              </>}
            </Stack>}
      </div>
    </Stack>
  </AuthPage></div>
}
