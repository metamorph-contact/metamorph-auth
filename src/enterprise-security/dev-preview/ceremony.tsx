import { AuthPage, Button, FormField, Input, Stack, Text } from '@polymorph/ui/identity'
import { useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import type { IdentityTotpEnrollResultV1 } from '../../contracts/generated/enterprise-security-v1/types/IdentityTotpEnrollResultV1'
import i18n from '../../i18n'
import enterpriseSecurityEn from '../../i18n/locales/en/enterprise-security.json'
import { identityCeremonyFixture, previewPasskeyBrowserAdapter } from '../dev-fixtures/identity-ceremony'
import { IDENTITY_FIXTURE_MARKER } from '../dev-fixtures/identity-methods'
import { identityPreviewStates, type IdentityPreviewState } from '../dev-fixtures/identity-states'
import { ceremonyIdentityScreens, type CeremonyIdentityScreen, type CeremonyPayload } from '../identity-ceremony-client'
import { IdentityMethodPreviewError } from '../identity-client'

i18n.addResourceBundle('en', 'enterprise-security', enterpriseSecurityEn)

const names: Record<CeremonyIdentityScreen, string> = {
  'SCR-IDN-002': 'passkey',
  'SCR-IDN-003': 'totp',
  'SCR-IDN-004': 'recoveryCode',
  'SCR-IDN-005': 'stepUp',
  'SCR-IDN-010': 'factorRecovery',
}
type LoadState =
  | { kind: 'loading'; screenId: CeremonyIdentityScreen; scenario: IdentityPreviewState }
  | { kind: 'result'; screenId: CeremonyIdentityScreen; scenario: IdentityPreviewState; payload: CeremonyPayload }
  | { kind: 'error'; screenId: CeremonyIdentityScreen; scenario: IdentityPreviewState; code: string }

function errorMessage(code: string): string {
  if (code === 'security.ceremony.expired') return 'security.preview.ceremony.error.expired'
  if (code === 'security.ceremony.mismatch') return 'security.preview.ceremony.error.replayed'
  if (code === 'security.assurance.required') return 'security.preview.error.assurance'
  if (code === 'security.route.retry') return 'security.preview.error.region'
  if (code === 'security.provider.unavailable') return 'security.preview.error.provider'
  if (code === 'security.owner.unavailable') return 'security.preview.error.ownerUnavailable'
  return 'security.preview.error.generic'
}

export function CeremonyIdentityPreviewPage() {
  const { locale, screenId: routeScreenId } = useParams({ strict: false }) as { locale?: string; screenId?: string }
  const { t } = useTranslation('enterprise-security')
  const screenId = ceremonyIdentityScreens.find((candidate) => candidate === routeScreenId)
  const [scenario, setScenario] = useState<IdentityPreviewState>('ready')
  const [loaded, setLoaded] = useState<LoadState>()
  const [code, setCode] = useState('')
  const [totpDisplay, setTotpDisplay] = useState<IdentityTotpEnrollResultV1>()
  const [actionMessage, setActionMessage] = useState<string>()
  const [actionPending, setActionPending] = useState(false)
  const action = useRef<AbortController | undefined>(undefined)
  const client = useMemo(() => identityCeremonyFixture(scenario), [scenario])

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

  useEffect(() => {
    setCode('')
    setTotpDisplay(undefined)
    setActionMessage(undefined)
    setActionPending(false)
    return () => { action.current?.abort(); action.current = undefined }
  }, [screenId, scenario])
  useEffect(() => {
    const scrub = () => {
      action.current?.abort()
      action.current = undefined
      setActionPending(false)
      setCode('')
      setTotpDisplay(undefined)
    }
    window.addEventListener('pagehide', scrub)
    return () => window.removeEventListener('pagehide', scrub)
  }, [])
  useEffect(() => {
    if (screenId === undefined) return
    document.title = t(`security.preview.ceremony.screen.${names[screenId]}.title`)
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (heading !== null) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
    })
    return () => cancelAnimationFrame(frame)
  }, [screenId, t])

  if (screenId === undefined) return null
  const visible = loaded?.screenId === screenId && loaded.scenario === scenario ? loaded : undefined
  const title = t(`security.preview.ceremony.screen.${names[screenId]}.title`)
  const description = t(`security.preview.ceremony.screen.${names[screenId]}.description`)
  const run = (work: (signal: AbortSignal) => Promise<void>) => {
    if (action.current !== undefined && !action.current.signal.aborted) return
    const controller = new AbortController()
    action.current = controller
    setActionPending(true)
    void work(controller.signal).catch((error: unknown) => {
      if (controller.signal.aborted) return
      const key = error instanceof IdentityMethodPreviewError
        ? errorMessage(error.envelope.error.code)
        : 'security.preview.ceremony.browserUnavailable'
      setActionMessage(key)
    }).finally(() => {
      if (action.current === controller) action.current = undefined
      if (!controller.signal.aborted) setActionPending(false)
    })
  }
  const submitCode = (event: FormEvent<HTMLFormElement>, payload: Extract<CeremonyPayload, { kind: 'totp' | 'recovery-code' }>) => {
    event.preventDefault()
    const submitted = code.trim()
    setCode('')
    setActionMessage(undefined)
    run(async (signal) => {
      if (payload.kind === 'totp') await client.verifyTotp({ ceremony: payload.ceremony, code: submitted }, signal)
      else await client.redeemRecoveryCode({ ceremony: payload.ceremony, code: submitted }, signal)
      setActionMessage('security.preview.ceremony.serverContinuation')
    })
  }

  return <div className="identity-shell" data-enterprise-fixture={IDENTITY_FIXTURE_MARKER}><AuthPage
    title={title} description={description} transitionKey={`ceremony-preview-${screenId}-${scenario}`} pending={false}
  >
    <Stack gap={4}>
      <Text tone="secondary">{t('security.preview.simulated')}</Text>
      <nav aria-label={t('security.preview.ceremony.screens')}>
        <Stack gap={2}>{ceremonyIdentityScreens.map((candidate) => <a
          key={candidate}
          href={`/${encodeURIComponent(locale ?? 'en')}/_preview/enterprise-security/${candidate}`}
          aria-current={candidate === screenId ? 'page' : undefined}
        >{t(`security.preview.ceremony.screen.${names[candidate]}.title`)}</a>)}</Stack>
      </nav>
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
              {visible.payload.kind === 'empty' && <Text>{t('security.preview.ceremony.empty')}</Text>}
              {visible.payload.kind === 'passkey' && <>
                <Text>{t('security.preview.ceremony.passkeyChallenge')}</Text>
                <Button label={t('security.preview.ceremony.tryPasskey')} variant="outline" tone="neutral" disabled={actionPending}
                  onClick={() => run(async (signal) => {
                    const payload = visible.payload
                    if (payload.kind === 'passkey') await previewPasskeyBrowserAdapter.assert(payload.assertion, signal)
                  })} />
                <Button label={t('security.preview.ceremony.registerPasskey')} variant="outline" tone="neutral" disabled={actionPending}
                  onClick={() => run(async (signal) => {
                    const payload = visible.payload
                    if (payload.kind === 'passkey') await previewPasskeyBrowserAdapter.register(payload.registration, signal)
                  })} />
              </>}
              {visible.payload.kind === 'totp' && <>
                <Text>{t('security.preview.ceremony.totpPrompt')}</Text>
                <Button label={t('security.preview.ceremony.manualSetup')} variant="outline" tone="neutral"
                  disabled={actionPending || totpDisplay?.kind === 'first_display'}
                  onClick={() => run(async (signal) => {
                    const payload = visible.payload
                    if (payload.kind !== 'totp') return
                    const display = await client.firstDisplayTotp(payload.ceremony, signal)
                    if (!signal.aborted) setTotpDisplay(display)
                  })} />
                {totpDisplay?.kind === 'first_display' && <div><Text>{t('security.preview.ceremony.manualKey')}</Text><code>{totpDisplay.options.seed}</code></div>}
                {totpDisplay?.kind === 'material_unavailable' && <Text>{t('security.preview.ceremony.materialUnavailable')}</Text>}
              </>}
              {visible.payload.kind === 'recovery-code' && <Text>{t('security.preview.ceremony.recoveryCodePrompt')}</Text>}
              {(visible.payload.kind === 'totp' || visible.payload.kind === 'recovery-code') && <form onSubmit={(event) => {
                const payload = visible.payload
                if (payload.kind === 'totp' || payload.kind === 'recovery-code') submitCode(event, payload)
              }}>
                <Stack gap={2}>
                  <FormField id="identity-ceremony-code" label={t(visible.payload.kind === 'totp' ? 'security.preview.ceremony.totpCode' : 'security.preview.ceremony.recoveryCode')}>
                    <Input type="text" autoComplete="one-time-code" maxLength={visible.payload.kind === 'totp' ? 6 : 64} value={code} onChange={setCode} />
                  </FormField>
                  <Button type="submit" label={t('security.preview.ceremony.checkCode')} disabled={actionPending || code.trim().length === 0} />
                </Stack>
              </form>}
              {visible.payload.kind === 'step-up' && <>
                <Text>{t('security.preview.ceremony.stepUpAction', { action: visible.payload.request.operationKey })}</Text>
                <Text>{t('security.preview.ceremony.stepUpPending')}</Text>
                <Text tone="secondary">{t('security.preview.ceremony.firstLogin')}</Text>
              </>}
              {visible.payload.kind === 'factor-recovery' && <>
                <Text>{t(`security.preview.ceremony.recoveryState.${visible.payload.status.state}`)}</Text>
                {visible.payload.status.earliestCompletionAt !== null && <Text tone="secondary">{t('security.preview.ceremony.hold')}</Text>}
              </>}
            </Stack>}
      </div>
      {actionMessage !== undefined && <span role="status"><Text>{t(actionMessage)}</Text></span>}
    </Stack>
  </AuthPage></div>
}
