import type { BrowserHeadState } from '../browser/head-store'
import type { LoadedIdentityCatalog } from '../catalog/runtime'
import { admittedIdentityApi, catalogNavigationUri, catalogProductReturnUri, controllerApiForRegion, identityApiForRegion } from '../catalog/boundaries'
import type { AccountAuthorizationRequestV1 } from '../contracts/generated/csi07/AccountAuthorizationRequestV1'
import type { AccountAuthorizationResultV1 } from '../contracts/generated/csi07/AccountAuthorizationResultV1'
import type { AccountContinuationRequestV1 } from '../contracts/generated/csi07/AccountContinuationRequestV1'
import type { AccountContinuationResultV1 } from '../contracts/generated/csi07/AccountContinuationResultV1'
import type { AccountEstablishmentResultV1 } from '../contracts/generated/csi07/AccountEstablishmentResultV1'
import type { AccountMetadataRequestV1 } from '../contracts/generated/csi07/AccountMetadataRequestV1'
import type { AccountMetadataResultV1 } from '../contracts/generated/csi07/AccountMetadataResultV1'
import type { AccountReferenceV1 } from '../contracts/generated/csi07/AccountReferenceV1'
import type { AccountSelectionRequestV1 } from '../contracts/generated/csi07/AccountSelectionRequestV1'
import type { AccountSelectionResultV1 } from '../contracts/generated/csi07/AccountSelectionResultV1'
import type { AccountValidationRequestV1 } from '../contracts/generated/csi07/AccountValidationRequestV1'
import type { AccountValidationResultV1 } from '../contracts/generated/csi07/AccountValidationResultV1'
import type { AccountsResultV1 } from '../contracts/generated/csi07/AccountsResultV1'
import type { BrowserAnchorRequestV1 } from '../contracts/generated/csi07/BrowserAnchorRequestV1'
import type { BrowserAnchorResultV1 } from '../contracts/generated/csi07/BrowserAnchorResultV1'
import type { CredentialAttemptRegistrationRequestV1 } from '../contracts/generated/csi07/CredentialAttemptRegistrationRequestV1'
import type { CredentialAttemptRegistrationResultV1 } from '../contracts/generated/csi07/CredentialAttemptRegistrationResultV1'
import type { CredentialAttemptRecoveryResultV1 } from '../contracts/generated/csi07/CredentialAttemptRecoveryResultV1'
import type { CredentialAttemptRequestV1 } from '../contracts/generated/csi07/CredentialAttemptRequestV1'
import type { CredentialAttemptResultV1 } from '../contracts/generated/csi07/CredentialAttemptResultV1'
import type { CredentialCapabilityRequestV1 } from '../contracts/generated/csi07/CredentialCapabilityRequestV1'
import type { CredentialCapabilityResultV1 } from '../contracts/generated/csi07/CredentialCapabilityResultV1'
import type { CredentialRouteContinuationResultV1 } from '../contracts/generated/csi07/CredentialRouteContinuationResultV1'
import type { CredentialRouteRequestV1 } from '../contracts/generated/csi07/CredentialRouteRequestV1'
import type { CredentialRouteResolutionV1 } from '../contracts/generated/csi07/CredentialRouteResolutionV1'
import type { EmptyV1 } from '../contracts/generated/csi07/EmptyV1'
import type { EstablishmentRecoveryRequestV1 } from '../contracts/generated/csi07/EstablishmentRecoveryRequestV1'
import type { FlowBootstrapV1 } from '../contracts/generated/csi07/FlowBootstrapV1'
import type { FlowCreateRequestV1 } from '../contracts/generated/csi07/FlowCreateRequestV1'
import type { HomeAccountSummaryV1 } from '../contracts/generated/csi07/HomeAccountSummaryV1'
import type { RouteContinuationRequestV1 } from '../contracts/generated/csi07/RouteContinuationRequestV1'
import type { SignInRequestV1 } from '../contracts/generated/csi07/SignInRequestV1'
import type { SignupContinuationRequestV1 } from '../contracts/generated/csi07/SignupContinuationRequestV1'
import type { SignupContinuationResultV1 } from '../contracts/generated/csi07/SignupContinuationResultV1'
import type { SignupOperationRegistrationRequestV1 } from '../contracts/generated/csi07/SignupOperationRegistrationRequestV1'
import type { SignupOperationRegistrationResultV1 } from '../contracts/generated/csi07/SignupOperationRegistrationResultV1'
import type { SignupPreparationRequestV1 } from '../contracts/generated/csi07/SignupPreparationRequestV1'
import type { SignupPreparationResultV1 } from '../contracts/generated/csi07/SignupPreparationResultV1'
import type { VerifiedSignupTransferRequestV1 } from '../contracts/generated/csi07/VerifiedSignupTransferRequestV1'
import type { VerifiedSignupTransferResultV1 } from '../contracts/generated/csi07/VerifiedSignupTransferResultV1'
import type { DestinationReceiptRequestV1 } from '../contracts/generated/csi07/DestinationReceiptRequestV1'
import type { AuthorizationFinalizationRequestV1 } from '../contracts/generated/csi08/AuthorizationFinalizationRequestV1'
import type { AuthorizationFinalizationResultV1 } from '../contracts/generated/csi08/AuthorizationFinalizationResultV1'
import type { DestinationReceiptResultV1 } from '../contracts/generated/csi08/DestinationReceiptResultV1'
import type { EmailLinkPreviewRequestV1 } from '../contracts/generated/csi11/EmailLinkPreviewRequestV1'
import type { EmailLinkPreviewResultV1 } from '../contracts/generated/csi11/EmailLinkPreviewResultV1'
import type { EmailVerificationRequestV1 } from '../contracts/generated/csi11/EmailVerificationRequestV1'
import type { EmailVerificationResultV1 } from '../contracts/generated/csi11/EmailVerificationResultV1'
import type { PasswordRecoveryAcceptedV1 } from '../contracts/generated/csi11/PasswordRecoveryAcceptedV1'
import type { PasswordRecoveryCompleteRequestV1 } from '../contracts/generated/csi11/PasswordRecoveryCompleteRequestV1'
import type { PasswordRecoveryCompletedV1 } from '../contracts/generated/csi11/PasswordRecoveryCompletedV1'
import type { PasswordRecoveryRequestV1 } from '../contracts/generated/csi11/PasswordRecoveryRequestV1'
import type { PasswordRecoveryResolveRequestV1 } from '../contracts/generated/csi11/PasswordRecoveryResolveRequestV1'
import type { SignupCompleteRequestV1 } from '../contracts/generated/csi11/SignupCompleteRequestV1'
import type { SignupPrivacyAcknowledgementHandoffV1 } from '../contracts/generated/csi11/SignupPrivacyAcknowledgementHandoffV1'
import type { SignupCompletionResultV1 } from '../contracts/generated/csi11/SignupCompletionResultV1'
import type { SignupCreateRequestV1 } from '../contracts/generated/csi11/SignupCreateRequestV1'
import type { SignupFinishRequestV1 } from '../contracts/generated/csi11/SignupFinishRequestV1'
import type { SignupHandoffRequestV1 } from '../contracts/generated/csi11/SignupHandoffRequestV1'
import type { SignupInitiationBindingV1 } from '../contracts/generated/csi11/SignupInitiationBindingV1'
import type { SignupOrganizationRequestV1 } from '../contracts/generated/csi11/SignupOrganizationRequestV1'
import type { SignupPasswordRequestV1 } from '../contracts/generated/csi11/SignupPasswordRequestV1'
import type { SignupProfileV1 } from '../contracts/generated/csi11/SignupProfileV1'
import type { SignupProgressV1 } from '../contracts/generated/csi11/SignupProgressV1'
import type { SignupResendRequestV1 } from '../contracts/generated/csi11/SignupResendRequestV1'
import type { SignupResolveRequestV1 } from '../contracts/generated/csi11/SignupResolveRequestV1'
import type { DestinationContinuationFragment, EmailVerificationFragment, InitialEntryFragment } from '../security/fragment'
import type { AuthApi } from './http'
import { randomSecret32, randomUuid7 } from './random'

export interface IdentityFlow {
  readonly catalog: LoadedIdentityCatalog
  readonly controller: AuthApi
  readonly bootstrap: FlowBootstrapV1
  readonly head: BrowserHeadState
}

export interface DisplayAccount {
  readonly reference: AccountReferenceV1
  readonly summary: HomeAccountSummaryV1
}

export interface DisplayAccountsResult {
  readonly accounts: readonly DisplayAccount[]
  readonly unavailableCount: number
}

function headReference(head: BrowserHeadState) {
  return {
    browserHeadId: head.browserHeadId,
    browserInitializationId: head.browserInitializationId,
    placement: head.placement,
  }
}

function safeId(id: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(id)) {
    throw new Error('Invalid protocol path identifier')
  }
  return encodeURIComponent(id)
}

function assertBoundedText(value: string, maximumBytes: number, label: string): void {
  const bytes = new TextEncoder().encode(value).byteLength
  if (bytes === 0 || bytes > maximumBytes || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error(`Invalid ${label}`)
  }
}

function assertBootstrap(catalog: LoadedIdentityCatalog, bootstrap: FlowBootstrapV1): void {
  const presentation = catalog.presentation
  const admittedLogoAssetIds = presentation.logoAssets.kind === 'modeSafe'
    ? [presentation.logoAssets.assetId]
    : [presentation.logoAssets.lightAssetId, presentation.logoAssets.darkAssetId]
  if (bootstrap.schemaVersion !== 1 || bootstrap.authProjectionId !== catalog.projection.authProjectionId ||
      bootstrap.catalogVersion !== catalog.projection.catalogVersion ||
      bootstrap.catalogDigest !== catalog.projection.realmCatalogDigest ||
      bootstrap.locale !== catalog.locale ||
      bootstrap.presentation.presentationId !== presentation.presentationId ||
      bootstrap.presentation.presentationVersion !== presentation.presentationVersion ||
      bootstrap.presentation.productNameMessageKey !== presentation.productNameMessageKey ||
      bootstrap.presentation.themeId !== presentation.themePairingId ||
      !admittedLogoAssetIds.includes(bootstrap.presentation.logoAssetId)) {
    throw new Error('Flow bootstrap does not match the verified presentation')
  }
  identityApiForRegion(catalog, bootstrap.initialRegionId, bootstrap.initialIdentityApiOrigin)
}

async function mapAvailableBounded<Input, Output>(
  values: readonly Input[],
  worker: (value: Input) => Promise<Output | null>,
): Promise<{ values: Output[]; unavailableCount: number }> {
  const output: Array<Output | null | undefined> = Array(values.length)
  let unavailableCount = 0
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(4, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++
      try {
        const result = await worker(values[index]!)
        output[index] = result
      } catch {
        output[index] = null
        unavailableCount += 1
        // One unavailable home must not hide accounts from other homes.
      }
    }
  }))
  return {
    values: output.filter((entry): entry is Output => entry !== null && entry !== undefined),
    unavailableCount,
  }
}

export async function createIdentityFlow(
  catalog: LoadedIdentityCatalog,
  head: BrowserHeadState,
  fragment: InitialEntryFragment,
): Promise<IdentityFlow> {
  const region = catalog.projection.regions.find((candidate) => candidate.regionId === head.placement.controllerRegionId)
  if (region === undefined) throw new Error('Pinned controller is unavailable')
  const controller = controllerApiForRegion(catalog, region.regionId, region.controllerOrigin)
  const request: FlowCreateRequestV1 = {
    schemaVersion: 1,
    head: headReference(head),
    start: {
      kind: fragment.kind,
      authProjectionId: fragment.projection,
      suggestedControllerRegionId: fragment.controller,
      catalogVersion: fragment.catalog,
      catalogDigest: fragment.digest,
      recoveryReceipt: fragment.recovery,
      envelope: fragment.start,
    },
  }
  const bootstrap = await controller.post<FlowCreateRequestV1, FlowBootstrapV1>('/api/auth/v1/flows', request, 'flowBootstrap')
  assertBootstrap(catalog, bootstrap)
  return Object.freeze({ catalog, controller, bootstrap, head })
}

export async function continueAccountEstablishment(flow: IdentityFlow, result: AccountEstablishmentResultV1): Promise<string | null> {
  if (result.kind !== 'established' && result.kind !== 'useExisting') return null
  let next = await flow.controller.post<AccountContinuationRequestV1, AccountContinuationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/account-continuations`,
    { schemaVersion: 1, kind: 'establishment', establishmentOperationId: result.operationId, outcome: result.outcome },
    'accountContinuation',
    flow.bootstrap.csrfToken,
    { 'Idempotency-Key': result.operationId },
  )
  if (next.kind === 'relocate' || next.kind === 'prepareDestination') return next.navigationUri
  const home = admittedIdentityApi(flow.catalog, next.identityApiOrigin)
  const authorization = await home.post<AccountAuthorizationRequestV1, AccountAuthorizationResultV1>(
    '/api/auth/v1/account-authorizations',
    { schemaVersion: 1, attemptId: next.attemptId, capability: next.capability, registrationProof: next.registrationProof },
    'accountAuthorization',
    undefined,
    { 'Idempotency-Key': next.attemptId },
  )
  if (authorization.kind !== 'prepared') throw new Error('Account authorization was rejected after establishment')
  next = await flow.controller.post<AccountContinuationRequestV1, AccountContinuationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/account-continuations`,
    { schemaVersion: 1, kind: 'authorization', authorizationAttemptId: next.attemptId, preparation: authorization.preparation },
    'accountContinuation',
    flow.bootstrap.csrfToken,
    { 'Idempotency-Key': next.attemptId },
  )
  if (next.kind !== 'relocate' && next.kind !== 'prepareDestination') {
    throw new Error('Account continuation did not reach a destination')
  }
  return next.navigationUri
}

export async function signIn(flow: IdentityFlow, email: string, password: string): Promise<{ result: AccountEstablishmentResultV1; navigationUri: string | null }> {
  assertBoundedText(email, 254, 'email')
  assertBoundedText(password, 1_024, 'password')
  const capability = await flow.controller.post<CredentialCapabilityRequestV1, CredentialCapabilityResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-capabilities`,
    { schemaVersion: 1, action: 'signInRoute' }, 'credentialCapability', flow.bootstrap.csrfToken,
  )
  if (capability.action !== 'signInRoute') throw new Error('Wrong credential capability')
  const initialHome = identityApiForRegion(flow.catalog, flow.bootstrap.initialRegionId, flow.bootstrap.initialIdentityApiOrigin)
  const route = await initialHome.post<CredentialRouteRequestV1, CredentialRouteResolutionV1>(
    '/api/auth/v1/sign-in/routes', { schemaVersion: 1, email, capability: capability.routeCapability }, 'routeResolution',
  )
  const continued = await flow.controller.post<RouteContinuationRequestV1, CredentialRouteContinuationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/route-continuations`,
    { schemaVersion: 1, routeDecision: route.routeDecision, homeSeed: route.homeSeed }, 'routeContinuation', flow.bootstrap.csrfToken,
  )
  if (continued.action !== 'signIn') throw new Error('Wrong route continuation')
  const home = identityApiForRegion(flow.catalog, continued.regionId, continued.identityApiOrigin)
  const attempt = await home.post<CredentialAttemptRequestV1, CredentialAttemptResultV1>(
    '/api/auth/v1/credential-attempts',
    { schemaVersion: 1, email, capability: continued.destinationCapability }, 'credentialAttempt', undefined,
    { 'Idempotency-Key': continued.attemptId },
  )
  const registration = await flow.controller.post<CredentialAttemptRegistrationRequestV1, CredentialAttemptRegistrationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-attempts`,
    { schemaVersion: 1, attemptReceipt: attempt.attemptReceipt, credentialCapability: continued.destinationCapability, recoveryCapability: attempt.recoveryCapability },
    'credentialRegistration', flow.bootstrap.csrfToken,
  )
  const result = await home.post<SignInRequestV1, AccountEstablishmentResultV1>(
    '/api/auth/v1/sign-ins',
    { schemaVersion: 1, email, password, attemptId: continued.attemptId, capability: continued.destinationCapability, registrationProof: registration.registrationProof },
    'accountEstablishment', undefined, { 'Idempotency-Key': continued.attemptId },
  )
  return { result, navigationUri: await continueAccountEstablishment(flow, result) }
}

export async function recoverCredentialAttempt(flow: IdentityFlow): Promise<{ result: AccountEstablishmentResultV1 | null; navigationUri: string | null }> {
  const recovery = await flow.controller.post<EmptyV1, CredentialAttemptRecoveryResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-attempt-recovery`,
    { schemaVersion: 1 },
    'credentialAttemptRecovery',
    flow.bootstrap.csrfToken,
  )
  if (recovery.kind === 'none') return { result: null, navigationUri: null }
  const home = admittedIdentityApi(flow.catalog, recovery.identityApiOrigin)
  const result = await home.post<EstablishmentRecoveryRequestV1, AccountEstablishmentResultV1>(
    `/api/auth/v1/account-establishments/${safeId(recovery.attemptId)}/recover`,
    { schemaVersion: 1, recoveryCapability: recovery.recoveryCapability },
    'accountEstablishment',
  )
  return { result, navigationUri: await continueAccountEstablishment(flow, result) }
}

export async function loadAccounts(flow: IdentityFlow): Promise<DisplayAccountsResult> {
  const result = await flow.controller.post<EmptyV1, AccountsResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/accounts`, { schemaVersion: 1 }, 'accounts', flow.bootstrap.csrfToken,
  )
  if (new Set(result.accounts.map((account) => account.browserAccountId)).size !== result.accounts.length) {
    throw new Error('Duplicate account option')
  }
  const accounts = await mapAvailableBounded(result.accounts, async (reference) => {
    const home = identityApiForRegion(flow.catalog, reference.homeRegionId, reference.identityApiOrigin)
    const metadata = await home.post<AccountMetadataRequestV1, AccountMetadataResultV1>(
      '/api/auth/v1/account-metadata', { schemaVersion: 1, capability: reference.metadataCapability }, 'accountMetadata',
    )
    if (metadata.kind === 'invalid') {
      await flow.controller.post<AccountValidationRequestV1, AccountValidationResultV1>(
        `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/account-validations`,
        { schemaVersion: 1, validationAttemptId: metadata.validationAttemptId, browserAccountId: reference.browserAccountId, capsuleGeneration: reference.capsuleGeneration, homeOutcome: metadata.outcome },
        'accountValidation', flow.bootstrap.csrfToken,
        { 'Idempotency-Key': metadata.validationAttemptId },
      )
      return null
    }
    if (metadata.account.browserAccountId !== reference.browserAccountId) return null
    const validation = await flow.controller.post<AccountValidationRequestV1, AccountValidationResultV1>(
      `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/account-validations`,
      { schemaVersion: 1, validationAttemptId: metadata.validationAttemptId, browserAccountId: reference.browserAccountId, capsuleGeneration: reference.capsuleGeneration, homeOutcome: metadata.account.validationReceipt },
      'accountValidation', flow.bootstrap.csrfToken,
      { 'Idempotency-Key': metadata.validationAttemptId },
    )
    return validation.kind === 'current' ? Object.freeze({ reference, summary: metadata.account }) : null
  })
  return Object.freeze({ accounts: Object.freeze(accounts.values), unavailableCount: accounts.unavailableCount })
}

export async function chooseAccount(flow: IdentityFlow, account: DisplayAccount, attemptId: string, productRouteMoveReceipt?: string): Promise<string | null> {
  const selected = await flow.controller.post<AccountSelectionRequestV1, AccountSelectionResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/account-selections`,
    { schemaVersion: 1, selectionAttemptId: attemptId, browserAccountId: account.reference.browserAccountId, validationReceipt: account.summary.validationReceipt, ...(productRouteMoveReceipt === undefined ? {} : { productRouteMoveReceipt }) },
    'accountSelection', flow.bootstrap.csrfToken,
  )
  if (selected.kind === 'relocate') return selected.navigationUri
  const home = admittedIdentityApi(flow.catalog, selected.identityApiOrigin)
  const authorization = await home.post<AccountAuthorizationRequestV1, AccountAuthorizationResultV1>(
    '/api/auth/v1/account-authorizations',
    { schemaVersion: 1, attemptId: selected.attemptId, capability: selected.capability, registrationProof: selected.registrationProof },
    'accountAuthorization', undefined, { 'Idempotency-Key': selected.attemptId },
  )
  if (authorization.kind !== 'prepared') throw new Error('Selected account authorization was rejected')
  const next = await flow.controller.post<AccountContinuationRequestV1, AccountContinuationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/account-continuations`,
    { schemaVersion: 1, kind: 'authorization', authorizationAttemptId: selected.attemptId, preparation: authorization.preparation },
    'accountContinuation', flow.bootstrap.csrfToken,
    { 'Idempotency-Key': selected.attemptId },
  )
  if (next.kind !== 'relocate' && next.kind !== 'prepareDestination') {
    throw new Error('Selected account did not reach a destination')
  }
  return next.navigationUri
}

export interface StartedSignup {
  readonly home: AuthApi
  readonly progress: Extract<SignupProgressV1, { kind: 'verificationPending' }>
  readonly protocol: SignupInitiationBindingV1
}

type SignupCapability = Extract<CredentialCapabilityResultV1, { action: 'signUp' }>

/** Live-memory recovery state for one signup start; never persist this object. */
export interface SignupStartAttempt {
  readonly email: string
  readonly regionId: string
  capability?: SignupCapability
  preparation?: SignupPreparationResultV1
  registration?: SignupOperationRegistrationResultV1
}

export async function startSignup(flow: IdentityFlow, attempt: SignupStartAttempt): Promise<StartedSignup> {
  assertBoundedText(attempt.email, 254, 'email')
  const region = flow.catalog.projection.regions.find((candidate) => candidate.regionId === attempt.regionId)
  if (region === undefined) throw new Error('Unknown signup region')
  const issued = attempt.capability ?? await flow.controller.post<CredentialCapabilityRequestV1, CredentialCapabilityResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-capabilities`,
    { schemaVersion: 1, action: 'signUp', selectedRegionId: attempt.regionId }, 'credentialCapability', flow.bootstrap.csrfToken,
  )
  if (issued.action !== 'signUp') throw new Error('Wrong signup capability')
  attempt.capability = issued
  const home = identityApiForRegion(flow.catalog, region.regionId, region.identityOrigin)
  const preparation = attempt.preparation ?? await home.post<SignupPreparationRequestV1, SignupPreparationResultV1>(
    '/api/auth/v1/signup-preparations', { schemaVersion: 1, email: attempt.email, capability: issued.destinationCapability }, 'signupPreparation', undefined,
    { 'Idempotency-Key': issued.establishmentOperationId },
  )
  attempt.preparation = preparation
  const registration = attempt.registration ?? await flow.controller.post<SignupOperationRegistrationRequestV1, SignupOperationRegistrationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/signup-operation-registrations`,
    { schemaVersion: 1, preparationReceipt: preparation.preparationReceipt }, 'signupRegistration', flow.bootstrap.csrfToken,
  )
  if (registration.signupId !== issued.establishmentOperationId) throw new Error('Signup registration operation mismatch')
  attempt.registration = registration
  const protocol: SignupInitiationBindingV1 = {
    capability: issued.destinationCapability,
    preparationReceipt: preparation.preparationReceipt,
    registrationProof: registration.registrationProof,
  }
  const request: SignupCreateRequestV1 = {
    schemaVersion: 1,
    email: attempt.email,
    protocol,
  }
  const progress = await home.post<SignupCreateRequestV1, SignupProgressV1>('/api/auth/v1/signups', request, 'signupProgress', undefined, { 'Idempotency-Key': issued.establishmentOperationId })
  if (progress.kind !== 'verificationPending' || progress.signupId !== registration.signupId) {
    throw new Error('Signup did not enter its registered verification operation')
  }
  return Object.freeze({ home, progress, protocol })
}

export async function resendSignup(started: StartedSignup, resendAttemptId: string): Promise<StartedSignup['progress']> {
  const request: SignupResendRequestV1 = {
    schemaVersion: 1,
    resendAttemptId,
    protocol: started.protocol,
  }
  const progress = await started.home.post<SignupResendRequestV1, SignupProgressV1>(
    `/api/auth/v1/signups/${safeId(started.progress.signupId)}/verification-email`,
    request,
    'signupProgress',
    started.progress.csrfToken,
    { 'Idempotency-Key': request.resendAttemptId },
  )
  if (progress.kind !== 'verificationPending') throw new Error('Signup resend returned the wrong state')
  return progress
}

export async function continueSignup(flow: IdentityFlow, attemptId: string): Promise<{ home: AuthApi; continuation: SignupContinuationResultV1; progress: SignupProgressV1 }> {
  const continuation = await flow.controller.post<SignupContinuationRequestV1, SignupContinuationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/signup-continuations`,
    { schemaVersion: 1, continuationAttemptId: attemptId }, 'signupContinuation', flow.bootstrap.csrfToken,
    { 'Idempotency-Key': attemptId },
  )
  const home = admittedIdentityApi(flow.catalog, continuation.identityApiOrigin)
  const progress = continuation.handoff === null
    ? await home.post<SignupResolveRequestV1, SignupProgressV1>(
      `/api/auth/v1/signups/${safeId(continuation.signupId)}/resolve`,
      { schemaVersion: 1, resolveAttemptId: attemptId, protocol: continuation.protocol }, 'signupProgress',
    )
    : await home.post<SignupHandoffRequestV1, SignupProgressV1>(
      '/api/auth/v1/signup-handoffs',
      { schemaVersion: 1, handoff: continuation.handoff, protocol: continuation.protocol }, 'signupProgress',
    )
  return { home, continuation, progress }
}

export async function updateSignup(
  flow: IdentityFlow,
  home: AuthApi,
  continuation: SignupContinuationResultV1,
  progress: SignupProgressV1,
  input: { organization?: string; password?: string; profile?: SignupProfileV1; privacyAcknowledgement?: SignupPrivacyAcknowledgementHandoffV1 },
  operationAttemptId?: string,
): Promise<SignupCompletionResultV1> {
  const base = `/api/auth/v1/signups/${safeId(continuation.signupId)}`
  if (progress.kind !== 'continue') throw new Error('Signup is not editable')
  if (progress.nextStep === 'organizationDetails' && input.organization !== undefined) {
    assertBoundedText(input.organization, 256, 'organization name')
    return home.put<SignupOrganizationRequestV1, SignupProgressV1>(`${base}/organization`, { schemaVersion: 1, displayName: input.organization, protocol: continuation.protocol }, 'signupProgress', progress.csrfToken)
  }
  if (progress.nextStep === 'setPassword' && input.password !== undefined) {
    assertBoundedText(input.password, 1_024, 'password')
    return home.put<SignupPasswordRequestV1, SignupProgressV1>(`${base}/password`, { schemaVersion: 1, password: input.password, protocol: continuation.protocol }, 'signupProgress', progress.csrfToken)
  }
  if (progress.nextStep === 'completeProfile' && input.profile !== undefined) {
    assertBoundedText(input.profile.firstName, 128, 'first name')
    if (input.profile.lastName !== null) assertBoundedText(input.profile.lastName, 128, 'last name')
    assertBoundedText(input.profile.handle, 64, 'handle')
    if (operationAttemptId === undefined) throw new Error('Missing signup completion attempt')
    const request: SignupCompleteRequestV1 = { schemaVersion: 1, completeAttemptId: operationAttemptId, profile: input.profile, privacyAcknowledgement: input.privacyAcknowledgement ?? null, protocol: continuation.protocol }
    return home.post<SignupCompleteRequestV1, SignupCompletionResultV1>(`${base}/complete`, request, 'signupCompletion', progress.csrfToken, { 'Idempotency-Key': request.completeAttemptId })
  }
  if (progress.nextStep === 'finishAuthentication') {
    if (operationAttemptId === undefined) throw new Error('Missing signup finish attempt')
    const request: SignupFinishRequestV1 = { schemaVersion: 1, finishAttemptId: operationAttemptId, protocol: continuation.protocol }
    const result = await home.post<SignupFinishRequestV1, SignupCompletionResultV1>(`${base}/finish`, request, 'signupCompletion', progress.csrfToken, { 'Idempotency-Key': request.finishAttemptId })
    return result
  }
  throw new Error('Signup input does not match the current step')
}

export async function refreshSignup(
  home: AuthApi,
  continuation: SignupContinuationResultV1,
): Promise<SignupProgressV1> {
  return home.get<SignupProgressV1>(
    `/api/auth/v1/signups/${safeId(continuation.signupId)}`,
    'signupProgress',
    { 'X-Metamorph-Signup-Context': continuation.protocol.continuationCapability },
  )
}

/** Live-memory recovery state for one password-recovery request. */
export interface PasswordRecoveryStartAttempt {
  readonly email: string
  capability?: Extract<CredentialCapabilityResultV1, { action: 'passwordRecoveryRoute' }>
  route?: CredentialRouteResolutionV1
  continuation?: CredentialRouteContinuationResultV1
}

export async function requestPasswordRecovery(
  flow: IdentityFlow,
  attempt: PasswordRecoveryStartAttempt,
): Promise<PasswordRecoveryAcceptedV1> {
  assertBoundedText(attempt.email, 254, 'email')
  const issued = attempt.capability ?? await flow.controller.post<CredentialCapabilityRequestV1, CredentialCapabilityResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-capabilities`,
    { schemaVersion: 1, action: 'passwordRecoveryRoute' }, 'credentialCapability', flow.bootstrap.csrfToken,
  )
  if (issued.action !== 'passwordRecoveryRoute') throw new Error('Wrong recovery capability')
  attempt.capability = issued
  const initialHome = identityApiForRegion(flow.catalog, flow.bootstrap.initialRegionId, flow.bootstrap.initialIdentityApiOrigin)
  const route = attempt.route ?? await initialHome.post<CredentialRouteRequestV1, CredentialRouteResolutionV1>(
    '/api/auth/v1/password-recovery-routes', { schemaVersion: 1, email: attempt.email, capability: issued.routeCapability }, 'routeResolution',
  )
  attempt.route = route
  const continued = attempt.continuation ?? await flow.controller.post<RouteContinuationRequestV1, CredentialRouteContinuationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/route-continuations`,
    { schemaVersion: 1, routeDecision: route.routeDecision, homeSeed: route.homeSeed }, 'routeContinuation', flow.bootstrap.csrfToken,
  )
  if (continued.action !== 'passwordRecoveryRequest') throw new Error('Wrong recovery continuation')
  attempt.continuation = continued
  const home = identityApiForRegion(flow.catalog, continued.regionId, continued.identityApiOrigin)
  const request: PasswordRecoveryRequestV1 = { schemaVersion: 1, email: attempt.email, protocol: { capability: continued.destinationCapability } }
  return home.post<PasswordRecoveryRequestV1, PasswordRecoveryAcceptedV1>(
    '/api/auth/v1/password-recovery-requests', request, 'recoveryAccepted', undefined,
    { 'Idempotency-Key': continued.attemptId },
  )
}

export async function previewEmailLink(home: AuthApi, token: string, context: string): Promise<EmailLinkPreviewResultV1> {
  return home.post<EmailLinkPreviewRequestV1, EmailLinkPreviewResultV1>(
    '/api/auth/v1/email-verifications/preview', { schemaVersion: 1, token, context }, 'emailPreview',
  )
}

export async function verifyEmail(home: AuthApi, request: EmailVerificationRequestV1): Promise<EmailVerificationResultV1> {
  return home.post<EmailVerificationRequestV1, EmailVerificationResultV1>(
    '/api/auth/v1/email-verifications', request, 'emailVerification',
  )
}

export async function confirmSignupEmail(
  catalog: LoadedIdentityCatalog,
  head: BrowserHeadState,
  fragment: EmailVerificationFragment,
  preview: EmailLinkPreviewResultV1,
): Promise<string> {
  const controllerRegion = catalog.projection.regions.find((region) => region.regionId === head.placement.controllerRegionId)
  const homeRegion = catalog.projection.regions.find((region) => region.regionId === fragment.home)
  if (controllerRegion === undefined || homeRegion === undefined) throw new Error('Email continuation region is unavailable')
  const controller = controllerApiForRegion(catalog, controllerRegion.regionId, controllerRegion.controllerOrigin)
  const anchor = await controller.post<BrowserAnchorRequestV1, BrowserAnchorResultV1>(
    '/api/auth/v1/browser-anchors',
    { schemaVersion: 1, head: headReference(head), verificationContext: fragment.controllerContext },
    'browserAnchor',
  )
  const verified = await verifyEmail(identityApiForRegion(catalog, homeRegion.regionId, homeRegion.identityOrigin), {
    schemaVersion: 1,
    token: fragment.token,
    protocol: { context: fragment.homeContext, anchorProof: anchor.anchorProof, preview: preview.preview },
  })
  if (controllerApiForRegion(catalog, controllerRegion.regionId, verified.controllerApiOrigin).origin !== controller.origin) {
    throw new Error('Verified signup targets another controller')
  }
  const transfer = await controller.post<VerifiedSignupTransferRequestV1, VerifiedSignupTransferResultV1>(
    '/api/auth/v1/verified-signup-transfers',
    { schemaVersion: 1, verifiedOutcome: verified.verifiedOutcome, anchorProof: anchor.anchorProof },
    'verifiedSignupTransfer',
  )
  const expectedReturn = catalogProductReturnUri(catalog, 'signupAdoption')
  if (catalogNavigationUri(catalog, transfer.navigationUri) !== expectedReturn) {
    throw new Error('Verified signup targets an unexpected product return')
  }
  return `${expectedReturn}#mm-auth=${transfer.adoptionReceipt}`
}

export async function resolveRecovery(home: AuthApi, request: PasswordRecoveryResolveRequestV1): Promise<EmailLinkPreviewResultV1> {
  return home.post<PasswordRecoveryResolveRequestV1, EmailLinkPreviewResultV1>(
    '/api/auth/v1/password-recoveries/resolve', request, 'emailPreview',
  )
}

export async function completeRecovery(home: AuthApi, request: PasswordRecoveryCompleteRequestV1): Promise<PasswordRecoveryCompletedV1> {
  assertBoundedText(request.newPassword, 1_024, 'password')
  return home.post<PasswordRecoveryCompleteRequestV1, PasswordRecoveryCompletedV1>(
    '/api/auth/v1/password-recoveries/complete', request, 'recoveryCompleted', undefined,
    { 'Idempotency-Key': request.completionAttemptId },
  )
}

export async function finalizeDestination(
  catalog: LoadedIdentityCatalog,
  head: BrowserHeadState,
  continuation: DestinationContinuationFragment,
): Promise<string> {
  const region = catalog.projection.regions.find((candidate) => candidate.regionId === head.placement.controllerRegionId)
  if (region === undefined) throw new Error('Pinned controller is unavailable')
  const controller = controllerApiForRegion(catalog, region.regionId, region.controllerOrigin)
  const bootstrap = await controller.post<EmptyV1, FlowBootstrapV1>(
    `/api/auth/v1/flows/${safeId(continuation.flow)}/bootstrap`, { schemaVersion: 1 }, 'flowBootstrap',
  )
  assertBootstrap(catalog, bootstrap)
  const attached = await controller.post<DestinationReceiptRequestV1, DestinationReceiptResultV1>(
    `/api/auth/v1/flows/${safeId(continuation.flow)}/destination-receipts`,
    { schemaVersion: 1, receipt: continuation.receipt }, 'destinationReceipt', bootstrap.csrfToken,
    { 'Idempotency-Key': continuation.operation },
  )
  const home = admittedIdentityApi(catalog, attached.identityApiOrigin)
  const finalized = await home.post<AuthorizationFinalizationRequestV1, AuthorizationFinalizationResultV1>(
    '/api/auth/v1/authorization-finalizations',
    { schemaVersion: 1, capability: attached.capability, attemptId: attached.finalizationAttemptId },
    'authorizationFinalization', undefined, { 'Idempotency-Key': attached.finalizationAttemptId },
  )
  return finalized.navigationUri
}

export async function uploadSignupPicture(
  home: AuthApi,
  continuation: SignupContinuationResultV1,
  csrfToken: string,
  picture: Blob,
  uploadAttemptId: string,
): Promise<void> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(picture.type) || picture.size > 5 * 1024 * 1024) {
    throw new Error('Invalid profile picture')
  }
  const response = await fetch(new URL(`/api/auth/v1/signups/${safeId(continuation.signupId)}/picture`, home.origin), {
    method: 'PUT',
    mode: 'cors',
    credentials: 'include',
    redirect: 'error',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(20_000),
    headers: {
      'Content-Type': picture.type,
      'X-Metamorph-CSRF': csrfToken,
      'X-Metamorph-Signup-Continuation': continuation.protocol.continuationCapability,
      'Idempotency-Key': uploadAttemptId,
    },
    body: picture,
  })
  await response.body?.cancel()
  if (!response.ok || response.status !== 204) throw new Error('Profile picture upload failed')
}

export { randomSecret32, randomUuid7 }
