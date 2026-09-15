import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  notFound,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import {
  AuthPage,
  Avatar,
  Button,
  FormField,
  Icon,
  Input,
  PasswordInput,
  Stack,
  Text,
  toast,
} from '@polymorph/ui/identity'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  getOrCreateBrowserHead,
  BrowserLogoutPendingError,
  readBrowserHead,
  readBrowserIdentityRecord,
  type BrowserHeadState,
  type LogoutPendingState,
} from './browser/head-store'
import { CatalogUnavailableError, loadIdentityCatalog, type LoadedIdentityCatalog } from './catalog/runtime'
import { catalogProductReturnUri, identityApiForRegion } from './catalog/boundaries'
import { selectInitialController } from './contracts/controller-placement'
import type { AccountEstablishmentResultV1 } from './contracts/generated/csi07/AccountEstablishmentResultV1'
import type { SignupContinuationResultV1 } from './contracts/generated/csi07/SignupContinuationResultV1'
import type { SignupProfileV1 } from './contracts/generated/csi11/SignupProfileV1'
import type { SignupProgressV1 } from './contracts/generated/csi11/SignupProgressV1'
import type { BrowserLogoutResultV1 } from './contracts/generated/csi10/BrowserLogoutResultV1'
import { isSupportedLocale, setLocale } from './i18n'
import { afterPageFade, navigateAfterFade } from './navigation/step-transition'
import { installPresentationTheme } from './presentation/theme'
import {
  chooseAccount,
  completeRecovery,
  confirmSignupEmail,
  continueAccountEstablishment,
  continueSignup,
  createIdentityFlow,
  finalizeDestination,
  loadAccounts,
  previewEmailLink,
  randomUuid7,
  recoverCredentialAttempt,
  refreshSignup,
  requestPasswordRecovery,
  resendSignup,
  resolveRecovery,
  signIn,
  startSignup,
  updateSignup,
  uploadSignupPicture,
  type DisplayAccountsResult,
  type IdentityFlow,
  type PasswordRecoveryStartAttempt,
  type SignupStartAttempt,
  type StartedSignup,
} from './protocol/client'
import { ProtocolError } from './protocol/http'
import { BrowserLogoutClient, type LogoutDisplayOptions } from './protocol/logout'
import {
  consumeAuthFragmentOnce,
  hasUnconsumedAuthFragment,
  type EmailVerificationFragment,
  type InitialEntryFragment,
  type PasswordRecoveryFragment,
} from './security/fragment'
import {
  assertSessionStorageAvailable,
  clearStartRecovery,
  readAccountLogoutPending,
  readDestinationContinuation,
  readStartRecovery,
  saveStartRecovery,
  saveDestinationContinuation,
  type StartRecovery,
} from './security/session-receipts'
import { armBfcacheRecovery } from './security/bfcache'
import {
  boundedPasswordInput,
  exceedsUtf8Limit,
  PASSWORD_WIRE_MAX_BYTES,
  validBoundedText,
  validEmail,
  validPasswordInput,
} from './presentation/validation'

type RouteParams = { locale: string; authProjectionId: string; catalogVersion: string }

const signupControls = () => import('@polymorph/ui/identity-signup')
const ColorInput = lazy(async () => ({ default: (await signupControls()).ColorInput }))
const ImageEditor = lazy(async () => ({ default: (await signupControls()).ImageEditor }))
const Select = lazy(async () => ({ default: (await signupControls()).Select }))

function protocolMessage(error: unknown): string {
  if (!(error instanceof ProtocolError)) return 'errors.unknown'
  if (error.code === 'auth.credentials.invalid') return 'errors.auth_invalid_credentials'
  if (error.code === 'auth.credentials.rate_limited' || error.code === 'auth.flow.limit') return 'errors.auth_rate_limited'
  if (error.code === 'auth.product_session.account_limit') return 'errors.account_limit'
  if (error.code === 'auth.password.policy') return 'errors.password_policy'
  if (error.code === 'auth.signup.handle.unavailable') return 'errors.handle_unavailable'
  if (error.code === 'auth.signup.organization_name.invalid') return 'errors.organization_invalid'
  if (error.code === 'auth.signup.domain.conflict') return 'errors.organization_domain_conflict'
  if (error.code === 'auth.dependency.unavailable' || error.code === 'auth_unavailable') return 'errors.auth_unavailable'
  if (error.code === 'auth_invalid_response' || error.code === 'auth_outcome_uncertain') return 'errors.auth_unavailable'
  if (error.code === 'auth.account_session.invalid' || error.code === 'auth.product_session.invalid') return 'errors.session_expired'
  if (error.code === 'auth.flow.expired' || error.code === 'auth.request.invalid') return 'errors.invalid_request'
  return 'errors.unknown'
}

type FailureKind = 'temporary' | 'terminal'

function failureKind(error: unknown): FailureKind {
  return (error instanceof ProtocolError && error.retryable) || error instanceof CatalogUnavailableError
    ? 'temporary'
    : 'terminal'
}

type IdentityField = 'email' | 'password' | 'organization' | 'firstName' | 'lastName' | 'handle'
type FieldErrors = Partial<Record<IdentityField, string>>

function protocolField(error: unknown): IdentityField | undefined {
  if (!(error instanceof ProtocolError)) return undefined
  if (error.code === 'auth.password.policy') return 'password'
  if (error.code === 'auth.credentials.invalid') return 'password'
  if (error.code === 'auth.signup.handle.unavailable') return 'handle'
  if (error.code === 'auth.signup.organization_name.invalid') return 'organization'
  const field = error.details !== undefined && 'field' in error.details ? error.details.field : undefined
  if (field === 'email' || field === 'password' || field === 'handle') return field
  if (field === 'displayName') return 'organization'
  if (field === 'firstName' || field === 'lastName') return field
  return undefined
}

function focusField(field: IdentityField): void {
  requestAnimationFrame(() => document.getElementById(`identity-${field}`)?.focus())
}

function useBlobUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (blob === undefined) { setUrl(undefined); return }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}

function usePagehideScrub(scrub: () => void): void {
  const current = useRef(scrub)
  current.current = scrub
  useEffect(() => {
    const handler = () => current.current()
    window.addEventListener('pagehide', handler)
    return () => window.removeEventListener('pagehide', handler)
  }, [])
}

function BackAction({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button className="identity-back" type="button" aria-label={label} onClick={onClick} disabled={disabled}>
      <Icon name="back" size="sm" />
    </button>
  )
}

function FormStack({ children, onSubmit }: { children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form onSubmit={onSubmit}><Stack gap={4}>{children}</Stack></form>
}

function Presentation({ catalog, children, title, description, transitionKey, pending, leaving, back }: {
  catalog: LoadedIdentityCatalog
  children: ReactNode
  title: string
  description?: ReactNode
  transitionKey: string
  pending: boolean
  leaving: boolean
  back?: () => void
}) {
  const { t } = useTranslation()
  const shell = useRef<HTMLDivElement>(null)
  const previousTransition = useRef<string | undefined>(undefined)
  const presentation = catalog.presentation
  const logo = presentation.logoAssets.kind === 'modeSafe'
    ? <img src={catalog.assetUrl(presentation.logoAssets.assetId)} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" />
    : (
      <picture>
        <source media="(prefers-color-scheme: dark)" srcSet={catalog.assetUrl(presentation.logoAssets.darkAssetId)} />
        <img src={catalog.assetUrl(presentation.logoAssets.lightAssetId)} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </picture>
  )
  const productName = t(presentation.productNameMessageKey)
  useEffect(() => {
    document.title = `${title} · ${productName}`
  }, [productName, title])
  useEffect(() => {
    if (previousTransition.current === transitionKey) return
    previousTransition.current = transitionKey
    requestAnimationFrame(() => {
      const heading = shell.current?.querySelector('h1')
      if (heading instanceof HTMLElement) {
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      }
    })
  }, [transitionKey])
  const brand = <div className="identity-brand">{logo}<span>{productName}</span></div>
  const illustration = presentation.artworkAssetId === null ? undefined : (
    <img className="identity-artwork" src={catalog.assetUrl(presentation.artworkAssetId)} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" />
  )
  return (
    <div ref={shell} className="identity-shell" data-leaving={leaving} data-busy={pending || leaving}>
      <AuthPage
        layout={presentation.layout === 'splitArtwork' ? 'illustrated' : 'centered'}
        brand={brand}
        illustration={illustration}
        title={title}
        description={description}
        transitionKey={transitionKey}
        pending={pending || leaving}
        backAction={back === undefined ? undefined : <BackAction label={t('actions.back')} onClick={back} disabled={pending || leaving} />}
      >
        <fieldset className="identity-controls" disabled={pending || leaving}>{children}</fieldset>
      </AuthPage>
    </div>
  )
}

function GenericPage({ titleKey = 'auth.finalizing.title', descriptionKey = 'auth.finalizing.description', pending = true, leaving = false, children }: {
  titleKey?: string
  descriptionKey?: string
  pending?: boolean
  leaving?: boolean
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const title = t(titleKey)
  const description = t(descriptionKey)
  useEffect(() => {
    document.title = title
    if (pending) return
    requestAnimationFrame(() => {
      const heading = document.querySelector('main h1')
      if (heading instanceof HTMLElement) {
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      }
    })
  }, [pending, title])
  return <div className="identity-shell" data-leaving={leaving}><AuthPage title={title} description={description} transitionKey={titleKey} pending={pending || leaving}>
    <span role="status" aria-live={pending ? 'polite' : 'assertive'} className="identity-status">
      {pending ? t('auth.loading') : `${title}. ${description}`}
    </span>
    {children}
  </AuthPage></div>
}

interface ReadyContext {
  catalog: LoadedIdentityCatalog
  head: BrowserHeadState
  flow: IdentityFlow
}

interface SignupProgressStep {
  readonly kind: 'signupProgress'
  readonly home: IdentityFlow['controller']
  readonly continuation: SignupContinuationResultV1
  readonly progress: SignupProgressV1
}

type AuthorizeStep =
  | { kind: 'credentials' }
  | { kind: 'signupEmail' }
  | { kind: 'signupRegion'; email: string }
  | { kind: 'accounts'; result: DisplayAccountsResult }
  | { kind: 'confirmLogoutAll'; result: DisplayAccountsResult }
  | { kind: 'logoutProgress'; result: BrowserLogoutResultV1 }
  | { kind: 'recovery' }
  | { kind: 'recoverySent' }
  | { kind: 'signupCheckEmail'; started: StartedSignup }
  | SignupProgressStep
  | { kind: 'pictureUploadFailed'; signup: SignupProgressStep; establishment: AccountEstablishmentResultV1 }
  | { kind: 'error' }

function accountStep(result: DisplayAccountsResult): AuthorizeStep {
  return result.accounts.length === 0 && result.unavailableCount === 0
    ? { kind: 'credentials' }
    : { kind: 'accounts', result }
}

function isSignupProgress(result: Awaited<ReturnType<typeof updateSignup>>): result is SignupProgressV1 {
  return ['verificationPending', 'continue', 'handoff', 'signInRequired'].includes(result.kind)
}

function browserLogoutFinished(result: BrowserLogoutResultV1): boolean {
  return result.state === 'retired' || result.state === 'detached' ||
    (result.scope === 'identityAccount' && result.state === 'acknowledged')
}

function browserLogoutNotCommitted(result: BrowserLogoutResultV1): boolean {
  return result.state === 'notCommittedAccount' || result.state === 'notCommittedBrowserAll'
}

type InitialEntryState =
  | { readonly kind: 'entry'; readonly fragment: InitialEntryFragment }
  | { readonly kind: 'recover'; readonly receipt: StartRecovery }

function initialEntry(): InitialEntryState {
  if (!hasUnconsumedAuthFragment()) {
    const receipt = readStartRecovery()
    if (receipt === null) throw new Error('Missing authentication start')
    return Object.freeze({ kind: 'recover', receipt })
  }
  const value = consumeAuthFragmentOnce((candidate) => {
    if (candidate.kind === 'initial' || candidate.kind === 'relocation') saveStartRecovery(candidate)
  })
  if (value.kind !== 'initial' && value.kind !== 'relocation') throw new Error('Wrong authentication continuation')
  return Object.freeze({ kind: 'entry', fragment: value })
}

async function loadReady(
  params: RouteParams,
  fragment: InitialEntryFragment,
  catalogLoaded?: (catalog: LoadedIdentityCatalog) => void,
): Promise<ReadyContext> {
  if (params.authProjectionId !== fragment.projection || params.catalogVersion !== fragment.catalog) {
    throw new Error('Authentication path and protected input disagree')
  }
  await setLocale(params.locale)
  const catalog = await loadIdentityCatalog({
    locale: params.locale,
    authProjectionId: params.authProjectionId,
    catalogVersion: params.catalogVersion,
    catalogDigest: fragment.digest,
  })
  catalogLoaded?.(catalog)
  armBfcacheRecovery(catalog)
  installPresentationTheme(catalog.presentation.themePairingId)
  assertSessionStorageAvailable()
  const head = await browserHeadForCatalog(catalog)
  const flow = await createIdentityFlow(catalog, head, fragment)
  return { catalog, head, flow }
}

async function browserHeadForCatalog(catalog: LoadedIdentityCatalog): Promise<BrowserHeadState> {
  const head = await getOrCreateBrowserHead(async (browserInitializationId) => ({
    algorithmVersion: 1,
    catalogVersion: catalog.projection.catalogVersion,
    catalogDigest: catalog.projection.realmCatalogDigest,
    controllerRegionId: await selectInitialController(
      browserInitializationId,
      catalog.projection.realmCatalogDigest,
      catalog.projection.regions,
    ),
  }))
  if (!catalog.projection.regions.some((region) => region.regionId === head.placement.controllerRegionId)) {
    throw new Error('Pinned browser controller is not admitted by this catalog')
  }
  return head
}

function AuthorizePage() {
  const params = authorizeRoute.useParams()
  const entryState = useMemo(initialEntry, [])
  const { t } = useTranslation()
  const [ready, setReady] = useState<ReadyContext>()
  const [step, setStep] = useState<AuthorizeStep>({ kind: 'credentials' })
  const [pending, setPending] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [email, setEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [region, setRegion] = useState('')
  const [organization, setOrganization] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [handle, setHandle] = useState('')
  const [picture, setPicture] = useState<Blob>()
  const pictureUploadAttempt = useRef<string | undefined>(undefined)
  const pictureUrl = useBlobUrl(picture)
  const pictureConfirmationRef = useRef<HTMLDivElement>(null)
  const [avatarColor, setAvatarColor] = useState('#7c3aed')
  const [initializationAttempt, setInitializationAttempt] = useState(0)
  const [credentialRetryUntil, setCredentialRetryUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [credentialAttemptUncertain, setCredentialAttemptUncertain] = useState<string>()
  const [signupMutationUncertain, setSignupMutationUncertain] = useState(false)
  const [accountSelectionAttempt, setAccountSelectionAttempt] = useState<{ browserAccountId: string; attemptId: string }>()
  const [recoveryAttemptUncertain, setRecoveryAttemptUncertain] = useState(false)
  const continuationAttemptId = useMemo(randomUuid7, [])
  const resendAttemptId = useRef<string | undefined>(undefined)
  const signupMutationAttempt = useRef<{
    key: string
    id: string
    input: Parameters<typeof updateSignup>[4]
  } | undefined>(undefined)
  const signupStartAttempt = useRef<SignupStartAttempt | undefined>(undefined)
  const recoveryStartAttempt = useRef<PasswordRecoveryStartAttempt | undefined>(undefined)
  const operationPending = useRef(false)

  usePagehideScrub(() => {
    setSignInPassword('')
    setSignupPassword('')
    setPicture(undefined)
    setCredentialAttemptUncertain(undefined)
    signupStartAttempt.current = undefined
    signupMutationAttempt.current = undefined
    recoveryStartAttempt.current = undefined
    setSignupMutationUncertain(false)
    setRecoveryAttemptUncertain(false)
  })

  const move = (next: AuthorizeStep) => afterPageFade(setLeaving, () => setStep(next))
  const clearFieldError = (field: IdentityField) => setFieldErrors((current) => {
    if (current[field] === undefined) return current
    const next = { ...current }
    delete next[field]
    return next
  })
  const fail = (error: unknown) => {
    toast.danger(t(protocolMessage(error)))
    const field = protocolField(error)
    if (field !== undefined) {
      setFieldErrors((current) => ({ ...current, [field]: t(protocolMessage(error)) }))
      focusField(field)
    }
    if (ready !== undefined && error instanceof ProtocolError &&
        (error.recoveryAction === 'restartProductAuth' || error.recoveryAction === 'refreshCatalog')) {
      void navigateAfterFade(ready.catalog, catalogProductReturnUri(ready.catalog, 'authStartRecovery'), setLeaving)
      return
    }
    if (error instanceof ProtocolError && ['enterCredentials', 'reauthenticate', 'signInFresh'].includes(error.recoveryAction ?? '')) {
      setSignInPassword('')
      setSignupPassword('')
      void move({ kind: 'credentials' })
      return
    }
    const recoverableInput = error instanceof ProtocolError && [
      'auth.credentials.invalid', 'auth.credentials.rate_limited', 'auth.password.policy',
      'auth.signup.handle.unavailable', 'auth.signup.organization_name.invalid',
    ].includes(error.code)
    if (!(error instanceof ProtocolError) || (!error.retryable && !recoverableInput)) void move({ kind: 'error' })
  }

  useEffect(() => {
    const preload = window.setTimeout(() => { void signupControls() }, 1_000)
    return () => window.clearTimeout(preload)
  }, [])
  useEffect(() => {
    const resendDeadline = step.kind === 'signupCheckEmail'
      ? Date.parse(step.started.progress.resendAvailableAt)
      : 0
    const deadline = Math.max(
      credentialRetryUntil,
      Number.isFinite(resendDeadline) ? resendDeadline : 0,
    )
    const remaining = deadline - Date.now()
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(1_000, remaining))
    return () => window.clearTimeout(timer)
  }, [credentialRetryUntil, now, step])

  useEffect(() => {
    let live = true
    void (async () => {
      let startupCatalog: LoadedIdentityCatalog | undefined
      try {
        if (entryState.kind === 'recover') {
          if (entryState.receipt.projection !== params.authProjectionId || entryState.receipt.catalog !== params.catalogVersion) {
            clearStartRecovery(entryState.receipt.recovery)
            throw new Error('Authentication recovery path mismatch')
          }
          await setLocale(params.locale)
          const catalog = await loadIdentityCatalog({
            locale: params.locale,
            authProjectionId: params.authProjectionId,
            catalogVersion: params.catalogVersion,
            catalogDigest: entryState.receipt.digest,
          })
          startupCatalog = catalog
          armBfcacheRecovery(catalog)
          installPresentationTheme(catalog.presentation.themePairingId)
          await navigateAfterFade(catalog, catalogProductReturnUri(catalog, 'authStartRecovery'), setLeaving)
          return
        }
        const loaded = await loadReady(params, entryState.fragment, (catalog) => { startupCatalog = catalog })
        if (!live) return
        setReady(loaded)
        const accountLogout = readAccountLogoutPending()
        if (accountLogout !== null) {
          const result = await new BrowserLogoutClient(loaded.catalog, loaded.head).resumeAccountLogout(accountLogout)
          if (!browserLogoutFinished(result)) {
            if (live) setStep({ kind: 'logoutProgress', result })
            return
          }
        }
        switch (loaded.flow.bootstrap.nextStep) {
          case 'relocateDestination': {
            if (loaded.flow.bootstrap.relocation === null) throw new Error('Missing relocation recovery')
            await navigateAfterFade(loaded.catalog, loaded.flow.bootstrap.relocation.navigationUri, setLeaving)
            return
          }
          case 'continueSignup': {
            const signup = await continueSignup(loaded.flow, continuationAttemptId)
            if (live) setStep({ kind: 'signupProgress', ...signup })
            return
          }
          case 'chooseAccount': {
            const accounts = await loadAccounts(loaded.flow)
            if (live) setStep(accountStep(accounts))
            return
          }
          case 'recoverCredentialAttempt': {
            const recovered = await recoverCredentialAttempt(loaded.flow)
            if (recovered.navigationUri !== null) {
              await navigateAfterFade(loaded.catalog, recovered.navigationUri, setLeaving)
              return
            }
            if (live) setStep({ kind: 'credentials' })
            return
          }
          case 'chooseRegion':
            if (live) setStep({ kind: 'signupEmail' })
            return
          case 'enterEmail':
            if (live) setStep(loaded.flow.bootstrap.intent === 'signUp' ? { kind: 'signupEmail' } : { kind: 'credentials' })
            return
        }
      } catch (error) {
        if (error instanceof BrowserLogoutPendingError) {
          const path = `/${encodeURIComponent(params.locale)}/auth/${encodeURIComponent(params.authProjectionId)}/${encodeURIComponent(error.pending.source.placement.catalogVersion)}/logout`
          await afterPageFade(setLeaving, () => window.location.replace(path))
        } else if (live && startupCatalog !== undefined && error instanceof ProtocolError &&
            (error.recoveryAction === 'restartProductAuth' || error.recoveryAction === 'refreshCatalog')) {
          toast.danger(t(protocolMessage(error)))
          if (entryState.kind === 'entry') clearStartRecovery(entryState.fragment.recovery)
          await navigateAfterFade(startupCatalog, catalogProductReturnUri(startupCatalog, 'authStartRecovery'), setLeaving)
        } else if (live && startupCatalog !== undefined && entryState.kind === 'entry' &&
            error instanceof ProtocolError && error.retryable) {
          toast.danger(t(protocolMessage(error)))
          clearStartRecovery(entryState.fragment.recovery)
          await navigateAfterFade(startupCatalog, catalogProductReturnUri(startupCatalog, 'authStartRecovery'), setLeaving)
        } else if (live) {
          toast.danger(t(protocolMessage(error)))
          setStep({ kind: 'error' })
        }
      } finally {
        if (live) setPending(false)
      }
    })()
    return () => { live = false }
  }, [initializationAttempt])

  if (ready === undefined) return step.kind === 'error'
    ? <GenericPage titleKey="auth.error.title" descriptionKey="auth.error.description" pending={false} leaving={leaving}>
      <Button label={t('actions.retry')} onClick={() => void afterPageFade(setLeaving, () => {
        setStep({ kind: 'credentials' }); setPending(true); setInitializationAttempt((value) => value + 1)
      })} />
    </GenericPage>
    : <GenericPage />

  const product = t(ready.catalog.presentation.productNameMessageKey)
  const run = async (work: () => Promise<void>) => {
    if (pending || operationPending.current) return
    operationPending.current = true
    setPending(true)
    try { await work() } catch (error) { fail(error) } finally {
      operationPending.current = false
      setPending(false)
    }
  }

  if (step.kind === 'error') {
    return <Presentation {...ready} transitionKey="error" pending={false} leaving={leaving} title={t('auth.error.title')} description={t('auth.error.description')}>
      <Button label={t('actions.retry')} variant="outline" tone="accent" onClick={() => void afterPageFade(setLeaving, () => {
        setReady(undefined)
        setStep({ kind: 'credentials' })
        setPending(true)
        setInitializationAttempt((value) => value + 1)
      })} />
    </Presentation>
  }

  if (step.kind === 'credentials') {
    const applyCredentialResult = (result: AccountEstablishmentResultV1) => {
      if (result.kind === 'credentialRejected') {
        setFieldErrors((current) => ({ ...current, password: t('errors.auth_invalid_credentials') }))
        focusField('password')
        toast.danger(t('errors.auth_invalid_credentials'))
        return
      }
      if (result.kind === 'retryRequired') {
        setCredentialRetryUntil(Date.now() + result.retryAfterSeconds * 1_000)
        toast.danger(t('errors.auth_rate_limited'))
        return
      }
      const recoveryAction = 'recoveryAction' in result ? result.recoveryAction : undefined
      fail(new ProtocolError(
        result.kind === 'superseded' ? 'auth.account_establishment.superseded' : 'auth_unavailable',
        recoveryAction === 'retrySameOperation' || recoveryAction === 'retryCredentials',
        undefined,
        recoveryAction,
      ))
    }
    const submit = (event: FormEvent) => {
      event.preventDefault()
      void run(async () => {
        if (credentialAttemptUncertain !== undefined) {
          const recovered = await recoverCredentialAttempt(ready.flow)
          if (recovered.navigationUri !== null) {
            setCredentialAttemptUncertain(undefined)
            await navigateAfterFade(ready.catalog, recovered.navigationUri, setLeaving)
            return
          }
          if (recovered.result !== null) {
            setCredentialAttemptUncertain(undefined)
            applyCredentialResult(recovered.result)
            return
          }
          setCredentialAttemptUncertain(undefined)
          toast.danger(t('errors.auth_unavailable'))
          return
        }
        const normalizedEmail = email.trim()
        const secret = signInPassword
        setSignInPassword('')
        setFieldErrors({})
        let outcome: Awaited<ReturnType<typeof signIn>>
        try {
          outcome = await signIn(ready.flow, normalizedEmail, secret)
        } catch (error) {
          if (error instanceof ProtocolError && error.retryable) setCredentialAttemptUncertain(normalizedEmail)
          throw error
        }
        if (outcome.navigationUri !== null) {
          await navigateAfterFade(ready.catalog, outcome.navigationUri, setLeaving)
        } else {
          applyCredentialResult(outcome.result)
        }
      })
    }
    return <Presentation catalog={ready.catalog} transitionKey="credentials" pending={pending} leaving={leaving} title={t('auth.email.title', { product })} description={t('auth.email.description')}>
      <FormStack onSubmit={submit}>
        <FormField id="identity-email" label={t('auth.email.label')} required error={fieldErrors.email}><Input disabled={credentialAttemptUncertain !== undefined} type="email" autoComplete="email" maxLength={254} value={email} onChange={(value) => { setEmail(value); clearFieldError('email') }} /></FormField>
        <FormField id="identity-password" label={t('auth.password.label')} required error={fieldErrors.password} labelEnd={<Button disabled={credentialAttemptUncertain !== undefined} label={t('auth.password.forgot')} variant="ghost" tone="accent" size="sm" onClick={() => move({ kind: 'recovery' })} />}>
          <PasswordInput disabled={credentialAttemptUncertain !== undefined} toggleLabel={t('password.show')} autoComplete="current-password" value={signInPassword} onChange={(value) => {
            const bounded = boundedPasswordInput(value)
            if (bounded !== null) { setSignInPassword(bounded); clearFieldError('password') }
          }} />
        </FormField>
        {credentialRetryUntil > now && <Text tone="secondary"><span id="credential-cooldown">{t('auth.retry.wait', { seconds: Math.ceil((credentialRetryUntil - now) / 1_000) })}</span></Text>}
        <Button type="submit" aria-describedby={credentialRetryUntil > now ? 'credential-cooldown' : undefined}
          label={t(credentialAttemptUncertain !== undefined ? 'actions.retry' : 'actions.signIn')} loading={pending} disabled={credentialRetryUntil > now ||
          (credentialAttemptUncertain === undefined && (!validEmail(email.trim()) || !validPasswordInput(signInPassword)))} />
        <Button disabled={credentialAttemptUncertain !== undefined} label={t('actions.signUp')} variant="ghost" tone="accent" onClick={() => {
          setSignInPassword('')
          void move({ kind: 'signupEmail' })
        }} />
      </FormStack>
    </Presentation>
  }

  if (step.kind === 'signupEmail') {
    return <Presentation catalog={ready.catalog} transitionKey="signup-email" pending={pending} leaving={leaving} title={t('auth.signup.emailTitle')} description={t('auth.signup.emailDescription')} back={() => move({ kind: 'credentials' })}>
      <FormStack onSubmit={(event) => { event.preventDefault(); setRegion(ready.flow.bootstrap.initialRegionId); move({ kind: 'signupRegion', email: email.trim() }) }}>
        <FormField id="identity-email" label={t('auth.email.label')} required error={fieldErrors.email}><Input type="email" autoComplete="email" maxLength={254} value={email} onChange={(value) => { setEmail(value); clearFieldError('email') }} /></FormField>
        <Button type="submit" label={t('actions.continue')} disabled={!validEmail(email.trim())} />
      </FormStack>
    </Presentation>
  }

  if (step.kind === 'signupRegion') {
    const options = ready.catalog.projection.regions.map((entry) => ({ value: entry.regionId, label: t(ready.catalog.regionMessageKey(entry.regionId)) }))
    return <Presentation catalog={ready.catalog} transitionKey="signup-region" pending={pending} leaving={leaving} title={t('auth.region.title')} description={t('auth.region.description')} back={() => {
      signupStartAttempt.current = undefined
      void move({ kind: 'signupEmail' })
    }}>
      <FormStack onSubmit={(event) => { event.preventDefault(); void run(async () => {
        if (signupStartAttempt.current?.email !== step.email || signupStartAttempt.current.regionId !== region) {
          signupStartAttempt.current = { email: step.email, regionId: region }
        }
        try {
          const started = await startSignup(ready.flow, signupStartAttempt.current)
          signupStartAttempt.current = undefined
          await move({ kind: 'signupCheckEmail', started })
        } catch (error) {
          if (!(error instanceof ProtocolError) || !error.retryable) signupStartAttempt.current = undefined
          throw error
        }
      }) }}>
        <Suspense fallback={<span role="status"><Text tone="secondary">{t('auth.loading')}</Text></span>}><FormField label={t('auth.region.label')} required><Select options={options} value={region} onChange={(value) => value !== null && setRegion(value)} /></FormField></Suspense>
        <Button type="submit" label={t('actions.signUp')} loading={pending} disabled={region === ''} />
      </FormStack>
    </Presentation>
  }

  if (step.kind === 'signupCheckEmail') {
    const resendSeconds = Math.max(0, Math.ceil((Date.parse(step.started.progress.resendAvailableAt) - now) / 1_000))
    return <Presentation catalog={ready.catalog} transitionKey="signup-check" pending={pending} leaving={leaving} title={t('auth.signup.checkEmail')} description={<bdi dir="auto">{email}</bdi>}>
      <Stack gap={3}>
        {resendSeconds > 0 && <Text tone="secondary">{t('auth.retry.wait', { seconds: resendSeconds })}</Text>}
        <Button label={t('auth.signup.resend')} variant="outline" tone="accent" loading={pending} disabled={resendSeconds > 0} onClick={() => void run(async () => {
          resendAttemptId.current ??= randomUuid7()
          const progress = await resendSignup(step.started, resendAttemptId.current)
          resendAttemptId.current = undefined
          setStep({ kind: 'signupCheckEmail', started: Object.freeze({ ...step.started, progress }) })
          toast.success(t('auth.signup.resent'))
        })} />
        <Button label={t('actions.back')} variant="ghost" tone="neutral" onClick={() => move({ kind: 'credentials' })} />
      </Stack>
    </Presentation>
  }

  if (step.kind === 'recovery') {
    return <Presentation catalog={ready.catalog} transitionKey="recovery" pending={pending} leaving={leaving} title={t('auth.recovery.title')} description={t('auth.recovery.emailDescription')} back={() => move({ kind: 'credentials' })}>
      <FormStack onSubmit={(event) => { event.preventDefault(); void run(async () => {
        const normalizedEmail = email.trim()
        if (recoveryStartAttempt.current?.email !== normalizedEmail) {
          recoveryStartAttempt.current = { email: normalizedEmail }
        }
        try {
          await requestPasswordRecovery(ready.flow, recoveryStartAttempt.current)
          recoveryStartAttempt.current = undefined
          setRecoveryAttemptUncertain(false)
          await move({ kind: 'recoverySent' })
        } catch (error) {
          const uncertain = error instanceof ProtocolError && error.retryable
          if (!uncertain) recoveryStartAttempt.current = undefined
          setRecoveryAttemptUncertain(uncertain)
          throw error
        }
      }) }}>
        <FormField id="identity-email" label={t('auth.email.label')} required error={fieldErrors.email}><Input disabled={recoveryAttemptUncertain} type="email" autoComplete="email" maxLength={254} value={email} onChange={(value) => { setEmail(value); clearFieldError('email') }} /></FormField>
        <Button type="submit" label={t(recoveryAttemptUncertain ? 'actions.retry' : 'auth.recovery.request')} loading={pending} disabled={!recoveryAttemptUncertain && !validEmail(email.trim())} />
      </FormStack>
    </Presentation>
  }

  if (step.kind === 'recoverySent') {
    return <Presentation catalog={ready.catalog} transitionKey="recovery-sent" pending={false} leaving={leaving} title={t('auth.recovery.checkEmail')} description={<bdi dir="auto">{email}</bdi>}>
      <Button label={t('actions.back')} variant="outline" tone="neutral" onClick={() => move({ kind: 'credentials' })} />
    </Presentation>
  }

  if (step.kind === 'accounts') {
    const logout = new BrowserLogoutClient(ready.catalog, ready.head)
    return <Presentation catalog={ready.catalog} transitionKey="accounts" pending={pending} leaving={leaving} title={t('auth.chooseAccount.title')} description={t('auth.chooseAccount.description', { product })}>
      <Stack gap={4}>
        <ul className="identity-account-list" aria-label={t('auth.chooseAccount.listLabel')}>
        {step.result.accounts.map((account) => {
          const accountId = account.reference.browserAccountId
          const accountDescriptionId = `account-email-${accountId}`
          const accountBusy = accountSelectionAttempt?.browserAccountId === accountId
          const selectionLocked = accountSelectionAttempt !== undefined && !accountBusy
          return <li className="identity-account-actions" key={accountId}>
          <div className="identity-account-copy"><span className="identity-account-name"><bdi dir="auto">{account.summary.displayName}</bdi></span><span id={accountDescriptionId} className="identity-account-email"><bdi dir="auto">{account.summary.primaryEmail}</bdi></span><span className="identity-account-tenant"><bdi dir="auto">{account.summary.homeTenantLabel}</bdi></span></div>
          <Button disabled={selectionLocked} variant="outline" tone="accent" label={t(accountBusy ? 'actions.retry' : 'auth.chooseAccount.continue')} aria-describedby={accountDescriptionId} onClick={() => void run(async () => {
            const attempt = accountSelectionAttempt ?? { browserAccountId: accountId, attemptId: randomUuid7() }
            if (attempt.browserAccountId !== accountId) return
            setAccountSelectionAttempt(attempt)
            try {
              const uri = await chooseAccount(ready.flow, account, attempt.attemptId)
              setAccountSelectionAttempt(undefined)
              if (uri !== null) await navigateAfterFade(ready.catalog, uri, setLeaving)
            } catch (error) {
              if (!(error instanceof ProtocolError) || !error.retryable) setAccountSelectionAttempt(undefined)
              throw error
            }
          })} />
          <Button disabled={accountSelectionAttempt !== undefined} variant="ghost" tone="neutral" size="sm" label={t('auth.chooseAccount.signOut')} aria-describedby={accountDescriptionId} onClick={() => void run(async () => {
            const result = await logout.logoutAccount(account.reference.browserAccountId)
            if (!browserLogoutFinished(result)) { await move({ kind: 'logoutProgress', result }); return }
            await move(accountStep(await loadAccounts(ready.flow)))
          })} />
        </li>})}
        </ul>
        {step.result.unavailableCount > 0 && <div className="identity-unavailable-accounts" role="status">
          <Text tone="secondary">{t('auth.chooseAccount.unavailable', { count: step.result.unavailableCount })}</Text>
          <Button label={t('actions.retry')} variant="outline" tone="neutral" onClick={() => void run(async () => move(accountStep(await loadAccounts(ready.flow))))} />
        </div>}
        <Button disabled={accountSelectionAttempt !== undefined} variant="ghost" tone="accent" label={t('actions.useAnother')} onClick={() => move({ kind: 'credentials' })} />
        <Button disabled={accountSelectionAttempt !== undefined} variant="ghost" tone="neutral" label={t('auth.chooseAccount.signOutAll')} onClick={() => move({ kind: 'confirmLogoutAll', result: step.result })} />
      </Stack>
    </Presentation>
  }

  if (step.kind === 'confirmLogoutAll') {
    const logout = new BrowserLogoutClient(ready.catalog, ready.head)
    return <Presentation catalog={ready.catalog} transitionKey="confirm-logout-all" pending={pending} leaving={leaving} title={t('auth.logout.confirmAllTitle')} description={t('auth.logout.confirmAllDescription')} back={() => move({ kind: 'accounts', result: step.result })}>
      <Stack gap={3}>
        <Button label={t('auth.chooseAccount.signOutAll')} tone="danger" loading={pending} onClick={() => void run(async () => {
          const prepared = await logout.prepareLogoutAll()
          const result = prepared.state === 'prepared' ? await logout.commitPrepared(prepared) : prepared
          await move({ kind: 'logoutProgress', result })
        })} />
        <Button label={t('actions.cancel')} variant="ghost" tone="neutral" onClick={() => void run(async () => move(accountStep(await loadAccounts(ready.flow))))} />
      </Stack>
    </Presentation>
  }

  if (step.kind === 'logoutProgress') {
    const logout = new BrowserLogoutClient(ready.catalog, ready.head)
    const all = step.result.scope === 'identityBrowserAll'
    const done = browserLogoutFinished(step.result)
    const detachable = step.result.state === 'partial' ? step.result : null
    if (browserLogoutNotCommitted(step.result)) {
      return <Presentation catalog={ready.catalog} transitionKey="logout-not-committed" pending={pending} leaving={leaving} title={t('auth.logout.notCommittedTitle')} description={t('auth.logout.notCommittedDescription')}>
        <Button label={t('actions.continue')} onClick={() => void run(async () => {
          await move(accountStep(await loadAccounts(ready.flow)))
        })} />
      </Presentation>
    }
    return <Presentation catalog={ready.catalog} transitionKey={`logout-${step.result.state}`} pending={pending} leaving={leaving} title={t(done ? 'auth.logout.completeTitle' : 'auth.logout.progressTitle')} description={t(done ? 'auth.logout.completeDescription' : 'auth.logout.progressDescription')}>
      {!done && <Stack gap={3}>
        <Button label={t(step.result.state === 'prepared' ? 'auth.logout.continue' : 'actions.retry')} loading={pending} onClick={() => void run(async () => {
          const result = step.result.state === 'prepared'
            ? await logout.commitPrepared(step.result)
            : await logout.refresh(step.result)
          await move({ kind: 'logoutProgress', result })
        })} />
        {all && detachable !== null && <Button label={t('auth.logout.detach')} variant="ghost" tone="neutral" onClick={() => void run(async () => {
          await move({ kind: 'logoutProgress', result: await logout.detach(detachable) })
        })} />}
      </Stack>}
      {done && !all && <Button label={t('actions.continue')} onClick={() => void run(async () => {
        await move(accountStep(await loadAccounts(ready.flow)))
      })} />}
      {done && all && <Button label={t('actions.continue')} onClick={() => void run(async () => {
        await navigateAfterFade(ready.catalog, catalogProductReturnUri(ready.catalog, 'authStartRecovery'), setLeaving)
      })} />}
    </Presentation>
  }

  if (step.kind === 'pictureUploadFailed') {
    const continueAfterPicture = async (upload: boolean) => {
      if (upload && picture !== undefined && step.signup.progress.kind === 'continue') {
        pictureUploadAttempt.current ??= randomUuid7()
        await uploadSignupPicture(step.signup.home, step.signup.continuation, step.signup.progress.csrfToken, picture, pictureUploadAttempt.current)
      }
      const uri = await continueAccountEstablishment(ready.flow, step.establishment)
      if (uri !== null) await navigateAfterFade(ready.catalog, uri, setLeaving)
    }
    return <Presentation catalog={ready.catalog} transitionKey="picture-failed" pending={pending} leaving={leaving} title={t('auth.signup.pictureFailed')} description={t('auth.signup.pictureFailedDescription')}>
      <Stack gap={3}>
        <Button label={t('actions.retry')} loading={pending} onClick={() => void run(() => continueAfterPicture(true))} />
        <Button label={t('auth.signup.skipPicture')} variant="ghost" tone="neutral" onClick={() => void run(() => continueAfterPicture(false))} />
      </Stack>
    </Presentation>
  }

  const signup = step
  const progress = signup.progress
  const submitSignup = (input: Parameters<typeof updateSignup>[4]) => void run(async () => {
    const mutationKey = progress.kind === 'continue'
      ? `${signup.continuation.signupId}:${progress.nextStep}` : undefined
    if (mutationKey !== undefined && signupMutationAttempt.current?.key !== mutationKey) {
      const immutableInput = Object.freeze({
        ...input,
        profile: input.profile === undefined ? undefined : Object.freeze({ ...input.profile }),
      })
      signupMutationAttempt.current = { key: mutationKey, id: randomUuid7(), input: immutableInput }
    }
    const attempt = signupMutationAttempt.current
    const submittedInput = attempt !== undefined && attempt.key === mutationKey ? attempt.input : input
    if (submittedInput.password !== undefined && !signupMutationUncertain) setSignupPassword('')
    if (signupMutationUncertain && progress.kind === 'continue' &&
        (progress.nextStep === 'organizationDetails' || progress.nextStep === 'setPassword')) {
      const refreshed = await refreshSignup(signup.home, signup.continuation)
      if (refreshed.kind !== 'continue' || refreshed.nextStep !== progress.nextStep) {
        signupMutationAttempt.current = undefined
        setSignupMutationUncertain(false)
        await move({ ...signup, progress: refreshed })
        return
      }
    }
    let result: Awaited<ReturnType<typeof updateSignup>>
    try {
      result = await updateSignup(ready.flow, signup.home, signup.continuation, progress, submittedInput, attempt?.id)
      if (mutationKey !== undefined) signupMutationAttempt.current = undefined
      setSignupMutationUncertain(false)
    } catch (error) {
      const uncertain = mutationKey !== undefined && error instanceof ProtocolError && error.retryable
      if (!uncertain && mutationKey !== undefined) signupMutationAttempt.current = undefined
      setSignupMutationUncertain(uncertain)
      throw error
    }
    if (result.kind === 'established' || result.kind === 'useExisting') {
      if (picture !== undefined && progress.kind === 'continue') {
        try {
          pictureUploadAttempt.current ??= randomUuid7()
          await uploadSignupPicture(signup.home, signup.continuation, progress.csrfToken, picture, pictureUploadAttempt.current)
        } catch {
          await move({ kind: 'pictureUploadFailed', signup, establishment: result })
          return
        }
      }
      const uri = await continueAccountEstablishment(ready.flow, result)
      if (uri !== null) await navigateAfterFade(ready.catalog, uri, setLeaving)
    } else if (isSignupProgress(result)) {
      await move({ ...signup, progress: result })
    } else if (result.kind === 'retryRequired') {
      toast.danger(t('errors.auth_rate_limited'))
    } else {
      throw new Error(`Signup authentication did not complete: ${result.kind}`)
    }
  })
  if (progress.kind !== 'continue') {
    const uri = progress.kind === 'handoff' || progress.kind === 'signInRequired' ? progress.navigationUri : null
    return <Presentation catalog={ready.catalog} transitionKey={`signup-${progress.kind}`} pending={pending} leaving={leaving} title={progress.kind === 'verificationPending' ? t('auth.signup.checkEmail') : t('auth.finalizing.title')} description={progress.kind === 'verificationPending' ? undefined : t('auth.finalizing.description')}>
      {uri === null ? <Button label={t('actions.retry')} onClick={() => void run(async () => move({ ...signup, progress: await refreshSignup(signup.home, signup.continuation) }))} /> : <Button label={t('actions.continue')} onClick={() => void navigateAfterFade(ready.catalog, uri, setLeaving)} />}
    </Presentation>
  }
  if (progress.nextStep === 'organizationDetails') {
    const organizationTooLong = exceedsUtf8Limit(organization.trim(), 256)
    return <Presentation catalog={ready.catalog} transitionKey="signup-organization" pending={pending} leaving={leaving} title={t('auth.signup.organization')}>
      <FormStack onSubmit={(event) => { event.preventDefault(); submitSignup({ organization: organization.trim() }) }}>
        <FormField id="identity-organization" label={t('auth.signup.organization')} required error={fieldErrors.organization ?? (organizationTooLong ? t('errors.too_long_bytes', { maximum: 256 }) : undefined)}><Input disabled={signupMutationUncertain} value={organization} onChange={(value) => { setOrganization(value); clearFieldError('organization') }} autoComplete="organization" maxLength={256} /></FormField>
        <Button type="submit" label={t(signupMutationUncertain ? 'actions.retry' : 'actions.continue')} loading={pending} disabled={!signupMutationUncertain && !validBoundedText(organization.trim(), 256)} />
      </FormStack>
    </Presentation>
  }
  if (progress.nextStep === 'setPassword') {
    return <Presentation catalog={ready.catalog} transitionKey="signup-password" pending={pending} leaving={leaving} title={t('auth.signup.password')}>
      <FormStack onSubmit={(event) => { event.preventDefault(); submitSignup({ password: signupPassword }) }}>
        <FormField id="identity-password" label={t('auth.signup.password')} required error={fieldErrors.password ?? (exceedsUtf8Limit(signupPassword, PASSWORD_WIRE_MAX_BYTES) ? t('errors.too_long_bytes', { maximum: PASSWORD_WIRE_MAX_BYTES }) : undefined)}><PasswordInput disabled={signupMutationUncertain} toggleLabel={t('password.show')} autoComplete="new-password" value={signupPassword} onChange={(value) => {
          const bounded = boundedPasswordInput(value)
          if (bounded !== null) { setSignupPassword(bounded); clearFieldError('password') }
        }} /></FormField>
        <Button type="submit" label={t(signupMutationUncertain ? 'actions.retry' : 'actions.continue')} loading={pending} disabled={!signupMutationUncertain && !validPasswordInput(signupPassword)} />
      </FormStack>
    </Presentation>
  }
  if (progress.nextStep === 'completeProfile') {
    const profile: SignupProfileV1 = { firstName: firstName.trim(), lastName: lastName.trim() || null, handle: handle.trim(), avatarColor }
    const firstNameTooLong = exceedsUtf8Limit(firstName.trim(), 128)
    const lastNameTooLong = exceedsUtf8Limit(lastName.trim(), 128)
    const handleTooLong = exceedsUtf8Limit(handle.trim(), 64)
    return <Presentation catalog={ready.catalog} transitionKey="signup-profile" pending={pending} leaving={leaving} title={t('auth.signup.profileTitle')}>
      <FormStack onSubmit={(event) => { event.preventDefault(); submitSignup({ profile }) }}>
        <FormField id="identity-firstName" label={t('auth.signup.firstName')} required error={fieldErrors.firstName ?? (firstNameTooLong ? t('errors.too_long_bytes', { maximum: 128 }) : undefined)}><Input disabled={signupMutationUncertain} value={firstName} onChange={(value) => { setFirstName(value); clearFieldError('firstName') }} autoComplete="given-name" maxLength={128} /></FormField>
        <FormField id="identity-lastName" label={t('auth.signup.lastName')} error={fieldErrors.lastName ?? (lastNameTooLong ? t('errors.too_long_bytes', { maximum: 128 }) : undefined)}><Input disabled={signupMutationUncertain} value={lastName} onChange={(value) => { setLastName(value); clearFieldError('lastName') }} autoComplete="family-name" maxLength={128} /></FormField>
        <FormField id="identity-handle" label={t('auth.signup.handle')} required error={fieldErrors.handle ?? (handleTooLong ? t('errors.too_long_bytes', { maximum: 64 }) : undefined)}><Input disabled={signupMutationUncertain} value={handle} onChange={(value) => { setHandle(value); clearFieldError('handle') }} autoComplete="username" maxLength={64} /></FormField>
        <Suspense fallback={<span role="status"><Text tone="secondary">{t('auth.loading')}</Text></span>}><FormField label={t('auth.signup.avatarColor')}><ColorInput value={avatarColor} onChange={setAvatarColor} pickerLabel={t('auth.signup.avatarColorPicker')} disabled={pending || leaving || signupMutationUncertain} /></FormField>
        {picture === undefined ? <ImageEditor mask="circle" exportType="image/webp" exportSize={512} disabled={pending || leaving || signupMutationUncertain} messages={{
          title: t('imageEditor.title'), hint: t('imageEditor.hint'), browse: t('imageEditor.browse'),
          rotate: t('imageEditor.rotate'), flip: t('imageEditor.flip'), reset: t('imageEditor.reset'),
          zoom: t('imageEditor.zoom'), cancel: t('actions.cancel'), confirm: t('imageEditor.confirm'),
          alt: t('imageEditor.alt'), stage: t('imageEditor.stage'), loadError: t('imageEditor.loadError'),
        }} id="identity-picture-editor" onConfirm={(blob) => {
          pictureUploadAttempt.current = undefined
          setPicture(blob)
          requestAnimationFrame(() => pictureConfirmationRef.current?.focus({ preventScroll: true }))
        }} /> : <div ref={pictureConfirmationRef} className="identity-picture-confirmed" tabIndex={-1} role="group" aria-label={t('auth.signup.pictureSelected')}>
          {pictureUrl !== undefined && <img className="identity-picture-preview" src={pictureUrl} alt={t('imageEditor.alt')} />}
          <Text tone="secondary"><span role="status" aria-live="polite">{t('auth.signup.pictureSelected')}</span></Text>
          <div className="identity-picture-actions">
            <Button disabled={signupMutationUncertain} label={t('auth.signup.changePicture')} variant="outline" tone="neutral" onClick={() => {
              pictureUploadAttempt.current = undefined
              setPicture(undefined)
              requestAnimationFrame(() => document.querySelector<HTMLElement>('#identity-picture-editor button')?.focus({ preventScroll: true }))
            }} />
            <Button disabled={signupMutationUncertain} label={t('auth.signup.removePicture')} variant="ghost" tone="neutral" onClick={() => {
              pictureUploadAttempt.current = undefined
              setPicture(undefined)
              requestAnimationFrame(() => document.querySelector<HTMLElement>('#identity-picture-editor button')?.focus({ preventScroll: true }))
            }} />
          </div>
        </div>}</Suspense>
        <Button type="submit" label={t(signupMutationUncertain ? 'actions.retry' : 'actions.continue')} loading={pending} disabled={!signupMutationUncertain &&
          (!validBoundedText(firstName.trim(), 128) || !validBoundedText(handle.trim(), 64) || !validBoundedText(lastName.trim(), 128, false))} />
      </FormStack>
    </Presentation>
  }
  return <Presentation catalog={ready.catalog} transitionKey="signup-finish" pending={pending} leaving={leaving} title={t('auth.finalizing.title')} description={t('auth.finalizing.description')}>
    <Button label={t(signupMutationUncertain ? 'actions.retry' : 'actions.continue')} loading={pending} onClick={() => {
      if (progress.nextStep === 'finishAuthentication') submitSignup({})
      else void run(async () => move({ ...signup, progress: await refreshSignup(signup.home, signup.continuation) }))
    }} />
  </Presentation>
}

function useCatalogForEmailLink(params: RouteParams, fragment: EmailVerificationFragment | PasswordRecoveryFragment) {
  const [value, setValue] = useState<{ catalog: LoadedIdentityCatalog; head: BrowserHeadState }>()
  const [logout, setLogout] = useState<{
    catalog: LoadedIdentityCatalog
    continuationCatalog: LoadedIdentityCatalog
    pending: LogoutPendingState
    result?: BrowserLogoutResultV1
  }>()
  const [failure, setFailure] = useState<FailureKind>()
  const [attempt, setAttempt] = useState(0)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    let live = true
    void (async () => {
      let loadedCatalog: LoadedIdentityCatalog | undefined
      try {
        if (live) setFailure(undefined)
        if (params.authProjectionId !== fragment.projection || params.catalogVersion !== fragment.catalog) throw new Error('Link mismatch')
        await setLocale(params.locale)
        const catalog = await loadIdentityCatalog({ locale: params.locale, authProjectionId: params.authProjectionId, catalogVersion: params.catalogVersion, catalogDigest: fragment.digest })
        loadedCatalog = catalog
        armBfcacheRecovery(catalog)
        installPresentationTheme(catalog.presentation.themePairingId)
        const head = await browserHeadForCatalog(catalog)
        if (live) setValue({ catalog, head })
      } catch (caught) {
        if (!live) return
        if (caught instanceof BrowserLogoutPendingError && loadedCatalog !== undefined) {
          try {
            const recoveryCatalog = await loadIdentityCatalog({
              locale: params.locale,
              authProjectionId: params.authProjectionId,
              catalogVersion: caught.pending.source.placement.catalogVersion,
              catalogDigest: caught.pending.source.placement.catalogDigest,
            })
            armBfcacheRecovery(recoveryCatalog)
            if (live) setLogout({
              catalog: recoveryCatalog,
              continuationCatalog: loadedCatalog,
              pending: caught.pending,
            })
          } catch (error) { if (live) setFailure(failureKind(error)) }
        } else setFailure(failureKind(caught))
      }
    })()
    return () => { live = false }
  }, [attempt])
  const resumeLogout = async () => {
    if (logout === undefined) return
    const client = new BrowserLogoutClient(logout.catalog, logout.pending.source)
    const result = logout.result === undefined
      ? await BrowserLogoutClient.resumeBrowserLogout(logout.catalog, logout.pending)
      : logout.result.state === 'prepared'
        ? await client.commitPrepared(logout.result)
        : await client.refresh(logout.result)
    if (!browserLogoutFinished(result) && !browserLogoutNotCommitted(result)) { setLogout({ ...logout, result }); return }
    await finishLogoutRecovery()
  }
  const finishLogoutRecovery = async () => {
    if (logout === undefined) return
    const head = await browserHeadForCatalog(logout.continuationCatalog)
    await afterPageFade(setLeaving, () => {
      setValue({ catalog: logout.continuationCatalog, head })
      setLogout(undefined)
    })
  }
  const detachLogout = async () => {
    if (logout?.result?.state !== 'partial' || logout.result.scope !== 'identityBrowserAll') return
    await new BrowserLogoutClient(logout.catalog, logout.pending.source).detach(logout.result)
    await finishLogoutRecovery()
  }
  const retry = () => afterPageFade(setLeaving, () => setAttempt((current) => current + 1))
  return { value, logout, resumeLogout, detachLogout, failure, retry, leaving }
}

function EmailLinkLogoutRecovery({ catalog, resume, detach, canDetach, leaving }: {
  catalog: LoadedIdentityCatalog
  resume: () => Promise<void>
  detach: () => Promise<void>
  canDetach: boolean
  leaving: boolean
}) {
  const { t } = useTranslation()
  const [working, setWorking] = useState(false)
  const operationPending = useRef(false)
  const run = (operation: () => Promise<void>) => {
    if (working || operationPending.current) return
    operationPending.current = true
    setWorking(true)
    void operation().catch(() => toast.danger(t('errors.auth_unavailable'))).finally(() => {
      operationPending.current = false
      setWorking(false)
    })
  }
  return <Presentation catalog={catalog} transitionKey="email-link-logout" pending={working} leaving={leaving} title={t('auth.logout.progressTitle')} description={t('auth.logout.emailLinkDescription')}>
    <Stack gap={3}>
      <Button label={t('auth.logout.continue')} loading={working} onClick={() => run(resume)} />
      {canDetach && <Button label={t('auth.logout.detach')} variant="ghost" tone="neutral" onClick={() => run(detach)} />}
    </Stack>
  </Presentation>
}

function VerifyEmailPage() {
  const params = verifyEmailRoute.useParams()
  const fragment = useMemo(() => {
    const value = consumeAuthFragmentOnce()
    if (value.kind !== 'signupVerification') throw new Error('Wrong email continuation')
    return value
  }, [])
  const { value, logout, resumeLogout, detachLogout, failure, retry, leaving: logoutLeaving } = useCatalogForEmailLink(params, fragment)
  const { t } = useTranslation()
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewEmailLink>>>()
  const [pending, setPending] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [previewFailure, setPreviewFailure] = useState<'temporary' | 'invalid'>()
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const [expired, setExpired] = useState(false)
  const confirmationPending = useRef(false)
  useEffect(() => {
    if (value === undefined) return
    let live = true
    const home = value.catalog.projection.regions.find((region) => region.regionId === fragment.home)
    if (home === undefined) { setPreviewFailure('invalid'); setPending(false); return }
    void previewEmailLink(identityApiForRegion(value.catalog, home.regionId, home.identityOrigin), fragment.token, fragment.homeContext)
      .then((result) => {
        if (result.challengeKind !== 'signupVerification' || result.productNameMessageKey !== value.catalog.presentation.productNameMessageKey) {
          throw new Error('Email preview presentation mismatch')
        }
        if (live) { setPreview(result); setPreviewFailure(undefined); setExpired(false) }
      }).catch((caught) => {
        if (live) setPreviewFailure(caught instanceof ProtocolError && caught.retryable ? 'temporary' : 'invalid')
      }).finally(() => { if (live) setPending(false) })
    return () => { live = false }
  }, [value, previewAttempt])
  useEffect(() => {
    if (preview === undefined) return
    const remaining = Date.parse(preview.expiresAt) - Date.now()
    if (!Number.isFinite(remaining) || remaining <= 0) { setExpired(true); return }
    const timer = window.setTimeout(() => setExpired(true), Math.min(remaining, 2_147_483_647))
    return () => window.clearTimeout(timer)
  }, [preview])
  if (logout !== undefined) return <EmailLinkLogoutRecovery catalog={logout.catalog} resume={resumeLogout} detach={detachLogout}
    canDetach={logout.result?.state === 'partial'} leaving={logoutLeaving} />
  if (failure !== undefined) return <GenericPage
    titleKey={failure === 'temporary' ? 'auth.error.temporaryTitle' : 'auth.error.title'}
    descriptionKey={failure === 'temporary' ? 'auth.error.temporaryDescription' : 'auth.error.description'}
    pending={false}
    leaving={logoutLeaving}
  >{failure === 'temporary' && <Button label={t('actions.retry')} onClick={() => void retry()} />}</GenericPage>
  if (value !== undefined && previewFailure !== undefined && preview === undefined) return <Presentation catalog={value.catalog} transitionKey="verify-email-preview-error" pending={pending} leaving={leaving} title={t(previewFailure === 'temporary' ? 'auth.error.temporaryTitle' : 'auth.error.title')} description={t(previewFailure === 'temporary' ? 'auth.error.temporaryDescription' : 'errors.invalid_request')}>
    {previewFailure === 'temporary' && <Button label={t('actions.retry')} loading={pending} onClick={() => void afterPageFade(setLeaving, () => { setPreviewFailure(undefined); setPending(true); setPreviewAttempt((attempt) => attempt + 1) })} />}
  </Presentation>
  if (value === undefined || preview === undefined) return <GenericPage />
  if (expired) return <Presentation catalog={value.catalog} transitionKey="verify-email-expired" pending={false} leaving={leaving} title={t('auth.linkExpired.title')} description={t('auth.linkExpired.description')}>
    <Button label={t('auth.linkExpired.restart')} onClick={() => void navigateAfterFade(value.catalog, catalogProductReturnUri(value.catalog, 'authStartRecovery'), setLeaving)} />
  </Presentation>
  const confirm = () => void (async () => {
    if (pending || confirmationPending.current) return
    confirmationPending.current = true
    setPending(true)
    try {
      await navigateAfterFade(value.catalog, await confirmSignupEmail(value.catalog, value.head, fragment, preview), setLeaving)
    } catch (caught) {
      toast.danger(t(protocolMessage(caught)))
      setPending(false)
    } finally {
      confirmationPending.current = false
    }
  })()
  return <Presentation catalog={value.catalog} transitionKey="verify-email" pending={pending} leaving={leaving} title={t('auth.signup.verifyTitle')} description={<>{t('auth.signup.verifyDescription')} <bdi dir="auto">{preview.email}</bdi></>}>
    <Button label={t('auth.signup.verify')} loading={pending} onClick={confirm} />
  </Presentation>
}

function RecoverPasswordPage() {
  const params = recoverPasswordRoute.useParams()
  const fragment = useMemo(() => {
    const value = consumeAuthFragmentOnce()
    if (value.kind !== 'passwordRecovery') throw new Error('Wrong recovery continuation')
    return value
  }, [])
  const { value, logout, resumeLogout, detachLogout, failure, retry, leaving: logoutLeaving } = useCatalogForEmailLink(params, fragment)
  const { t } = useTranslation()
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof resolveRecovery>>>()
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string>()
  const [pending, setPending] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [previewFailure, setPreviewFailure] = useState<'temporary' | 'invalid'>()
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const [completionAttemptId, setCompletionAttemptId] = useState<string>()
  const [expired, setExpired] = useState(false)
  const completionPending = useRef(false)
  usePagehideScrub(() => {
    setCompletionAttemptId(undefined)
    setPassword('')
  })
  useEffect(() => {
    if (value === undefined) return
    let live = true
    const home = value.catalog.projection.regions.find((region) => region.regionId === fragment.home)
    if (home === undefined) { setPreviewFailure('invalid'); setPending(false); return }
    void resolveRecovery(identityApiForRegion(value.catalog, home.regionId, home.identityOrigin), { schemaVersion: 1, token: fragment.token, context: fragment.context })
      .then((result) => {
        if (result.challengeKind !== 'passwordRecovery' || result.productNameMessageKey !== value.catalog.presentation.productNameMessageKey) {
          throw new Error('Recovery preview presentation mismatch')
        }
        if (live) { setPreview(result); setPreviewFailure(undefined); setExpired(false) }
      }).catch((caught) => {
        if (live) setPreviewFailure(caught instanceof ProtocolError && caught.retryable ? 'temporary' : 'invalid')
      }).finally(() => { if (live) setPending(false) })
    return () => { live = false }
  }, [value, previewAttempt])
  useEffect(() => {
    if (preview === undefined) return
    const remaining = Date.parse(preview.expiresAt) - Date.now()
    if (!Number.isFinite(remaining) || remaining <= 0) {
      setExpired(true)
      setCompletionAttemptId(undefined)
      setPassword('')
      return
    }
    const timer = window.setTimeout(() => {
      setExpired(true)
      setCompletionAttemptId(undefined)
      setPassword('')
      setPending(false)
    }, Math.min(remaining, 2_147_483_647))
    return () => window.clearTimeout(timer)
  }, [preview])
  if (logout !== undefined) return <EmailLinkLogoutRecovery catalog={logout.catalog} resume={resumeLogout} detach={detachLogout}
    canDetach={logout.result?.state === 'partial'} leaving={logoutLeaving} />
  if (failure !== undefined) return <GenericPage
    titleKey={failure === 'temporary' ? 'auth.error.temporaryTitle' : 'auth.error.title'}
    descriptionKey={failure === 'temporary' ? 'auth.error.temporaryDescription' : 'auth.error.description'}
    pending={false}
    leaving={logoutLeaving}
  >{failure === 'temporary' && <Button label={t('actions.retry')} onClick={() => void retry()} />}</GenericPage>
  if (value !== undefined && previewFailure !== undefined && preview === undefined) return <Presentation catalog={value.catalog} transitionKey="recover-password-preview-error" pending={pending} leaving={leaving} title={t(previewFailure === 'temporary' ? 'auth.error.temporaryTitle' : 'auth.error.title')} description={t(previewFailure === 'temporary' ? 'auth.error.temporaryDescription' : 'errors.invalid_request')}>
    {previewFailure === 'temporary' && <Button label={t('actions.retry')} loading={pending} onClick={() => void afterPageFade(setLeaving, () => { setPreviewFailure(undefined); setPending(true); setPreviewAttempt((attempt) => attempt + 1) })} />}
  </Presentation>
  if (value === undefined || preview === undefined) return <GenericPage />
  if (expired) return <Presentation catalog={value.catalog} transitionKey="recover-password-expired" pending={false} leaving={leaving} title={t('auth.linkExpired.title')} description={t('auth.linkExpired.description')}>
    <Button label={t('auth.linkExpired.restart')} onClick={() => void navigateAfterFade(value.catalog, catalogProductReturnUri(value.catalog, 'authStartRecovery'), setLeaving)} />
  </Presentation>
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pending || completionPending.current || !validPasswordInput(password)) return
    completionPending.current = true
    setPending(true)
    const attemptId = completionAttemptId ?? randomUuid7()
    setCompletionAttemptId(attemptId)
    const submittedPassword = password
    setPassword('')
    const home = value.catalog.projection.regions.find((region) => region.regionId === fragment.home)
    if (home === undefined) {
      completionPending.current = false
      setPending(false)
      toast.danger(t('errors.invalid_request'))
      return
    }
    void completeRecovery(identityApiForRegion(value.catalog, home.regionId, home.identityOrigin), {
      schemaVersion: 1,
      token: fragment.token,
      newPassword: submittedPassword,
      completionAttemptId: attemptId,
      protocol: { context: fragment.context, preview: preview.preview },
    }).then((result) => {
      setCompletionAttemptId(undefined)
      setPassword('')
      return navigateAfterFade(value.catalog, result.navigationUri, setLeaving)
    }).catch((caught) => {
      toast.danger(t(protocolMessage(caught)))
      if (protocolField(caught) === 'password') {
        setPasswordError(t(protocolMessage(caught)))
        focusField('password')
      }
      if (!(caught instanceof ProtocolError) || !caught.retryable) {
        setCompletionAttemptId(undefined)
        setPassword('')
      }
      setPending(false)
    }).finally(() => { completionPending.current = false })
  }
  return <Presentation catalog={value.catalog} transitionKey="recover-password" pending={pending} leaving={leaving} title={t('auth.recovery.title')} description={<><bdi dir="auto">{preview.email}</bdi>{completionAttemptId !== undefined && <><br />{t('auth.recovery.retryDescription')}</>}</>}>
    <FormStack onSubmit={submit}>
      <FormField id="identity-password" label={t('auth.recovery.newPassword')} required error={passwordError ?? (exceedsUtf8Limit(password, PASSWORD_WIRE_MAX_BYTES) ? t('errors.too_long_bytes', { maximum: PASSWORD_WIRE_MAX_BYTES }) : undefined)}><PasswordInput disabled={pending} toggleLabel={t('password.show')} autoComplete="new-password" value={password} onChange={(value) => {
        const bounded = boundedPasswordInput(value)
        if (bounded !== null) { setPassword(bounded); setPasswordError(undefined) }
      }} /></FormField>
      <Button type="submit" label={t(completionAttemptId === undefined ? 'actions.continue' : 'actions.retry')} loading={pending}
        disabled={!validPasswordInput(password)} />
    </FormStack>
  </Presentation>
}

function ContinuePage() {
  const params = continueRoute.useParams()
  const { t } = useTranslation()
  const fragment = useMemo(() => {
    if (!hasUnconsumedAuthFragment()) {
      const recovered = readDestinationContinuation()
      if (recovered === null) throw new Error('Missing destination continuation')
      return recovered
    }
    const value = consumeAuthFragmentOnce()
    if (value.kind !== 'destination') throw new Error('Wrong destination continuation')
    return saveDestinationContinuation(value)
  }, [])
  const [failure, setFailure] = useState<FailureKind>()
  const [catalog, setCatalog] = useState<LoadedIdentityCatalog>()
  const [attempt, setAttempt] = useState(0)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    let live = true
    void (async () => {
      try {
        if (live) setFailure(undefined)
        await setLocale(params.locale)
        const head = await readBrowserHead()
        if (head === null) throw new Error('Missing controller binding')
        const catalog = await loadIdentityCatalog({ locale: params.locale, authProjectionId: params.authProjectionId, catalogVersion: params.catalogVersion, catalogDigest: fragment.digest })
        if (live) setCatalog(catalog)
        armBfcacheRecovery(catalog)
        installPresentationTheme(catalog.presentation.themePairingId)
        const uri = await finalizeDestination(catalog, head, fragment)
        await navigateAfterFade(catalog, uri, setLeaving)
      } catch (error) { if (live) setFailure(failureKind(error)) }
    })()
    return () => { live = false }
  }, [attempt])
  if (failure !== undefined && catalog !== undefined) return <Presentation catalog={catalog} transitionKey="destination-error" pending={false} leaving={leaving} title={t(failure === 'temporary' ? 'auth.error.temporaryTitle' : 'auth.error.title')} description={t(failure === 'temporary' ? 'auth.error.temporaryDescription' : 'auth.error.description')}>
    {failure === 'temporary' && <Button label={t('actions.retry')} onClick={() => void afterPageFade(setLeaving, () => setAttempt((value) => value + 1))} />}
  </Presentation>
  if (failure !== undefined) return <GenericPage
    titleKey={failure === 'temporary' ? 'auth.error.temporaryTitle' : 'auth.error.title'}
    descriptionKey={failure === 'temporary' ? 'auth.error.temporaryDescription' : 'auth.error.description'}
    pending={false}
    leaving={leaving}
  >{failure === 'temporary' && <Button label={t('actions.retry')} onClick={() => void afterPageFade(setLeaving, () => setAttempt((value) => value + 1))} />}</GenericPage>
  return <GenericPage leaving={leaving} />
}

function LogoutPage() {
  const params = logoutRoute.useParams()
  const { t } = useTranslation()
  const [catalog, setCatalog] = useState<LoadedIdentityCatalog>()
  const [head, setHead] = useState<BrowserHeadState>()
  const [accounts, setAccounts] = useState<LogoutDisplayOptions>({ accounts: [], unavailableCount: 0 })
  const [logoutPending, setLogoutPending] = useState<LogoutPendingState>()
  const [result, setResult] = useState<BrowserLogoutResultV1>()
  const [confirmAll, setConfirmAll] = useState(false)
  const [pending, setPending] = useState(true)
  const [failure, setFailure] = useState<FailureKind>()
  const [startupAttempt, setStartupAttempt] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const operationPending = useRef(false)
  useEffect(() => {
    let live = true
    void (async () => {
      try {
        if (live) { setFailure(undefined); setPending(true) }
        await setLocale(params.locale)
        const record = await readBrowserIdentityRecord()
        if (record === null) throw new Error('Missing logout binding')
        const current = record.state === 'active' ? record : record.source
        const loaded = await loadIdentityCatalog({
          locale: params.locale,
          authProjectionId: params.authProjectionId,
          catalogVersion: current.placement.catalogVersion,
          catalogDigest: current.placement.catalogDigest,
        })
        armBfcacheRecovery(loaded)
        installPresentationTheme(loaded.presentation.themePairingId)
        if (live) { setCatalog(loaded); setHead(current) }
        const client = new BrowserLogoutClient(loaded, current)
        const accountLogout = record.state === 'active' ? readAccountLogoutPending() : null
        const recovered = accountLogout === null ? undefined : await client.resumeAccountLogout(accountLogout)
        const options = record.state === 'active' && (recovered === undefined || browserLogoutFinished(recovered))
          ? await client.options()
          : { accounts: [], unavailableCount: 0 }
        if (!live) return
        setAccounts(options)
        if (recovered !== undefined && !browserLogoutFinished(recovered)) setResult(recovered)
        if (record.state === 'logoutPending') setLogoutPending(record)
      } catch (error) { if (live) setFailure(failureKind(error)) } finally { if (live) setPending(false) }
    })()
    return () => { live = false }
  }, [startupAttempt])
  if (failure !== undefined && catalog !== undefined && head !== undefined) return <Presentation catalog={catalog} transitionKey="logout-start-error" pending={false} leaving={leaving} title={t(failure === 'temporary' ? 'auth.error.temporaryTitle' : 'auth.error.title')} description={t(failure === 'temporary' ? 'auth.error.temporaryDescription' : 'auth.error.description')}>
    {failure === 'temporary' && <Button label={t('actions.retry')} onClick={() => void afterPageFade(setLeaving, () => setStartupAttempt((value) => value + 1))} />}
  </Presentation>
  if (failure !== undefined) return <GenericPage
    titleKey={failure === 'temporary' ? 'auth.error.temporaryTitle' : 'auth.error.title'}
    descriptionKey={failure === 'temporary' ? 'auth.error.temporaryDescription' : 'auth.error.description'}
    pending={false}
    leaving={leaving}
  >{failure === 'temporary' && <Button label={t('actions.retry')} onClick={() => void afterPageFade(setLeaving, () => setStartupAttempt((value) => value + 1))} />}</GenericPage>
  if (catalog === undefined || head === undefined) return <GenericPage />
  const client = new BrowserLogoutClient(catalog, head)
  const run = async (work: () => Promise<void>) => {
    if (pending || operationPending.current) return
    operationPending.current = true
    setPending(true)
    try { await work() } catch { toast.danger(t('errors.auth_unavailable')) } finally {
      operationPending.current = false
      setPending(false)
    }
  }
  const moveLogout = (commit: () => void) => afterPageFade(setLeaving, commit)
  if (logoutPending !== undefined && result === undefined) {
    return <Presentation catalog={catalog} transitionKey="logout-recovery" pending={pending} leaving={leaving} title={t('auth.logout.progressTitle')} description={t('auth.logout.progressDescription')}>
      <Button label={t('auth.logout.continue')} loading={pending} onClick={() => void run(async () => {
        const resumed = await BrowserLogoutClient.resumeBrowserLogout(catalog, logoutPending)
        await moveLogout(() => setResult(resumed))
      })} />
    </Presentation>
  }
  if (result !== undefined) {
    const done = browserLogoutFinished(result)
    if (browserLogoutNotCommitted(result)) {
      return <Presentation catalog={catalog} transitionKey="logout-not-committed" pending={pending} leaving={leaving} title={t('auth.logout.notCommittedTitle')} description={t('auth.logout.notCommittedDescription')}>
        <Button label={t('actions.continue')} onClick={() => void run(async () => {
          const options = await client.options()
          await moveLogout(() => { setResult(undefined); setAccounts(options) })
        })} />
      </Presentation>
    }
    return <Presentation catalog={catalog} transitionKey={`logout-${result.state}`} pending={pending} leaving={leaving} title={t(done ? 'auth.logout.completeTitle' : 'auth.logout.progressTitle')} description={t(done ? 'auth.logout.completeDescription' : 'auth.logout.progressDescription')}>
      {!done && <Stack gap={3}>
        <Button label={t(result.state === 'prepared' ? 'auth.logout.continue' : 'actions.retry')} loading={pending} onClick={() => void run(async () => {
          const refreshed = result.state === 'prepared' ? await client.commitPrepared(result) : await client.refresh(result)
          await moveLogout(() => setResult(refreshed))
        })} />
        {result.scope === 'identityBrowserAll' && result.state === 'partial' && <Button label={t('auth.logout.detach')} variant="ghost" tone="neutral" onClick={() => void run(async () => {
          const detached = await client.detach(result)
          await moveLogout(() => setResult(detached))
        })} />}
      </Stack>}
      {done && result.scope === 'identityAccount' && <Button label={t('actions.continue')} onClick={() => void run(async () => {
        const options = await client.options()
        await moveLogout(() => { setResult(undefined); setAccounts(options) })
      })} />}
      {done && result.scope === 'identityBrowserAll' && <Button label={t('actions.continue')} onClick={() => void run(async () => {
        await navigateAfterFade(catalog, catalogProductReturnUri(catalog, 'authStartRecovery'), setLeaving)
      })} />}
    </Presentation>
  }
  if (confirmAll) {
    return <Presentation catalog={catalog} transitionKey="logout-confirm-all" pending={pending} leaving={leaving} title={t('auth.logout.confirmAllTitle')} description={t('auth.logout.confirmAllDescription')} back={() => void moveLogout(() => setConfirmAll(false))}>
      <Stack gap={3}>
        <Button label={t('auth.chooseAccount.signOutAll')} tone="danger" loading={pending} onClick={() => void run(async () => {
          const prepared = await client.prepareLogoutAll()
          const committed = prepared.state === 'prepared' ? await client.commitPrepared(prepared) : prepared
          await moveLogout(() => setResult(committed))
        })} />
        <Button label={t('actions.cancel')} variant="ghost" tone="neutral" onClick={() => void moveLogout(() => setConfirmAll(false))} />
      </Stack>
    </Presentation>
  }
  return <Presentation catalog={catalog} transitionKey="logout" pending={pending} leaving={leaving} title={t('auth.chooseAccount.title')} description={t('auth.chooseAccount.description', { product: t(catalog.presentation.productNameMessageKey) })}>
    <Stack gap={4}>
      <ul className="identity-account-list" aria-label={t('auth.chooseAccount.listLabel')}>
      {accounts.accounts.map((account) => {
        const accountDescriptionId = `logout-account-email-${account.reference.browserAccountId}`
        return <li className="identity-account" key={account.reference.browserAccountId}>
        <Avatar name={account.metadata.displayName} />
        <div className="identity-account-copy"><span className="identity-account-name"><bdi dir="auto">{account.metadata.displayName}</bdi></span><span id={accountDescriptionId} className="identity-account-email"><bdi dir="auto">{account.metadata.primaryEmail}</bdi></span><span className="identity-account-tenant"><bdi dir="auto">{account.metadata.homeTenantLabel}</bdi></span></div>
        <Button label={t('auth.chooseAccount.signOut')} aria-describedby={accountDescriptionId} variant="outline" tone="neutral" onClick={() => void run(async () => {
          const outcome = await client.logoutAccount(account.reference.browserAccountId)
          if (browserLogoutFinished(outcome)) setAccounts(await client.options())
          else await moveLogout(() => setResult(outcome))
        })} />
      </li>})}
      </ul>
      {accounts.accounts.length === 0 && accounts.unavailableCount === 0 && <Text tone="secondary">{t('auth.chooseAccount.none')}</Text>}
      {accounts.unavailableCount > 0 && <div className="identity-unavailable-accounts" role="status">
        <Text tone="secondary">{t('auth.chooseAccount.unavailable', { count: accounts.unavailableCount })}</Text>
        <Button label={t('actions.retry')} variant="outline" tone="neutral" onClick={() => void run(async () => setAccounts(await client.options()))} />
      </div>}
      <Button label={t('auth.chooseAccount.signOutAll')} variant="outline" tone="neutral" loading={pending} onClick={() => void moveLogout(() => setConfirmAll(true))} />
    </Stack>
  </Presentation>
}

function NotFoundPage() {
  return <GenericPage titleKey="auth.error.title" descriptionKey="auth.error.description" pending={false} />
}

const rootRoute = createRootRoute({
  component: () => <div><OutletShim /></div>,
  notFoundComponent: NotFoundPage,
  errorComponent: NotFoundPage,
})
function OutletShim() {
  return <Outlet />
}

const base = '/$locale/auth/$authProjectionId/$catalogVersion'
const authorizeRoute = createRoute({ getParentRoute: () => rootRoute, path: `${base}/authorize`, component: AuthorizePage })
const continueRoute = createRoute({ getParentRoute: () => rootRoute, path: `${base}/authorize/continue`, component: ContinuePage })
const verifyEmailRoute = createRoute({ getParentRoute: () => rootRoute, path: `${base}/verify-email`, component: VerifyEmailPage })
const recoverPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: `${base}/recover-password`, component: RecoverPasswordPage })
const logoutRoute = createRoute({ getParentRoute: () => rootRoute, path: `${base}/logout`, component: LogoutPage })
const conditionalStepUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: `${base}/conditional-step-up/$continuationId`,
  beforeLoad: async ({ params }) => {
    if (!isSupportedLocale(params.locale) || !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(params.continuationId)) throw notFound()
    await setLocale(params.locale)
  },
  component: lazyRouteComponent(() => import('./enterprise-security/conditional-continuation-page'), 'ConditionalContinuationPage'),
})
const enterprisePreviewRoute = import.meta.env.DEV ? createRoute({
  getParentRoute: () => rootRoute,
  path: '/$locale/_preview/enterprise-security/$screenId',
  beforeLoad: async ({ params }) => {
    if (!/^SCR-IDN-(?:00[1-9]|010|01[1-8])$/u.test(params.screenId) || !isSupportedLocale(params.locale)) throw notFound()
    // Preview routes never consume protected authentication or callback input.
    if (window.__MM_AUTH_FRAGMENT_V1__ !== undefined) delete window.__MM_AUTH_FRAGMENT_V1__
    if (window.location.hash !== '') {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
      if (window.location.hash !== '') throw notFound()
    }
    await setLocale(params.locale)
  },
  component: lazyRouteComponent(() => import('./enterprise-security/dev-preview'), 'IdentitySecurityPreviewPage'),
}) : null
const routeTree = rootRoute.addChildren([
  authorizeRoute, continueRoute, verifyEmailRoute, recoverPasswordRoute, logoutRoute, conditionalStepUpRoute,
  ...(enterprisePreviewRoute === null ? [] : [enterprisePreviewRoute]),
])
export const router = createRouter({ routeTree, defaultPreload: 'intent', defaultPreloadStaleTime: 60_000 })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

export function IdentityRouter() {
  return <RouterProvider router={router} />
}
