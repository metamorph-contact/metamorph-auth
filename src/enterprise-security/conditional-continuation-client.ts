import type { LoadedIdentityCatalog } from '../catalog/runtime'
import type { RuntimeConditionalChallengeV1 } from '../contracts/generated/enterprise-security-v1/types/RuntimeConditionalChallengeV1'
import type { IdentityStepUpResultV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityStepUpResultV1'
import type { ActionProofRefV1 } from '../contracts/generated/enterprise-security-v1/types/ActionProofRefV1'
import { decodeBoundedJsonText } from '../contracts/decode'
import { conditionalChallenge } from './conditional-continuation-validators.generated'
import { decodePlan03Response } from './response-decode'

export interface ConditionalIdentityEntry {
  readonly locale: string
  readonly authProjectionId: string
  readonly catalogVersion: string
  readonly continuationId: string
}

export interface ConditionalSelectedAccount {
  readonly identityHomeTenantId: string
  readonly userId: string
  readonly containerId: string
  readonly accountSlotId: string
  readonly accountSessionId: string
}

/** Actual Plan 02/03 CSI integration. No browser-supplied action or proof is admitted here. */
export interface ConditionalIdentityOwner {
  resolve(entry: ConditionalIdentityEntry, signal: AbortSignal): Promise<{
    catalog: LoadedIdentityCatalog
    challengeJson: string
  }>
  /** Read the actual locally verified selected CSI account, never a form or URL value. */
  currentSelection(): ConditionalSelectedAccount | undefined
  /** Begin/use the actual common method owner for the full registered proof recipe.
   * The owner selects its normal CSI method lane, including password or federation;
   * the browser cannot substitute a generic initial-login or partial proof ceremony.
   */
  collect(challenge: Readonly<RuntimeConditionalChallengeV1>, signal: AbortSignal): Promise<string>
  /** Dispatch normal signed CSI callback/repair for this exact nonce. Fresh RBAC/gates run at destination. */
  returnToAction(challenge: Readonly<RuntimeConditionalChallengeV1>, proof: Readonly<ActionProofRefV1>, signal: AbortSignal): Promise<void>
}

export type ConditionalStepUpFailure = 'unavailable' | 'mismatch' | 'expired' | 'rejected' | 'uncertain'
export class ConditionalStepUpError extends Error {
  constructor(readonly kind: ConditionalStepUpFailure) { super(kind); this.name = 'ConditionalStepUpError' }
}

function immutable<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(immutable)
    Object.freeze(value)
  }
  return value
}

function sameSelection(action: ConditionalSelectedAccount, selected: ConditionalSelectedAccount | undefined): boolean {
  return selected !== undefined && (['identityHomeTenantId', 'userId', 'containerId', 'accountSlotId', 'accountSessionId'] as const)
    .every((key) => action[key] === selected[key])
}

/** One in-memory attempt. An ambiguous start/collection/return is never automatically retried. */
export class ConditionalStepUpSession {
  private used = false
  private deadline: number
  private constructor(
    readonly catalog: LoadedIdentityCatalog,
    readonly challenge: Readonly<RuntimeConditionalChallengeV1>,
    private readonly owner: ConditionalIdentityOwner,
    private readonly now: () => number,
  ) { this.deadline = Math.min(Date.parse(challenge.expiresAt), Date.parse(catalog.projection.expiresAt)) }

  static async resolve(entry: ConditionalIdentityEntry, owner: ConditionalIdentityOwner, signal: AbortSignal, now: () => number = Date.now): Promise<ConditionalStepUpSession> {
    const capturedEntry = immutable(structuredClone(entry))
    const initialSelection = owner.currentSelection()
    if (initialSelection === undefined) throw new ConditionalStepUpError('unavailable')
    const selected = immutable(structuredClone(initialSelection))
    signal.throwIfAborted()
    const loaded = await owner.resolve(capturedEntry, signal)
    signal.throwIfAborted()
    const decoded = decodeBoundedJsonText(loaded.challengeJson, 16 * 1024)
    if (!conditionalChallenge(decoded)) throw new ConditionalStepUpError('mismatch')
    const challenge = immutable(decoded as RuntimeConditionalChallengeV1)
    const projection = loaded.catalog.projection
    if (challenge.continuationId !== capturedEntry.continuationId || loaded.catalog.locale !== capturedEntry.locale
      || projection.authProjectionId !== capturedEntry.authProjectionId || projection.catalogVersion !== capturedEntry.catalogVersion
      || projection.productId !== challenge.action.productId || projection.surfaceId !== challenge.action.surfaceId || projection.clientId !== challenge.action.clientId
      || !projection.supportedLocales.includes(capturedEntry.locale)
      || !projection.regions.some((region) => region.regionId === challenge.identityHomeRegionId)
      || !projection.regions.some((region) => region.regionId === challenge.decisionRegionId)
      || !sameSelection(challenge.action, selected)
      || challenge.action.ceremonyTargetSha256 === challenge.actionBindingSha256
      || ((challenge.action.resource.kind === 'project' || challenge.action.resource.kind === 'space') && challenge.action.resource.productId !== challenge.action.productId)
      || challenge.required.length + challenge.baselineRequired.length === 0
      || new Set(challenge.required).size !== challenge.required.length || new Set(challenge.baselineRequired).size !== challenge.baselineRequired.length
      || (!Number.isFinite(Date.parse(challenge.createdAt)) || Date.parse(challenge.createdAt) > now() + 2000) || Date.parse(challenge.expiresAt) <= Date.parse(challenge.createdAt)
      || Date.parse(challenge.expiresAt) - Date.parse(challenge.createdAt) > 5 * 60_000) throw new ConditionalStepUpError('mismatch')
    const session = new ConditionalStepUpSession(loaded.catalog, challenge, owner, now)
    session.checkCurrent(signal)
    return session
  }

  checkCurrent(signal: AbortSignal): void {
    signal.throwIfAborted()
    if (!Number.isFinite(this.deadline) || this.now() >= this.deadline) throw new ConditionalStepUpError('expired')
    if (!sameSelection(this.challenge.action, this.owner.currentSelection())) throw new ConditionalStepUpError('mismatch')
  }

  remainingSeconds(): number { return Math.max(0, Math.ceil((this.deadline - this.now()) / 1000)) }

  async run(signal: AbortSignal, phase: (phase: 'collecting' | 'returning') => void): Promise<void> {
    this.checkCurrent(signal)
    if (this.used) throw new ConditionalStepUpError('uncertain')
    this.used = true
    phase('collecting')
    const completed: IdentityStepUpResultV1 = decodePlan03Response('identity.step_up.complete', await this.owner.collect(this.challenge, signal))
    this.deadline = Math.min(this.deadline, Date.parse(completed.expiresAt))
    this.checkCurrent(signal)
    if (completed.action.expectedAccountSessionId !== this.challenge.action.accountSessionId
      || completed.action.evidenceRevision !== completed.evidenceRevision
      || BigInt(completed.evidenceRevision) <= BigInt(this.challenge.action.originalEvidenceRevision)) throw new ConditionalStepUpError('mismatch')
    phase('returning')
    await this.owner.returnToAction(this.challenge, immutable(completed.action), signal)
    this.checkCurrent(signal)
  }
}
