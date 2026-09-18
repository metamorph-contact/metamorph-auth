import { Button, Stack, Text } from '@polymorph/ui/identity'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IdentityFlow } from '../protocol/client'
import { clearRealmSocialAuthorization } from '../protocol/client'
import type { IdentityMethodResolutionV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import { identityFederationClient } from './federation-client'
import { FederationJourney, live } from './federation-journey'
import { randomUuid7 } from '../protocol/random'
import { FederationHttpError } from './federation-contract'
import type { SocialProviderV1 } from '../contracts/generated/enterprise-security-v1/types/SocialProviderV1'
import i18n from '../i18n'
import en from '../i18n/locales/en/enterprise-security.json'
i18n.addResourceBundle('en', 'enterprise-security', en)

/** Advisory external identity discovery stays scoped to the current flow/email. Password
 * submission continues through its existing current-policy owner. */
export function FederationMethodChoices({ flow, email, disabled, navigate, onCustodyChange }: { flow: IdentityFlow; email: string; disabled: boolean; navigate: (uri: string, signal: AbortSignal, expiresAt: string) => Promise<void>; onCustodyChange?: (held: boolean) => void }) {
  const { t } = useTranslation('enterprise-security')
  const normalized = email.trim().toLowerCase()
  const routeHint = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized) ? normalized : null
  const [resolution, setResolution] = useState<{
    email: string | null
    value: IdentityMethodResolutionV1
  }>()
  const [failed, setFailed] = useState<string>()
  const [pending, setPending] = useState(false)
  const [expired, setExpired] = useState(false)
  const journeyRef = useRef<FederationJourney | undefined>(undefined)
  const busy = useRef(false)
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    journeyRef.current?.stop()
    journeyRef.current = undefined
    setResolution(undefined)
    setFailed(undefined)
    busy.current = false
    onCustodyChange?.(false)
    setPending(false)
    setExpired(false)
    if (disabled) return
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
              routeHint,
            },
            randomUuid7(),
            controller.signal,
          ),
        )
        .then((value) => {
          if (!controller.signal.aborted) {
            live(value.expiresAt)
            setResolution({ email: routeHint, value })
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) setFailed(externalIdentityErrorKey(error))
        })
    }, 300)
    const scrub = () => {
      controller.abort()
      clearRealmSocialAuthorization(flow)
      journeyRef.current?.stop()
      journeyRef.current = undefined
      setResolution(undefined)
      setExpired(true)
      onCustodyChange?.(false)
    }
    window.addEventListener('pagehide', scrub)
    return () => {
      controller.abort()
      clearRealmSocialAuthorization(flow)
      journeyRef.current?.stop()
      journeyRef.current = undefined
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', scrub)
      onCustodyChange?.(false)
    }
  }, [flow, routeHint, generation, onCustodyChange, disabled])
  const visible = resolution?.email === routeHint ? resolution.value : undefined
  useEffect(() => {
    if (!visible) return
    const duration = Math.min(Date.parse(visible.expiresAt), Date.parse(flow.bootstrap.expiresAt), Date.parse(flow.catalog.projection.expiresAt)) - Date.now()
    const expire = () => {
      clearRealmSocialAuthorization(flow)
      journeyRef.current?.stop()
      journeyRef.current = undefined
      setResolution(undefined)
      setExpired(true)
      onCustodyChange?.(false)
    }
    if (duration <= 0) {
      expire()
      return
    }
    const timer = window.setTimeout(expire, duration)
    return () => window.clearTimeout(timer)
  }, [visible, flow, onCustodyChange])
  useEffect(() => {
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) setGeneration((v) => v + 1)
    }
    window.addEventListener('pageshow', restored)
    return () => window.removeEventListener('pageshow', restored)
  }, [])
  async function start(provider: NonNullable<typeof visible>['federationProviders'][number] | SocialProviderV1) {
    if (!visible || busy.current || disabled || expired) return
    busy.current = true
    try {
      if (!journeyRef.current?.hasUnresolvedCommand) {
        journeyRef.current?.stop()
        journeyRef.current = new FederationJourney(flow.bootstrap.flowId, flow.catalog.projection.clientId, identityFederationClient(flow, typeof provider === 'string' ? undefined : provider.providerRegionId), flow.bootstrap.expiresAt)
      }
    } catch (error) {
      busy.current = false
      setFailed(externalIdentityErrorKey(error))
      return
    }
    const journey = journeyRef.current
    setPending(true)
    onCustodyChange?.(true)
    setFailed(undefined)
    const scrub = () => journey.stop()
    window.addEventListener('pagehide', scrub)
    try {
      live(flow.bootstrap.expiresAt)
      live(flow.catalog.projection.expiresAt)
      const uri = await (typeof provider === 'string' ? journey.startSocial(visible, provider) : journey.start(visible, provider))
      live(flow.bootstrap.expiresAt)
      live(flow.catalog.projection.expiresAt)
      if (journey.isStopped || journeyRef.current !== journey) return
      const navigationExpiry = new Date(Math.min(Date.parse(visible.expiresAt), Date.parse(journey.navigationExpiresAt))).toISOString()
      await navigate(uri, journey.signal, navigationExpiry)
      journey.stop()
      journeyRef.current = undefined
    } catch (error) {
      if (!journey.isStopped) setFailed(externalIdentityErrorKey(error))
    } finally {
      window.removeEventListener('pagehide', scrub)
      if (journeyRef.current === journey || journeyRef.current === undefined) {
        busy.current = false
        setPending(false)
        onCustodyChange?.(journey.hasUnresolvedCommand && !journey.isStopped)
      }
    }
  }
  return (
    <Stack gap={2}>
      {visible?.socialProviders.map((provider) => (
        <Button
          key={provider}
          label={t(`security.social.${provider}`)}
          variant="outline"
          tone="neutral"
          disabled={disabled || pending || expired}
          loading={pending}
          onClick={() => {
            void start(provider)
          }}
        />
      ))}
      {visible?.federationProviders.map((provider) => (
        <Button
          key={`${provider.targetTenantId}/${provider.providerId}`}
          label={t('security.journey.provider', {
            provider: provider.providerDisplayName,
          })}
          variant="outline"
          tone="neutral"
          disabled={disabled || pending || expired}
          loading={pending}
          onClick={() => {
            void start(provider)
          }}
        />
      ))}
      {failed && <Text tone="secondary">{t(failed)}</Text>}
      {expired && <Text>{t('security.journey.expired')}</Text>}
    </Stack>
  )
}

export function externalIdentityErrorKey(error: unknown): string {
  if (!(error instanceof FederationHttpError)) return 'security.journey.unavailable'
  switch (error.envelope.error.code) {
    case 'security.method.disabled':
    case 'security.request.forbidden':
      return 'security.social.denied'
    case 'security.ceremony.expired':
      return 'security.journey.expired'
    case 'security.ceremony.mismatch':
    case 'security.request.invalid':
      return 'security.social.invalid'
    case 'security.request.rate_limited':
      return 'security.social.rateLimited'
    default:
      return 'security.journey.unavailable'
  }
}
