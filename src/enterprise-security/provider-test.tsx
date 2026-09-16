import { Button, Stack, Text } from '@polymorph/ui/identity'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cancelIdentityFlow, currentProviderRuntimeTestAuthorization, randomSecret32,
  releaseProviderRuntimeTest, type IdentityFlow } from '../protocol/client'
import { identityFederationClient } from './federation-client'
import i18n from '../i18n'
import en from '../i18n/locales/en/enterprise-security.json'
i18n.addResourceBundle('en', 'enterprise-security', en)

/** C verifies the preparation and selects the original native administrator
 * account. This panel cannot choose another account or enter product signup. */
export function ProviderRuntimeTestPanel({flow, navigation}: {
  flow: IdentityFlow; navigation: (uri: string) => Promise<void>
}) {
  const {t} = useTranslation('enterprise-security')
  const context = useMemo(() => flow.bootstrap.providerTest, [flow])
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [concealed, setConcealed] = useState(!context)
  const [cancelled, setCancelled] = useState(false)
  const [cancelFailed, setCancelFailed] = useState(false)
  const busy = useRef(false)
  const cancelling = useRef(false)
  const controller = useRef(new AbortController())
  const lifecycle = useRef(0)
  const cancelId = useMemo(() => randomSecret32(), [flow])
  useEffect(() => {
    const generation = ++lifecycle.current
    controller.current = new AbortController()
    const scrub = () => {
      controller.current.abort()
      releaseProviderRuntimeTest(flow)
      setConcealed(true)
      setPending(false)
    }
    const duration = context ? Math.min(Date.parse(context.expiresAt), Date.parse(flow.bootstrap.expiresAt),
      Date.parse(flow.catalog.projection.expiresAt)) - Date.now() : 0
    const timer = window.setTimeout(scrub, Math.max(0, duration))
    window.addEventListener('pagehide', scrub)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', scrub)
      controller.current.abort()
      queueMicrotask(() => { if (lifecycle.current === generation) scrub() })
    }
  }, [flow, context])
  async function start() {
    if (busy.current || !context || concealed) return
    busy.current = true; setPending(true); setFailed(false)
    const signal = controller.current.signal
    try {
      await currentProviderRuntimeTestAuthorization(flow)
      signal.throwIfAborted()
      const result = await identityFederationClient(flow, context.providerRegionId).call('identity.federation.start', {
        schemaVersion: 1, flowId: flow.bootstrap.flowId, targetTenantId: context.tenantId,
        providerId: context.providerId, protocol: context.protocol,
        clientRegistrationId: flow.catalog.projection.clientId,
      }, context.testId, signal)
      signal.throwIfAborted()
      if (result.providerId !== context.providerId
        || Date.parse(result.expiresAt) > Date.parse(context.expiresAt)
        || Date.parse(result.expiresAt) <= Date.now()) throw new Error('security.ceremony.mismatch')
      const uri = new URL(result.navigationUri)
      if (uri.protocol !== 'https:' || uri.username || uri.password || uri.hash) throw new Error('security.ceremony.mismatch')
      await navigation(uri.href)
    } catch { if (!signal.aborted) setFailed(true) }
    finally { busy.current = false; if (!signal.aborted && !cancelling.current) setPending(false) }
  }
  async function cancel() {
    if (cancelling.current) return
    cancelling.current = true; setPending(true); setCancelFailed(false); setConcealed(true)
    controller.current.abort(); releaseProviderRuntimeTest(flow)
    try { await cancelIdentityFlow(flow, cancelId); setCancelled(true) }
    catch { setCancelFailed(true) }
    finally { cancelling.current = false; setPending(false) }
  }
  return <Stack>
    <Text>{t(cancelled ? 'security.journey.cancelled' : concealed ? 'security.journey.expired' : 'security.journey.providerTestDescription')}</Text>
    {!concealed && <Button label={t('security.journey.providerTestStart')} disabled={pending} loading={pending} onClick={()=>void start()}/>}
    {failed && <Text>{t('security.journey.unavailable')}</Text>}
    {cancelFailed && <Text>{t('security.journey.cancelFailed')}</Text>}
    {(!concealed || cancelFailed) && <Button label={t(cancelFailed?'security.journey.retryButton':'security.journey.cancel')}
      disabled={cancelling.current} onClick={()=>void cancel()}/>}
  </Stack>
}
