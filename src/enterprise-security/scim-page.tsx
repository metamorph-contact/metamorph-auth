import { useParams } from '@tanstack/react-router'
import {
  AuthPage,
  Button,
  FormField,
  Input,
  Stack,
  Text,
} from '@polymorph/ui/identity'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  loadIdentityCatalog,
  type LoadedIdentityCatalog,
} from '../catalog/runtime'
import { identityApiForRegion } from '../catalog/boundaries'
import { setLocale } from '../i18n'
import { installPresentationTheme } from '../presentation/theme'
import { randomUuid7 } from '../protocol/client'
import { validEmail } from '../presentation/validation'
import { Presentation } from '../router'
import { ScimIdentityClient, ScimIdentityError } from './scim-client'
import {
  consumeScimFragment,
  type ScimActivationFragment,
} from './scim-fragment'
import type { IdentityScimCompleteRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityScimCompleteRequestV1'

export function ScimActivationPage() {
  const params = useParams({ strict: false }) as {
    locale: string
    authProjectionId: string
    catalogVersion: string
  }
  const [concealed, setConcealed] = useState(false)
  useEffect(() => {
    const hide = () => flushSync(() => setConcealed(true))
    window.addEventListener('pagehide', hide)
    return () => window.removeEventListener('pagehide', hide)
  }, [])
  return concealed ? (
    <Unavailable />
  ) : (
    <Entry
      key={`${params.locale}:${params.authProjectionId}:${params.catalogVersion}`}
      params={params}
    />
  )
}
function Unavailable() {
  const { t } = useTranslation()
  return (
    <AuthPage
      title={t('scim.unavailable.title')}
      description={t('scim.unavailable.description')}
      transitionKey="scim-unavailable"
      pending={false}
    >
      {null}
    </AuthPage>
  )
}
function Entry({
  params,
}: {
  params: { locale: string; authProjectionId: string; catalogVersion: string }
}) {
  const captured = useRef<ScimActivationFragment | null | undefined>(undefined)
  const [ready, setReady] = useState<{
    fragment: ScimActivationFragment
    catalog: LoadedIdentityCatalog
  }>()
  const [failed, setFailed] = useState(false)
  const [submitted, setSubmitted] = useState<LoadedIdentityCatalog>()
  const { t } = useTranslation()
  useEffect(() => {
    let live = true
    if (captured.current === undefined) {
      try {
        captured.current = consumeScimFragment()
      } catch {
        captured.current = null
      }
    }
    const fragment = captured.current
    if (!fragment || Date.parse(fragment.entry.expiresAt) <= Date.now()) {
      setFailed(true)
      return
    }
    void (async () => {
      try {
        await setLocale(params.locale)
        const catalog = await loadIdentityCatalog({
          ...params,
          catalogDigest: fragment.catalogDigest,
        })
        identityApiForRegion(catalog, fragment.entry.sourceRegionId)
        if (live) {
          installPresentationTheme(catalog.presentation.themePairingId)
          setReady({ fragment, catalog })
        }
      } catch {
        if (live) setFailed(true)
      }
    })()
    return () => {
      live = false
    }
  }, [params.locale, params.authProjectionId, params.catalogVersion])
  if (submitted)
    return (
      <Presentation
        catalog={submitted}
        title={t('scim.pending.title')}
        description={t('scim.pending.description')}
        transitionKey="scim-pending"
        pending={false}
        leaving={false}
      >
        <div role="status">
          <Text>{t('scim.pending.access')}</Text>
        </div>
      </Presentation>
    )
  if (failed) return <Unavailable />
  if (!ready)
    return (
      <AuthPage title={t('scim.loading')} transitionKey="scim-loading" pending>
        {null}
      </AuthPage>
    )
  return (
    <ActivationFlow
      catalog={ready.catalog}
      fragment={ready.fragment}
      onSubmitted={() => {
        captured.current = null
        setSubmitted(ready.catalog)
        setReady(undefined)
      }}
      onInvalid={() => {
        captured.current = null
        setReady(undefined)
        setFailed(true)
      }}
    />
  )
}
export function ActivationFlow({
  catalog,
  fragment,
  onSubmitted,
  onInvalid,
}: {
  catalog: LoadedIdentityCatalog
  fragment: ScimActivationFragment
  onSubmitted: () => void
  onInvalid: () => void
}) {
  const { t } = useTranslation()
  const client = useMemo(
    () =>
      new ScimIdentityClient(
        identityApiForRegion(catalog, fragment.entry.sourceRegionId),
      ),
    [catalog, fragment],
  )
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<
    'email' | 'checkEmail' | 'verified' | 'pending'
  >(fragment.challenge ? 'checkEmail' : 'email')
  const [completion, setCompletion] = useState<IdentityScimCompleteRequestV1>()
  const [error, setError] = useState<'temporary' | 'terminal'>()
  const [pending, setPending] = useState(false)
  const [retryAt, setRetryAt] = useState(0)
  const [clock, setClock] = useState(() => Date.now())
  useEffect(() => {
    if (!retryAt) return
    const timer = setInterval(() => setClock(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [retryAt])
  const retry = useRef<((signal: AbortSignal) => Promise<void>) | undefined>(
    undefined,
  )
  const active = useRef<AbortController | undefined>(undefined)
  const initialVerify = useRef<
    ((signal: AbortSignal) => Promise<void>) | undefined
  >(undefined)
  function verifyAttempt() {
    const challenge = fragment.challenge!
    const mutation = randomUuid7()
    const request = {
      ...challenge,
      ceremony: fragment.entry.ceremony,
      startCapability: fragment.entry.startCapability,
    }
    return async (signal: AbortSignal) => {
      const result = await client.call(
        'identity.scim.primary_email.verify',
        request,
        mutation,
        signal,
      )
      const activation = result.completion.activation
      if (
        activation.activationId !== fragment.entry.activationId ||
        activation.provisionerId !== fragment.entry.provisionerId ||
        activation.scimUserId !== fragment.entry.scimUserId
      )
        throw new ScimIdentityError(false)
      setCompletion(result.completion)
      setStep('verified')
    }
  }
  async function execute(send: (signal: AbortSignal) => Promise<void>) {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    retry.current = send
    setPending(true)
    setError(undefined)
    try {
      await send(controller.signal)
      controller.signal.throwIfAborted()
      retry.current = undefined
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (failure instanceof ScimIdentityError && failure.retryable) {
          setError('temporary')
          setRetryAt(Date.now() + failure.retryAfterSeconds * 1000)
          setClock(Date.now())
        } else {
          retry.current = undefined
          onInvalid()
        }
      }
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }
  useEffect(() => {
    if (fragment.challenge) {
      initialVerify.current ??= verifyAttempt()
      void execute(initialVerify.current)
    }
    return () => active.current?.abort()
    // The flow is remounted for every catalog/entry boundary; retry preserves this exact request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Presentation
      catalog={catalog}
      title={t(`scim.${step}.title`)}
      description={t(`scim.${step}.description`)}
      transitionKey={`scim-${step}`}
      pending={pending}
      leaving={false}
    >
      <Stack gap={4}>
        {error && (
          <div role="alert">
            <Text>{t(`scim.error.${error}`)}</Text>
          </div>
        )}
        {error === 'temporary' && retry.current && (
          <Button
            label={t('scim.retry')}
            disabled={clock < retryAt}
            onClick={() => void execute(retry.current!)}
          />
        )}
        {step === 'email' && !error && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!validEmail(email) || pending) return
              const mutation = randomUuid7(),
                request = {
                  ceremony: fragment.entry.ceremony,
                  submittedEmail: email,
                  startCapability: fragment.entry.startCapability,
                }
              void execute(async (signal) => {
                await client.call(
                  'identity.scim.primary_email.start',
                  request,
                  mutation,
                  signal,
                )
                setEmail('')
                setStep('checkEmail')
              })
            }}
          >
            <Stack gap={4}>
              <FormField label={t('scim.email.label')}>
                <Input
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  maxLength={320}
                />
              </FormField>
              <Button
                type="submit"
                label={t('scim.email.submit')}
                disabled={!validEmail(email)}
              />
            </Stack>
          </form>
        )}
        {step === 'verified' && completion && !error && (
          <Button
            label={t('scim.complete')}
            onClick={() => {
              const mutation = randomUuid7(),
                request = structuredClone(completion)
              void execute(async (signal) => {
                await client.call(
                  'identity.scim.activation.complete',
                  request,
                  mutation,
                  signal,
                )
                setCompletion(undefined)
                initialVerify.current = undefined
                setStep('pending')
                retry.current = undefined
                onSubmitted()
              })
            }}
          />
        )}
        {step === 'pending' && (
          <div role="status">
            <Text>{t('scim.pending.access')}</Text>
          </div>
        )}
      </Stack>
    </Presentation>
  )
}
