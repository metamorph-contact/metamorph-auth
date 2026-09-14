import { AuthPage, Button, Stack, Text } from '@polymorph/ui/identity'
import { useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { IdentityEntryRequestV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityEntryRequestV1'
import type { IdentityMethodResolutionV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import i18n from '../../i18n'
import enterpriseSecurityEn from '../../i18n/locales/en/enterprise-security.json'
import { IdentityMethodPreviewError } from '../identity-client'
import { IDENTITY_FIXTURE_MARKER, identityMethodFixture, identityPreviewScenarios, type IdentityPreviewScenario } from '../dev-fixtures/identity-methods'

i18n.addResourceBundle('en', 'enterprise-security', enterpriseSecurityEn)

const previewRequest: IdentityEntryRequestV1 = {
  schemaVersion: 1,
  flowId: '018f0000-0000-7000-8000-000000000002',
  realmId: 'fixture-realm',
  clientRegistrationId: 'octamorph-browser',
  routeHint: null,
}

export function IdentitySecurityPreviewPage() {
  const { screenId } = useParams({ strict: false }) as { screenId?: string }
  const { t } = useTranslation('enterprise-security')
  const [scenario, setScenario] = useState<IdentityPreviewScenario>('SCR-IDN-001:ready')
  const [state, setState] = useState<
    { kind: 'loading' } |
    { kind: 'result'; scenario: IdentityPreviewScenario; value: IdentityMethodResolutionV1 } |
    { kind: 'error'; scenario: IdentityPreviewScenario; code: string }
  >({ kind: 'loading' })
  const visibleState = state.kind === 'loading' || state.scenario === scenario ? state : { kind: 'loading' as const }
  const client = useMemo(() => identityMethodFixture(scenario), [scenario])

  useEffect(() => {
    const controller = new AbortController()
    void client.resolveMethods(previewRequest, controller.signal).then((value) => {
      if (!controller.signal.aborted) setState({ kind: 'result', scenario, value })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({
        kind: 'error',
        scenario,
        code: error instanceof IdentityMethodPreviewError ? error.envelope.error.code : 'security.dependency.unavailable',
      })
    })
    return () => controller.abort()
  }, [client, scenario])

  useEffect(() => {
    document.title = t('security.preview.identity.title')
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (heading !== null) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
    })
    return () => cancelAnimationFrame(frame)
  }, [t])

  if (screenId !== 'SCR-IDN-001') return null
  return <div className="identity-shell" data-enterprise-fixture={IDENTITY_FIXTURE_MARKER}><AuthPage
    title={t('security.preview.identity.title')}
    description={t('security.preview.identity.description')}
    transitionKey={`identity-preview-${scenario}`}
    pending={visibleState.kind === 'loading' && scenario !== 'SCR-IDN-001:loading'}
  >
    <Stack gap={4}>
      <Text tone="secondary">{t('security.preview.simulated')}</Text>
      <div role="group" aria-label={t('security.preview.scenarios')}>
        <Stack gap={2}>{identityPreviewScenarios.map((entry) => <Button
          key={entry.id}
          label={t(`security.preview.scenario.${entry.state}`)}
          variant="outline"
          tone="neutral"
          pressed={scenario === entry.id}
          onClick={() => setScenario(entry.id)}
        />)}</Stack>
      </div>
      <div role="status" aria-live="polite">
        {visibleState.kind === 'loading' && <Text>{t('security.preview.loading')}</Text>}
        {visibleState.kind === 'error' && <Text>{t(visibleState.code === 'security.owner.unavailable'
          ? 'security.preview.error.ownerUnavailable'
          : 'security.preview.error.generic')}</Text>}
        {visibleState.kind === 'result' && <Text>{visibleState.value.methods.length === 0
          ? t('security.preview.empty')
          : t('security.preview.identity.methods', { methods: visibleState.value.methods.map((method) => t(`security.preview.method.${method}`)).join(', ') })}
        </Text>}
      </div>
    </Stack>
  </AuthPage></div>
}
