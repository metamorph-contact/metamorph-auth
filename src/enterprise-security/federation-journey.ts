import type { IdentityCeremonyProgressV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityCeremonyProgressV1'
import type { IdentityCeremonyRefV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityCeremonyRefV1'
import type { IdentityFederationProgressV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityFederationProgressV1'
import type { IdentityFederationProviderV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityFederationProviderV1'
import type { IdentityMethodResolutionV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityMethodResolutionV1'
import type { IdentityJitProfileInputV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityJitProfileInputV1'
import type { PrivacyPolicyReferenceV1 } from '../contracts/generated/enterprise-security-v1/types/PrivacyPolicyReferenceV1'
import type { IdentityProfileCompleteRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityProfileCompleteRequestV1'
import type { IdentityIdpSamlHandoffRedeemResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityIdpSamlHandoffRedeemResultV1'
import type { AccountEstablishmentResultV1 } from '../contracts/generated/csi07/AccountEstablishmentResultV1'
import type { FederationClient } from './federation-client'
import type { SocialProviderV1 } from '../contracts/generated/enterprise-security-v1/types/SocialProviderV1'
import { federationCommandWasDenied } from './federation-contract'
import { randomUuid7 } from '../protocol/random'

export type FederationJourneyState =
  | { kind: 'entry'; resolution: IdentityMethodResolutionV1 }
  | { kind: 'confirm'; handoff: IdentityIdpSamlHandoffRedeemResultV1 }
  | { kind: 'verify-email'; progress: IdentityCeremonyProgressV1; challengeId: string | null }
  | {
      kind: 'profile'
      progress: IdentityCeremonyProgressV1
      primaryEmailChallengeId: string
      provisionalRevision: string
      privacyPolicy: PrivacyPolicyReferenceV1 | null
    }
  | { kind: 'factor'; progress: IdentityCeremonyProgressV1 }
  | { kind: 'collision'; progress: IdentityCeremonyProgressV1 }
  | { kind: 'invitations'; progress: IdentityCeremonyProgressV1 }
  | { kind: 'test_completed'; progress: IdentityCeremonyProgressV1 }
  | { kind: 'ready'; progress: IdentityCeremonyProgressV1 }
  | { kind: 'rejected' }

/** This owner recovers the existing protected CSI establishment outcome.
 * Progress=ready and I/H receipts alone cannot establish an account. */
export interface FederationAccountContinuation {
  establishment(
    progress: IdentityCeremonyProgressV1,
    commandId: string,
    signal: AbortSignal,
  ): Promise<AccountEstablishmentResultV1>
  continueAccount(result: AccountEstablishmentResultV1): Promise<string | null>
}
export function live(expiresAt: string, now = Date.now()): void {
  const expiry = Date.parse(expiresAt)
  if (!Number.isFinite(expiry) || expiry <= now) throw new Error('security.ceremony.expired')
}
function providerKey(p: IdentityFederationProviderV1): string {
  return JSON.stringify([
    p.targetTenantId,
    p.providerId,
    p.providerRevision,
    p.protocol,
    p.providerDisplayName,
    p.providerRegionId,
  ])
}
export function allowedProvider(
  resolution: IdentityMethodResolutionV1,
  selected: IdentityFederationProviderV1,
): IdentityFederationProviderV1 {
  live(resolution.expiresAt)
  if (!resolution.methods.includes('federation')) throw new Error('security.method.disabled')
  const choice = resolution.federationProviders.find(
    (candidate) => providerKey(candidate) === providerKey(selected),
  )
  if (choice === undefined) throw new Error('security.ceremony.mismatch')
  return choice
}
export function ceremony(
  progress: IdentityCeremonyProgressV1,
  attemptId: string,
): IdentityCeremonyRefV1 {
  live(progress.expiresAt)
  return {
    schemaVersion: 1,
    attemptId,
    continuationId: progress.continuationId,
    expectedCeremonyRevision: progress.ceremonyRevision,
  }
}
function successor(previous: IdentityCeremonyProgressV1, next: IdentityCeremonyProgressV1): void {
  live(previous.expiresAt)
  live(next.expiresAt)
  if (
    previous.continuationId !== next.continuationId ||
    Date.parse(next.expiresAt) > Date.parse(previous.expiresAt) ||
    BigInt(next.ceremonyRevision) < BigInt(previous.ceremonyRevision)
  )
    throw new Error('security.ceremony.mismatch')
}
export function nextFederationState(result: IdentityFederationProgressV1): FederationJourneyState {
  const progress = result.progress
  live(progress.expiresAt)
  if ((progress.nextStep === 'complete_profile') !== (result.jitProfile !== null))
    throw new Error('security.ceremony.mismatch')
  switch (progress.nextStep) {
    case 'confirm_federation':
      throw new Error('security.ceremony.mismatch')
    case 'verify_email':
      return { kind: 'verify-email', progress, challengeId: null }
    case 'verify_factor':
    case 'first_login_enrollment':
      return { kind: 'factor', progress }
    case 'resolve_identity':
      return { kind: 'collision', progress }
    case 'complete_profile': {
      const jit = result.jitProfile!
      return {
        kind: 'profile',
        progress,
        primaryEmailChallengeId: jit.primaryEmailChallengeId,
        provisionalRevision: jit.expectedProvisionalIdentityRevision,
        privacyPolicy: jit.privacyPolicy,
      }
    }
    case 'accept_invitation':
      return { kind: 'invitations', progress }
    case 'provider_test_completed':
      return { kind: 'test_completed', progress }
    case 'pending_provisioning':
      throw new Error('security.ceremony.mismatch')
    case 'ready':
      return { kind: 'ready', progress }
    case 'rejected':
      return { kind: 'rejected' }
  }
}
/** Leaving the inbox is explicit and local. A pending accept/reject receipt
 * never claims target access effective; skip submits no decision command. */
export function leaveFederationInbox(
  state: Extract<FederationJourneyState, { kind: 'invitations' }>,
): Extract<FederationJourneyState, { kind: 'ready' }> {
  live(state.progress.expiresAt)
  return { kind: 'ready', progress: state.progress }
}
/** Only the exact original request survives an ambiguous response, in memory.
 * Scope changes must stop this instance. Overlapping commands are rejected. */
export class FederationJourney {
  private pending: { key: string; id: string; fingerprint: string; request: unknown } | undefined
  private controller = new AbortController()
  private stopped = false
  private busy = false
  private navigationDeadline: string | undefined
  constructor(
    readonly flowId: string,
    readonly clientId: string,
    private readonly client: FederationClient,
    readonly flowExpiresAt: string,
  ) {}
  get hasUnresolvedCommand(): boolean {
    return this.pending !== undefined
  }
  get isStopped(): boolean {
    return this.stopped
  }
  get signal(): AbortSignal {
    return this.controller.signal
  }
  get navigationExpiresAt(): string {
    this.active()
    if (this.navigationDeadline === undefined) throw new Error('security.ceremony.mismatch')
    live(this.navigationDeadline)
    return this.navigationDeadline
  }
  stop(): void {
    this.stopped = true
    this.controller.abort()
    this.pending = undefined
    this.navigationDeadline = undefined
  }
  private active(): void {
    live(this.flowExpiresAt)
    if (this.stopped) throw new Error('security.ceremony.expired')
  }
  private async command<T, R>(
    key: string,
    input: unknown,
    body: (id: string) => T,
    run: (request: T, id: string, signal: AbortSignal) => Promise<R>,
    originalCommandId?: string,
  ): Promise<R> {
    this.active()
    if (originalCommandId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(originalCommandId)) {
      throw new Error('security.operation.conflict')
    }
    if (this.busy) throw new Error('security.operation.conflict')
    const fingerprint = JSON.stringify(input)
    if (
      this.pending !== undefined &&
      (this.pending.key !== key || this.pending.fingerprint !== fingerprint
        || (originalCommandId !== undefined && this.pending.id !== originalCommandId))
    )
      throw new Error('security.operation.conflict')
    if (this.pending === undefined) {
      const id = originalCommandId ?? randomUuid7()
      this.pending = { key, id, fingerprint, request: structuredClone(body(id)) }
    }
    const command = this.pending
    this.busy = true
    try {
      const result = await run(command.request as T, command.id, this.controller.signal)
      this.active()
      this.pending = undefined
      return result
    } catch (error) {
      // Definite terminal denials cannot pin a later command. Uncertain network,
      // malformed response, rate limit or unavailable-owner responses retain it.
      if (federationCommandWasDenied(error)) this.pending = undefined
      throw error
    } finally {
      this.busy = false
    }
  }
  async start(
    resolution: IdentityMethodResolutionV1,
    selected: IdentityFederationProviderV1,
  ): Promise<string> {
    const provider = allowedProvider(resolution, selected)
    const input = {
      schemaVersion: 1 as const,
      flowId: this.flowId,
      targetTenantId: provider.targetTenantId,
      providerId: provider.providerId,
      protocol: provider.protocol,
      clientRegistrationId: this.clientId,
    }
    return this.command(
      'start',
      input,
      () => input,
      async (request, id, signal) => {
        const result = await this.client.call('identity.federation.start', request, id, signal)
        this.active()
        live(resolution.expiresAt)
        live(result.expiresAt)
        if (result.providerId !== provider.providerId) throw new Error('security.ceremony.mismatch')
        this.navigationDeadline = result.expiresAt
        return result.navigationUri
      },
    )
  }
  async startSocial(
    resolution: IdentityMethodResolutionV1,
    provider: SocialProviderV1,
  ): Promise<string> {
    live(resolution.expiresAt)
    if (!resolution.methods.includes('social') || !resolution.socialProviders.includes(provider))
      throw new Error('security.method.disabled')
    const input = {
      schemaVersion: 1 as const, flowId: this.flowId, provider,
      clientRegistrationId: this.clientId, targetTenantIntentId: null,
    }
    return this.command('social-start', input, () => input, async (request, id, signal) => {
      const result = await this.client.call('identity.social.start', request, id, signal)
      this.active()
      live(resolution.expiresAt)
      live(result.expiresAt)
      if (result.provider !== provider || Date.parse(result.expiresAt) > Date.parse(this.flowExpiresAt))
        throw new Error('security.ceremony.mismatch')
      this.navigationDeadline = result.expiresAt
      return result.navigationUri
    })
  }
  async resume(callbackId: string, providerId: string): Promise<FederationJourneyState> {
    const input = {schemaVersion:1 as const,callbackId,providerId,
      proof:{kind:'browser_resume' as const,continuationId:callbackId,expectedCeremonyRevision:'1'}}
    return this.command('resume', input, () => input, async (request,id,signal) => {
      const result = await this.client.call('identity.federation.callback',request,id,signal)
      if (result.progress.continuationId !== callbackId || Date.parse(result.progress.expiresAt)>Date.parse(this.flowExpiresAt)) throw new Error('security.ceremony.mismatch')
      return nextFederationState(result)
    })
  }
  async acknowledgePrivacy(state: Extract<FederationJourneyState,{kind:'profile'}>, signal:AbortSignal, id:string): Promise<IdentityProfileCompleteRequestV1['privacyAcknowledgement']> {
    this.active(); live(state.progress.expiresAt)
    if (state.privacyPolicy === null) throw new Error('security.ceremony.mismatch')
    const result = await this.client.call('identity.jit.privacy.acknowledge',
      {ceremony:ceremony(state.progress,id),policy:state.privacyPolicy},id,AbortSignal.any([signal,this.controller.signal]))
    this.active(); signal.throwIfAborted()
    if (result.ceremonyId !== state.progress.continuationId || result.acknowledgementReceiptId !== id
      || result.policy.policyId !== state.privacyPolicy.policyId || result.policy.policyVersion !== state.privacyPolicy.policyVersion
      || result.policy.purpose !== state.privacyPolicy.purpose || result.policy.presentationDigest !== state.privacyPolicy.presentationDigest) throw new Error('security.ceremony.mismatch')
    return result
  }
  async redeem(handoffProof: string, originalCommandId?: string): Promise<FederationJourneyState> {
    const input = {
      schemaVersion: 1 as const,
      flowId: this.flowId,
      clientRegistrationId: this.clientId,
      handoffProof,
    }
    return this.command(
      'redeem',
      input,
      () => input,
      async (request, id, signal) => {
        const handoff = await this.client.call(
          'identity.federation.handoff.redeem',
          request,
          id,
          signal,
        )
        this.active()
        live(handoff.continuation.expiresAt)
        if (handoff.continuation.nextStep !== 'confirm_federation')
          throw new Error('security.ceremony.mismatch')
        return { kind: 'confirm', handoff }
      },
      originalCommandId,
    )
  }
  async confirm(
    state: Extract<FederationJourneyState, { kind: 'confirm' }>,
  ): Promise<FederationJourneyState> {
    const p = state.handoff.continuation
    live(p.expiresAt)
    const input = {
      schemaVersion: 1 as const,
      callbackId: state.handoff.callbackId,
      providerId: state.handoff.providerId,
      proof: {
        kind: 'saml_handoff_continue' as const,
        continuationId: p.continuationId,
        expectedCeremonyRevision: p.ceremonyRevision,
      },
    }
    return this.command(
      'confirm',
      input,
      () => input,
      async (request, id, signal) => {
        const result = await this.client.call('identity.federation.callback', request, id, signal)
        this.active()
        // Confirmation can enter a newly issued D-purpose JIT capability. Only
        // that transition gets a new deadline; retries within D never extend it.
        live(p.expiresAt)
        live(result.progress.expiresAt)
        // The confirmed callback may retain the C continuation or mint the
        // separate D-purpose continuation. The request's callback/proof pair,
        // not equality between those distinct identifiers, binds the handoff.
        if (BigInt(result.progress.ceremonyRevision) < BigInt(p.ceremonyRevision) ||
            Date.parse(result.progress.expiresAt) > Date.parse(this.flowExpiresAt))
          throw new Error('security.ceremony.mismatch')
        if (Date.parse(result.progress.expiresAt) > Date.parse(p.expiresAt) &&
            (!['verify_email', 'resolve_identity'].includes(result.progress.nextStep) ||
              Date.parse(result.progress.expiresAt) > Date.now() + 15 * 60_000))
          throw new Error('security.ceremony.mismatch')
        return nextFederationState(result)
      },
    )
  }
  async email(
    state: Extract<FederationJourneyState, { kind: 'verify-email' }>,
    submittedEmail: string,
  ): Promise<FederationJourneyState> {
    return this.command(
      'email',
      [state.progress, submittedEmail],
      (id) => ({ ceremony: ceremony(state.progress, id), submittedEmail }),
      async (request, id, signal) => {
        const result = await this.client.call(
          'identity.jit.primary_email.start',
          request,
          id,
          signal,
        )
        this.active()
        successor(state.progress, result.progress)
        if (result.progress.nextStep !== 'verify_email')
          throw new Error('security.ceremony.mismatch')
        return { kind: 'verify-email', progress: result.progress, challengeId: result.challengeId }
      },
    )
  }
  async verify(
    state: Extract<FederationJourneyState, { kind: 'verify-email' }>,
    proof: string,
  ): Promise<FederationJourneyState> {
    if (state.challengeId === null) throw new Error('security.ceremony.mismatch')
    const challengeId = state.challengeId
    return this.command(
      'verify',
      [state, proof],
      (id) => ({ ceremony: ceremony(state.progress, id), challengeId, proof }),
      async (request, id, signal) => {
        const result = await this.client.call(
          'identity.jit.primary_email.verify',
          request,
          id,
          signal,
        )
        this.active()
        successor(state.progress, result.progress)
        if (result.jitProfile !== null && result.jitProfile.primaryEmailChallengeId !== challengeId)
          throw new Error('security.ceremony.mismatch')
        return nextFederationState(result)
      },
    )
  }
  async profile(
    state: Extract<FederationJourneyState, { kind: 'profile' }>,
    profile: IdentityJitProfileInputV1,
    privacyAcknowledgement: IdentityProfileCompleteRequestV1['privacyAcknowledgement'],
  ): Promise<FederationJourneyState> {
    return this.command(
      'profile',
      [state, profile, privacyAcknowledgement],
      (id) => ({
        ceremony: ceremony(state.progress, id),
        expectedProvisionalIdentityRevision: state.provisionalRevision,
        primaryEmailChallengeId: state.primaryEmailChallengeId,
        profile,
        privacyAcknowledgement,
      }),
      async (request, id, signal) => {
        const result = await this.client.call('identity.jit.profile_complete', request, id, signal)
        this.active()
        successor(state.progress, result.progress)
        return nextFederationState(result)
      },
    )
  }
  async finish(
    state: Extract<FederationJourneyState, { kind: 'ready' }>,
    account: FederationAccountContinuation,
  ): Promise<string | null> {
    if (state.kind !== 'ready') throw new Error('security.ceremony.mismatch')
    live(state.progress.expiresAt)
    return this.command(
      'finish',
      state.progress,
      () => state.progress,
      async (request, id, signal) => {
        const result = await account.establishment(request, id, signal)
        this.active()
        live(request.expiresAt)
        if (result.kind !== 'established' && result.kind !== 'useExisting')
          throw new Error('security.ceremony.mismatch')
        live(result.expiresAt)
        if (Date.parse(result.expiresAt) > Date.parse(request.expiresAt))
          throw new Error('security.ceremony.mismatch')
        const uri = await account.continueAccount(result)
        this.active()
        live(request.expiresAt)
        return uri
      },
    )
  }
}
