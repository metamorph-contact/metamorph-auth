import { Button, Stack, Text } from '@polymorph/ui/identity'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IdentityFlow } from '../protocol/client'
import type { IdentityMethodResolutionV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import { identityFederationClient } from './federation-client'
import { FederationJourney, live } from './federation-journey'
import { randomUuid7 } from '../protocol/random'
import i18n from '../i18n'
import en from '../i18n/locales/en/enterprise-security.json'
i18n.addResourceBundle('en', 'enterprise-security', en)

/** Advisory discovery stays scoped to the current flow/email. Password
 * submission continues through its existing current-policy owner. */
export function FederationMethodChoices({
  flow,
  email,
  disabled,
  navigate,
}: {
  flow: IdentityFlow
  email: string
  disabled: boolean
  navigate: (uri: string) => Promise<void>
}) {
  const { t } = useTranslation('enterprise-security')
  const normalized = email.trim().toLowerCase()
  const [resolution, setResolution] = useState<{
    email: string
    value: IdentityMethodResolutionV1
  }>()
  const [failed, setFailed] = useState(false)
  const [pending, setPending] = useState(false)
  const [expired, setExpired] = useState(false)
  const journeyRef = useRef<FederationJourney | undefined>(undefined)
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    journeyRef.current?.stop()
    journeyRef.current = undefined
    setResolution(undefined)
    setFailed(false)
    setPending(false)
    setExpired(false)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized)) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void Promise.resolve()
        .then(() =>
          identityFederationClient(flow).call(
            'identity.methods.resolve',
            {
              schemaVersion: 1,
              flowId: flow.bootstrap.flowId,
              realmId: flow.catalog.projection.realmId,
              clientRegistrationId: flow.catalog.projection.clientId,
              routeHint: normalized,
            },
            randomUuid7(),
            controller.signal,
          ),
        )
        .then((value) => {
          if (!controller.signal.aborted) {
            live(value.expiresAt)
            setResolution({ email: normalized, value })
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailed(true)
        })
    }, 300)
    const scrub = () => {
      controller.abort()
      journeyRef.current?.stop()
      journeyRef.current = undefined
      setResolution(undefined)
      setExpired(true)
    }
    window.addEventListener('pagehide', scrub)
    return () => {
      controller.abort()
      journeyRef.current?.stop()
      journeyRef.current = undefined
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', scrub)
    }
  }, [flow, normalized, generation])
  const visible = resolution?.email === normalized ? resolution.value : undefined
  useEffect(() => {
    if (!visible) return
    const duration =
      Math.min(
        Date.parse(visible.expiresAt),
        Date.parse(flow.bootstrap.expiresAt),
        Date.parse(flow.catalog.projection.expiresAt),
      ) - Date.now()
    const expire = () => {
      journeyRef.current?.stop()
      journeyRef.current = undefined
      setResolution(undefined)
      setExpired(true)
    }
    if (duration <= 0) {
      expire()
      return
    }
    const timer = window.setTimeout(expire, duration)
    return () => window.clearTimeout(timer)
  }, [visible, flow])
  useEffect(() => {
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) setGeneration((v) => v + 1)
    }
    window.addEventListener('pageshow', restored)
    return () => window.removeEventListener('pageshow', restored)
  }, [])
  async function start(provider: NonNullable<typeof visible>['federationProviders'][number]) {
    if (!visible || pending || disabled || expired) return
    try {
      if (!journeyRef.current?.hasUnresolvedCommand) {
        journeyRef.current?.stop()
        journeyRef.current = new FederationJourney(
          flow.bootstrap.flowId,
          flow.catalog.projection.clientId,
          identityFederationClient(flow, provider.providerRegionId),
          flow.bootstrap.expiresAt,
        )
      }
    } catch {
      setFailed(true)
      return
    }
    const journey = journeyRef.current
    setPending(true)
    setFailed(false)
    const scrub = () => journey.stop()
    window.addEventListener('pagehide', scrub)
    try {
      live(flow.bootstrap.expiresAt)
      live(flow.catalog.projection.expiresAt)
      const uri = await journey.start(visible, provider)
      live(flow.bootstrap.expiresAt)
      live(flow.catalog.projection.expiresAt)
      await navigate(uri)
      journey.stop()
      journeyRef.current = undefined
    } catch {
      setFailed(true)
    } finally {
      window.removeEventListener('pagehide', scrub)
      setPending(false)
    }
  }
  return (
    <Stack gap={2}>
      {visible?.federationProviders.map((provider) => (
        <Button
          key={`${provider.targetTenantId}/${provider.providerId}`}
          label={t('security.journey.provider', { provider: provider.providerDisplayName })}
          variant="outline"
          tone="neutral"
          disabled={disabled || pending || expired}
          loading={pending}
          onClick={() => {
            void start(provider)
          }}
        />
      ))}
      {failed && <Text tone="secondary">{t('security.journey.unavailable')}</Text>}
      {expired && <Text>{t('security.journey.expired')}</Text>}
    </Stack>
  )
}
