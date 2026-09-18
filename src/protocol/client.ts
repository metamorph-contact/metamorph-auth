import type { IdentityFlowResumeReferenceV1 } from '../contracts/generated/csi07/IdentityFlowResumeReferenceV1'
import type { FlowResumeFromStartRequestV1 } from '../contracts/generated/csi07/FlowResumeFromStartRequestV1'
import type { StartRecovery } from '../security/session-receipts'
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
import type { CredentialPreparationRecoveryRequestV1 } from '../contracts/generated/csi07/CredentialPreparationRecoveryRequestV1'
import type { CredentialPreparationRecoveryResultV1 } from '../contracts/generated/csi07/CredentialPreparationRecoveryResultV1'
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
import type { RelayResumptionRequestV1 } from '../contracts/generated/csi07/RelayResumptionRequestV1'
import type { RelayResumptionResultV1 } from '../contracts/generated/csi07/RelayResumptionResultV1'
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
import type { DestinationContinuationFragment, EmailVerificationFragment, InitialEntryFragment, FederationReturnFragment, RelayResumptionFragment } from '../security/fragment'
import type { AuthApi } from './http'
import { ProtocolError } from './http'
import { randomSecret32, randomUuid7 } from './random'
import { normalizeEmailForWire } from '../presentation/validation'

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

interface RecoveredCredentialRegistration {
  readonly attemptId: string
  readonly identityApiOrigin: string
  readonly credentialCapability: string
  readonly registrationProof: string
  readonly federationFlowAuthorization: string
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

function assertBoundedPassword(value: string): void {
  if (value.length === 0 || new TextEncoder().encode(value).byteLength > 16 * 1024) {
    throw new Error('Invalid password')
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
  const emergency = bootstrap.emergencyEntry
  const emergencyShapeValid = emergency !== null &&
    emergency.schemaVersion === 1 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(emergency.launchId) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(emergency.targetTenantId) &&
    Number.isFinite(Date.parse(emergency.expiresAt)) &&
    Date.parse(emergency.expiresAt) > Date.now() &&
    Date.parse(emergency.expiresAt) <= Date.parse(bootstrap.expiresAt) &&
    (emergency.purpose === 'entry'
      ? emergency.targetUserId === null && emergency.resultNonce === null
      : emergency.purpose === 'factor_test' &&
        emergency.targetUserId !== null &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(emergency.targetUserId) &&
        emergency.resultNonce !== null &&
        /^[A-Za-z0-9_-]{43}$/u.test(emergency.resultNonce))
  if (
    (bootstrap.intent === 'emergency') !== (emergency !== null) ||
    (emergency !== null && !emergencyShapeValid) ||
    (emergency === null) !== (bootstrap.emergencyAuthorization === null) ||
    (bootstrap.emergencyAuthorization !== null &&
      (!/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]*){2}(?:(?:\.[A-Za-z0-9_-]*){2})?$/u.test(bootstrap.emergencyAuthorization) ||
        bootstrap.emergencyAuthorization.length > 16 * 1024))
  ) throw new Error('Invalid emergency flow bootstrap')
  if (emergency !== null) identityApiForRegion(catalog, emergency.identityHomeRegionId)
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

export async function resumeFederationFlow(catalog: LoadedIdentityCatalog, head: BrowserHeadState, fragment: FederationReturnFragment): Promise<IdentityFlow> {
  if (head.placement.controllerRegionId !== fragment.controller) throw new Error('Browser controller changed')
  const controller = controllerApiForRegion(catalog, fragment.controller)
  const bootstrap = await controller.post<EmptyV1, FlowBootstrapV1>(
    `/api/auth/v1/flows/${safeId(fragment.flow)}/bootstrap`, {schemaVersion:1}, 'flowBootstrap',
  )
  assertBootstrap(catalog, bootstrap)
  if (bootstrap.flowId !== fragment.flow || bootstrap.authProjectionId !== fragment.projection
    || bootstrap.catalogVersion !== fragment.catalog || bootstrap.catalogDigest !== fragment.digest) throw new Error('Federation flow changed')
  return Object.freeze({catalog,head,controller,bootstrap})
}
export async function resumeIdentityFlow(
  catalog: LoadedIdentityCatalog, head: BrowserHeadState, reference: IdentityFlowResumeReferenceV1,
): Promise<IdentityFlow> {
  if (reference.schemaVersion !== 1 || head.placement.controllerRegionId !== reference.controllerRegionId
    || Date.parse(reference.expiresAt) <= Date.now()) throw new Error('Identity flow changed')
  const controller = controllerApiForRegion(catalog, reference.controllerRegionId)
  const bootstrap = await controller.post<EmptyV1, FlowBootstrapV1>(
    `/api/auth/v1/flows/${safeId(reference.flowId)}/bootstrap`, {schemaVersion:1}, 'flowBootstrap',
  )
  assertBootstrap(catalog, bootstrap)
  if (bootstrap.flowId !== reference.flowId || bootstrap.authProjectionId !== reference.authProjectionId
    || bootstrap.catalogVersion !== reference.catalogVersion || bootstrap.catalogDigest !== reference.catalogDigest
    || bootstrap.flowResume?.expiresAt !== reference.expiresAt) throw new Error('Identity flow changed')
  return Object.freeze({ catalog, head, controller, bootstrap })
}

export async function resumeFlowFromStart(
  catalog: LoadedIdentityCatalog, head: BrowserHeadState, reference: StartRecovery,
): Promise<IdentityFlow> {
  const controller = controllerApiForRegion(catalog, head.placement.controllerRegionId)
  const bootstrap = await controller.post<FlowResumeFromStartRequestV1, FlowBootstrapV1>(
    '/api/auth/v1/flows/resume-from-start',
    { schemaVersion: 1, authProjectionId: reference.projection, recoveryReceipt: reference.recovery }, 'flowBootstrap',
  )
  assertBootstrap(catalog, bootstrap)
  if (bootstrap.authProjectionId !== reference.projection || bootstrap.catalogVersion !== reference.catalog
      || bootstrap.catalogDigest !== reference.digest) throw new Error('Original identity flow changed')
  return Object.freeze({ catalog, head, controller, bootstrap })
}

export async function recoverFederationEstablishment(flow: IdentityFlow, signal: AbortSignal): Promise<AccountEstablishmentResultV1> {
  signal.throwIfAborted()
  const recovery = await flow.controller.post<EmptyV1, CredentialAttemptRecoveryResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-attempt-recovery`,
    {schemaVersion:1}, 'credentialAttemptRecovery', flow.bootstrap.csrfToken,
  )
  signal.throwIfAborted()
  if (recovery.kind !== 'recover') throw new Error('Federation establishment is unavailable')
  const home = admittedIdentityApi(flow.catalog, recovery.identityApiOrigin)
  const outcome = await home.post<EstablishmentRecoveryRequestV1, AccountEstablishmentResultV1>(
    `/api/auth/v1/account-establishments/${safeId(recovery.attemptId)}/recover`,
    {schemaVersion:1,recoveryCapability:recovery.recoveryCapability}, 'accountEstablishment',
  )
  signal.throwIfAborted()
  if (outcome.kind !== 'established' && outcome.kind !== 'useExisting') throw new Error('Federation establishment is unavailable')
  return outcome
}
/** Publish only the H-established account into CSI before inbox admission.
 * Product/target authorization remains the existing explicit continuation. */
export async function admitAccountForInbox(flow:IdentityFlow,result:AccountEstablishmentResultV1,signal:AbortSignal):Promise<import('../contracts/generated/csi07/RecipientAccountAdmissionV1').RecipientAccountAdmissionV1> {
  signal.throwIfAborted()
  if(result.kind!=='established'&&result.kind!=='useExisting')throw new Error('Federation establishment is unavailable')
  const admitted=await flow.controller.post<AccountContinuationRequestV1,import('../contracts/generated/csi07/RecipientAccountAdmissionV1').RecipientAccountAdmissionV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/recipient-account-establishments`,
    {schemaVersion:1,kind:'establishment',establishmentOperationId:result.operationId,outcome:result.outcome},
    'recipientAccountAdmission',flow.bootstrap.csrfToken,{'Idempotency-Key':result.operationId},
  )
  signal.throwIfAborted()
  return admitted
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

async function recoverCurrentCredentialRegistration(
  flow: IdentityFlow,
  preparationEmail?: string,
): Promise<RecoveredCredentialRegistration | null> {
  const recovery = await flow.controller.post<EmptyV1, CredentialAttemptRecoveryResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-attempt-recovery`,
    { schemaVersion: 1 }, 'credentialAttemptRecovery', flow.bootstrap.csrfToken,
  )
  if (recovery.kind === 'none') return null
  if (recovery.kind === 'recover') {
    return {
      attemptId: recovery.attemptId,
      identityApiOrigin: recovery.identityApiOrigin,
      credentialCapability: recovery.retryMaterial.credentialCapability,
      registrationProof: recovery.retryMaterial.registrationProof,
      federationFlowAuthorization: recovery.retryMaterial.federationFlowAuthorization,
    }
  }
  const home = admittedIdentityApi(flow.catalog, recovery.identityApiOrigin)
  const original = await home.post<CredentialPreparationRecoveryRequestV1, CredentialPreparationRecoveryResultV1>(
    '/api/auth/v1/federation/credential-preparations/recover',
    { schemaVersion: 1, preparationRecoveryProof: recovery.preparationRecoveryProof },
    'credentialPreparationRecovery',
  )
  if (original.kind === 'notPrepared' && preparationEmail === undefined) return null
  const attempt = original.kind === 'recovered' ? original.preparation : await home.post<CredentialAttemptRequestV1, CredentialAttemptResultV1>(
    '/api/auth/v1/federation/credential-attempts',
    { schemaVersion: 1, email: preparationEmail!, capability: recovery.credentialCapability },
    'credentialAttempt', undefined, { 'Idempotency-Key': recovery.attemptId },
  )
  const registration = await flow.controller.post<CredentialAttemptRegistrationRequestV1, CredentialAttemptRegistrationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-attempts`,
    { schemaVersion: 1, attemptReceipt: attempt.attemptReceipt, credentialCapability: recovery.credentialCapability, recoveryCapability: attempt.recoveryCapability },
    'credentialRegistration', flow.bootstrap.csrfToken,
  )
  return {
    attemptId: recovery.attemptId,
    identityApiOrigin: recovery.identityApiOrigin,
    credentialCapability: recovery.credentialCapability,
    registrationProof: registration.registrationProof,
    federationFlowAuthorization: registration.federationFlowAuthorization,
  }
}

export async function signIn(flow: IdentityFlow, email: string, password: string): Promise<AccountEstablishmentResultV1> {
  const canonicalEmail = normalizeEmailForWire(email)
  if (canonicalEmail === null) throw new Error('Invalid email')
  assertBoundedPassword(password)
  clearRealmSocialAuthorization(flow)
  const preparation = federationPreparations.get(flow)
  if (preparation?.email === canonicalEmail && preparation.pending !== undefined) {
    try {
      await preparation.pending
    } catch {
      // Only controller recovery below decides whether an interrupted
      // advisory lookup became the current registered attempt.
    }
  }
  if (preparation !== undefined && preparation.email !== canonicalEmail) {
    throw new Error('Federation flow input changed')
  }
  const recovered = await recoverCurrentCredentialRegistration(flow, canonicalEmail)
  if (recovered !== null) {
    const home = admittedIdentityApi(flow.catalog, recovered.identityApiOrigin)
    return home.post<SignInRequestV1, AccountEstablishmentResultV1>(
      '/api/auth/v1/sign-ins',
      {
        schemaVersion: 1,
        email: canonicalEmail,
        password,
        attemptId: recovered.attemptId,
        capability: recovered.credentialCapability,
        registrationProof: recovered.registrationProof,
      },
      'accountEstablishment', undefined, { 'Idempotency-Key': recovered.attemptId },
    )
  }
  const capability = await flow.controller.post<CredentialCapabilityRequestV1, CredentialCapabilityResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-capabilities`,
    { schemaVersion: 1, action: 'signInRoute' }, 'credentialCapability', flow.bootstrap.csrfToken,
  )
  if (capability.action !== 'signInRoute') throw new Error('Wrong credential capability')
  const initialHome = identityApiForRegion(flow.catalog, flow.bootstrap.initialRegionId, flow.bootstrap.initialIdentityApiOrigin)
  const route = await initialHome.post<CredentialRouteRequestV1, CredentialRouteResolutionV1>(
    '/api/auth/v1/sign-in/routes', { schemaVersion: 1, email: canonicalEmail, capability: capability.routeCapability }, 'routeResolution',
  )
  const continued = await flow.controller.post<RouteContinuationRequestV1, CredentialRouteContinuationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/route-continuations`,
    { schemaVersion: 1, routeDecision: route.routeDecision, homeSeed: route.homeSeed }, 'routeContinuation', flow.bootstrap.csrfToken,
  )
  if (continued.action !== 'signIn') throw new Error('Wrong route continuation')
  const home = identityApiForRegion(flow.catalog, continued.regionId, continued.identityApiOrigin)
  const attempt = await home.post<CredentialAttemptRequestV1, CredentialAttemptResultV1>(
    '/api/auth/v1/credential-attempts',
    { schemaVersion: 1, email: canonicalEmail, capability: continued.destinationCapability }, 'credentialAttempt', undefined,
    { 'Idempotency-Key': continued.attemptId },
  )
  const registration = await flow.controller.post<CredentialAttemptRegistrationRequestV1, CredentialAttemptRegistrationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-attempts`,
    { schemaVersion: 1, attemptReceipt: attempt.attemptReceipt, credentialCapability: continued.destinationCapability, recoveryCapability: attempt.recoveryCapability },
    'credentialRegistration', flow.bootstrap.csrfToken,
  )
  const result = await home.post<SignInRequestV1, AccountEstablishmentResultV1>(
    '/api/auth/v1/sign-ins',
    { schemaVersion: 1, email: canonicalEmail, password, attemptId: continued.attemptId, capability: continued.destinationCapability, registrationProof: registration.registrationProof },
    'accountEstablishment', undefined, { 'Idempotency-Key': continued.attemptId },
  )
  return result
}

/** Prepare the existing cancellable CSI operation for provider protocol work.
 * Recovery reads current controller cookie/CSRF authority before each call.
 * No identity-provider receipt is treated as an account establishment. */
export async function currentFederationAuthorization(flow: IdentityFlow, preparationEmail?: string): Promise<string | null> {
  if (flow.bootstrap.providerTestEntry != null) return currentProviderRuntimeTestAuthorization(flow)
  return (await recoverCurrentCredentialRegistration(flow, preparationEmail))
    ?.federationFlowAuthorization ?? null
}
type ProviderTestAuthorization = { authorization?: string; pending?: Promise<string> }
const providerTestAuthorizations = new WeakMap<IdentityFlow, ProviderTestAuthorization>()
export function releaseProviderRuntimeTest(flow: IdentityFlow): void {
  const state = providerTestAuthorizations.get(flow)
  if (state) state.authorization = undefined
  providerTestAuthorizations.delete(flow)
  if (flow.bootstrap.providerTestEntry) flow.bootstrap.providerTestEntry.preparation = ''
}
export async function currentProviderRuntimeTestAuthorization(flow: IdentityFlow): Promise<string> {
  const entry = flow.bootstrap.providerTestEntry
  const context = flow.bootstrap.providerTest
  if (!entry || !entry.preparation || !context || entry.testId !== context.testId
    || Date.parse(context.expiresAt) <= Date.now() || Date.parse(flow.bootstrap.expiresAt) <= Date.now()) {
    throw new Error('security.ceremony.expired')
  }
  let state = providerTestAuthorizations.get(flow)
  if (!state) { state = {}; providerTestAuthorizations.set(flow, state) }
  if (state.authorization) return state.authorization
  if (state.pending) return state.pending
  const original = state
  original.pending = (async () => {
    const { accounts } = await loadAccounts(flow)
    const account = accounts.find(value => value.reference.browserAccountId === context.browserAccountId)
    if (!account || account.reference.homeRegionId !== context.providerRegionId) throw new Error('security.owner.unavailable')
    const result = await flow.controller.post<
      import('../contracts/generated/csi07/ProviderRuntimeTestFlowRequestV1').ProviderRuntimeTestFlowRequestV1,
      import('../contracts/generated/csi07/ProviderRuntimeTestFlowResultV1').ProviderRuntimeTestFlowResultV1
    >(`/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/provider-runtime-test`, {
      schemaVersion: 1, preparation: entry.preparation, validationReceipt: account.summary.validationReceipt,
    }, 'providerRuntimeTestFlow', flow.bootstrap.csrfToken, {'Idempotency-Key': context.testId})
    if (result.flowId !== flow.bootstrap.flowId || Date.parse(result.expiresAt) > Date.parse(context.expiresAt)
      || Date.parse(result.expiresAt) <= Date.now() || providerTestAuthorizations.get(flow) !== original) {
      throw new Error('security.ceremony.mismatch')
    }
    original.authorization = result.authorization
    return result.authorization
  })()
  try { return await original.pending } finally { original.pending = undefined }
}

type RealmSocialAuthorization = {
  authorization?: string
  expiresAt?: number
  controller?: AbortController
  pending?: Promise<string>
}
const realmSocialAuthorizations = new WeakMap<IdentityFlow, RealmSocialAuthorization>()

export function clearRealmSocialAuthorization(flow: IdentityFlow): void {
  realmSocialAuthorizations.get(flow)?.controller?.abort()
  realmSocialAuthorizations.delete(flow)
}

export function cachedRealmSocialAuthorization(flow: IdentityFlow): string | null {
  const state = realmSocialAuthorizations.get(flow)
  if (state?.authorization === undefined || state.expiresAt === undefined || state.expiresAt <= Date.now()) {
    if (state?.pending === undefined) realmSocialAuthorizations.delete(flow)
    return null
  }
  return state.authorization
}

function waitForRealmSocialAuthorization(
  pending: Promise<string>,
  signal?: AbortSignal,
): Promise<string> {
  if (signal === undefined) return pending
  if (signal.aborted) return Promise.reject(signal.reason)
  return new Promise((resolve, reject) => {
    const aborted = () => reject(signal.reason)
    signal.addEventListener('abort', aborted, { once: true })
    pending.then(
      authorization => {
        signal.removeEventListener('abort', aborted)
        resolve(authorization)
      },
      error => {
        signal.removeEventListener('abort', aborted)
        reject(error)
      },
    )
  })
}

/** Issue and retain the controller-scoped authorization used by realm social
 * discovery and its immediately following start. Email route preparation
 * clears this state before creating a different operation. */
export async function currentRealmSocialAuthorization(
  flow: IdentityFlow,
  signal?: AbortSignal,
): Promise<string> {
  const cached = cachedRealmSocialAuthorization(flow)
  if (cached !== null) return cached
  if (signal?.aborted) throw signal.reason
  let state = realmSocialAuthorizations.get(flow)
  if (state?.pending !== undefined) return waitForRealmSocialAuthorization(state.pending, signal)
  state = { controller: new AbortController() }
  realmSocialAuthorizations.set(flow, state)
  const original = state
  original.pending = (async () => {
    try {
      const capability = await flow.controller.post<
        CredentialCapabilityRequestV1,
        CredentialCapabilityResultV1
      >(
        `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-capabilities`,
        { schemaVersion: 1, action: 'socialRoute' },
        'credentialCapability',
        flow.bootstrap.csrfToken,
        {},
        original.controller!.signal,
      )
      if (capability.action !== 'socialRoute') throw new Error('Wrong social capability')
      const expiresAt = Math.min(Date.parse(capability.expiresAt), Date.parse(flow.bootstrap.expiresAt))
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || realmSocialAuthorizations.get(flow) !== original) {
        throw new Error('security.ceremony.expired')
      }
      original.authorization = capability.federationFlowAuthorization
      original.expiresAt = expiresAt
      return capability.federationFlowAuthorization
    } finally {
      original.pending = undefined
      original.controller = undefined
      if (realmSocialAuthorizations.get(flow) === original && original.authorization === undefined) {
        realmSocialAuthorizations.delete(flow)
      }
    }
  })()
  return waitForRealmSocialAuthorization(original.pending, signal)
}

type FederationPreparation = {
  email: string
  capability?: Extract<CredentialCapabilityResultV1, {action:'federationRoute'}>
  route?: CredentialRouteResolutionV1
  continued?: CredentialRouteContinuationResultV1
  attempt?: CredentialAttemptResultV1
  pending?: Promise<void>
  complete: boolean
}
const federationPreparations = new WeakMap<IdentityFlow, FederationPreparation>()
export async function prepareFederationAttempt(flow: IdentityFlow, email: string): Promise<void> {
  const canonicalEmail = normalizeEmailForWire(email)
  if (canonicalEmail === null) throw new Error('Invalid email')
  clearRealmSocialAuthorization(flow)
  let preparation = federationPreparations.get(flow)
  if (preparation !== undefined && preparation.email !== canonicalEmail) throw new Error('Federation flow input changed')
  if (preparation?.complete) return
  if (preparation?.pending) return preparation.pending
  preparation ??= {email:canonicalEmail,complete:false}
  federationPreparations.set(flow,preparation)
  const original = preparation
  const pending = (async () => {
    if (await currentFederationAuthorization(flow, canonicalEmail) !== null) {original.complete=true;return}
    if (original.capability === undefined) {
      const capability = await flow.controller.post<CredentialCapabilityRequestV1, CredentialCapabilityResultV1>(
        `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-capabilities`,
        {schemaVersion:1,action:'federationRoute'}, 'credentialCapability', flow.bootstrap.csrfToken,
      )
      if (capability.action !== 'federationRoute') throw new Error('Wrong credential capability')
      original.capability=capability
    }
    const initialHome=identityApiForRegion(flow.catalog,flow.bootstrap.initialRegionId,flow.bootstrap.initialIdentityApiOrigin)
    original.route ??= await initialHome.post<CredentialRouteRequestV1, CredentialRouteResolutionV1>(
      '/api/auth/v1/federation/routes', {schemaVersion:1,email:canonicalEmail,capability:original.capability.routeCapability}, 'routeResolution',
    )
    if (original.continued === undefined) {
      const continued=await flow.controller.post<RouteContinuationRequestV1, CredentialRouteContinuationResultV1>(
        `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/route-continuations`,
        {schemaVersion:1,routeDecision:original.route.routeDecision,homeSeed:original.route.homeSeed}, 'routeContinuation',flow.bootstrap.csrfToken,
      )
      if (continued.action !== 'signIn') throw new Error('Wrong route continuation')
      original.continued=continued
    }
    const continued=original.continued
    const home=identityApiForRegion(flow.catalog,continued.regionId,continued.identityApiOrigin)
    original.attempt ??= await home.post<CredentialAttemptRequestV1, CredentialAttemptResultV1>(
      '/api/auth/v1/federation/credential-attempts',
      {schemaVersion:1,email:canonicalEmail,capability:continued.destinationCapability}, 'credentialAttempt',undefined,
      {'Idempotency-Key':continued.attemptId},
    )
    await flow.controller.post<CredentialAttemptRegistrationRequestV1, CredentialAttemptRegistrationResultV1>(
      `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-attempts`,
      {schemaVersion:1,attemptReceipt:original.attempt.attemptReceipt,credentialCapability:continued.destinationCapability,recoveryCapability:original.attempt.recoveryCapability},
      'credentialRegistration',flow.bootstrap.csrfToken,
    )
    original.complete=true
  })()
  original.pending=pending
  try {await pending} finally {
    // Keep the exact admitted route, H operation and registration material on
    // ambiguous responses. Retries must not replace or extend their deadlines.
    original.pending=undefined
  }
}

export async function recoverCredentialAttempt(flow: IdentityFlow): Promise<AccountEstablishmentResultV1 | null> {
  const recovery = await flow.controller.post<EmptyV1, CredentialAttemptRecoveryResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-attempt-recovery`,
    { schemaVersion: 1 },
    'credentialAttemptRecovery',
    flow.bootstrap.csrfToken,
  )
  if (recovery.kind !== 'recover') return null
  const home = admittedIdentityApi(flow.catalog, recovery.identityApiOrigin)
  const result = await home.post<EstablishmentRecoveryRequestV1, AccountEstablishmentResultV1>(
    `/api/auth/v1/account-establishments/${safeId(recovery.attemptId)}/recover`,
    { schemaVersion: 1, recoveryCapability: recovery.recoveryCapability },
    'accountEstablishment',
  )
  return result
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
  const canonicalEmail = normalizeEmailForWire(attempt.email)
  if (canonicalEmail === null) throw new Error('Invalid email')
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
    '/api/auth/v1/signup-preparations', { schemaVersion: 1, email: canonicalEmail, capability: issued.destinationCapability }, 'signupPreparation', undefined,
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
    email: canonicalEmail,
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
    assertBoundedPassword(input.password)
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
  const canonicalEmail = normalizeEmailForWire(attempt.email)
  if (canonicalEmail === null) throw new Error('Invalid email')
  const issued = attempt.capability ?? await flow.controller.post<CredentialCapabilityRequestV1, CredentialCapabilityResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/credential-capabilities`,
    { schemaVersion: 1, action: 'passwordRecoveryRoute' }, 'credentialCapability', flow.bootstrap.csrfToken,
  )
  if (issued.action !== 'passwordRecoveryRoute') throw new Error('Wrong recovery capability')
  attempt.capability = issued
  const initialHome = identityApiForRegion(flow.catalog, flow.bootstrap.initialRegionId, flow.bootstrap.initialIdentityApiOrigin)
  const route = attempt.route ?? await initialHome.post<CredentialRouteRequestV1, CredentialRouteResolutionV1>(
    '/api/auth/v1/password-recovery-routes', { schemaVersion: 1, email: canonicalEmail, capability: issued.routeCapability }, 'routeResolution',
  )
  attempt.route = route
  const continued = attempt.continuation ?? await flow.controller.post<RouteContinuationRequestV1, CredentialRouteContinuationResultV1>(
    `/api/auth/v1/flows/${safeId(flow.bootstrap.flowId)}/route-continuations`,
    { schemaVersion: 1, routeDecision: route.routeDecision, homeSeed: route.homeSeed }, 'routeContinuation', flow.bootstrap.csrfToken,
  )
  if (continued.action !== 'passwordRecoveryRequest') throw new Error('Wrong recovery continuation')
  attempt.continuation = continued
  const home = identityApiForRegion(flow.catalog, continued.regionId, continued.identityApiOrigin)
  const request: PasswordRecoveryRequestV1 = { schemaVersion: 1, email: canonicalEmail, protocol: { capability: continued.destinationCapability } }
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
  assertBoundedPassword(request.newPassword)
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

export async function resumeDestinationRelay(
  catalog: LoadedIdentityCatalog,
  head: BrowserHeadState,
  reference: IdentityFlowResumeReferenceV1,
  continuation: RelayResumptionFragment,
): Promise<string> {
  if (reference.authProjectionId !== catalog.projection.authProjectionId ||
      reference.catalogVersion !== catalog.projection.catalogVersion ||
      reference.catalogDigest !== catalog.projection.realmCatalogDigest) {
    throw new Error('Relay resumption catalog changed')
  }
  const region = catalog.projection.regions.find((candidate) => candidate.regionId === head.placement.controllerRegionId)
  if (region === undefined) throw new Error('Pinned controller is unavailable')
  const controller = controllerApiForRegion(catalog, region.regionId, region.controllerOrigin)
  const bootstrap = await controller.post<EmptyV1, FlowBootstrapV1>(
    `/api/auth/v1/flows/${safeId(reference.flowId)}/bootstrap`, { schemaVersion: 1 }, 'flowBootstrap',
  )
  assertBootstrap(catalog, bootstrap)
  const resumed = await controller.post<RelayResumptionRequestV1, RelayResumptionResultV1>(
    `/api/auth/v1/flows/${safeId(reference.flowId)}/relay-resumptions`,
    { schemaVersion: 1, resumeReceipt: continuation.resume }, 'relayResumption', bootstrap.csrfToken,
  )
  if (resumed.kind === 'relay') {
    const uri = new URL(resumed.navigationUri)
    const fields = new URLSearchParams(uri.hash.slice(1))
    const names = [...fields.keys()]
    if (names.length !== 4 || names.some((name, index) => name !== ['v', 'operation', 'payload', 'resume'][index]) ||
        fields.get('v') !== '1' || fields.get('operation') !== continuation.operation ||
        fields.get('resume') !== continuation.resume || !/^[A-Za-z0-9_-]+$/u.test(fields.get('payload') ?? '')) {
      throw new Error('Relay resumption changed the bound operation')
    }
    return resumed.navigationUri
  }
  if (resumed.recoveryAction === 'restartProductAuth') return catalogProductReturnUri(catalog, 'authStartRecovery')
  throw new Error('Relay resumption returned an unsupported terminal action')
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

/** Cancels only this cookie-backed C flow. The server commits the local fence
 * and exact original H/P cancellation deliveries before acknowledging it. */
export async function cancelIdentityFlow(flow: IdentityFlow, attemptId: string): Promise<void> {
  const result = await flow.controller.post<unknown, import('../contracts/generated/csi10/BrowserLogoutResultV1').BrowserLogoutResultV1>(
    `/api/auth/v1/flows/${flow.bootstrap.flowId}/cancellation`,
    {scope:'identityFlow',schemaVersion:1,prepareAttemptId:attemptId,flowId:flow.bootstrap.flowId,
      head:{browserHeadId:flow.head.browserHeadId,browserInitializationId:flow.head.browserInitializationId,placement:flow.head.placement}},
    'logoutResult',flow.bootstrap.csrfToken,{'Idempotency-Key':attemptId},
  )
  if(result.scope!=='identityFlow'||!['partial','complete','acknowledged'].includes(result.state)) {
    throw new ProtocolError('auth.logout.retry_required',true,undefined,'retryLogout')
  }
}
