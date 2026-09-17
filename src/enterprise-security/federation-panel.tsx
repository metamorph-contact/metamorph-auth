import { federationCommandWasDenied } from './federation-contract'
import { randomUuid7 } from '../protocol/random'
import { flushSync } from 'react-dom'
import { Checkbox } from '@polymorph/ui'
import { Button, FormField, Input, Stack, Text } from '@polymorph/ui/identity'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IdentityCeremonyProgressV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityCeremonyProgressV1'
import type { IdentityFederationProgressV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityFederationProgressV1'
import type { IdentityProfileCompleteRequestV1 } from '../contracts/generated/enterprise-security-v1/types/IdentityProfileCompleteRequestV1'
import type { IdentityRecipientClient } from './identity-recipient-client'
import { FederationInvitationInbox } from './federation-inbox'
import {
  FederationJourney,
  leaveFederationInbox,
  nextFederationState,
  type FederationAccountContinuation,
  type FederationJourneyState,
} from './federation-journey'

export interface FederationPanelOwners {
  cancel?: () => Promise<void>
  account?: FederationAccountContinuation
  recipient: IdentityRecipientClient
  /** Actual controlled-factor/link owners publish their current ceremony result;
   * no provider claim is treated as a local factor or account-link proof. */
  factor?: (
    progress: IdentityCeremonyProgressV1,
    signal: AbortSignal,
  ) => Promise<IdentityFederationProgressV1>
  linkExisting?: (
    progress: IdentityCeremonyProgressV1,
    signal: AbortSignal,
  ) => Promise<IdentityFederationProgressV1>
  privacy: {
    required: (state: Extract<FederationJourneyState, {kind:'profile'}>) => boolean
    acknowledge: (
      state: Extract<FederationJourneyState, {kind:'profile'}>,
      signal: AbortSignal,
      commandId: string,
    ) => Promise<IdentityProfileCompleteRequestV1['privacyAcknowledgement']>
  }
}
export function FederationJourneyPanel({
  journey,
  initial,
  owners,
  navigation,
}: {
  journey: FederationJourney
  initial: FederationJourneyState
  owners: FederationPanelOwners
  navigation: (uri: string) => Promise<void>
}) {
  const { t } = useTranslation('enterprise-security')
  const [state, setState] = useState(initial)
  const [email, setEmail] = useState('')
  const [proof, setProof] = useState('')
  const [handle, setHandle] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [color, setColor] = useState('#7c3aed')
  const [acknowledged, setAcknowledged] = useState(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [concealed, setConcealed] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelFailed, setCancelFailed] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const cancelBusy = useRef(false)
  const busy = useRef(false)
  const controller = useRef(new AbortController())
  const lifecycle = useRef(0)
  const privacyCommand = useRef<
    | {
        fingerprint: string
        id: string
        receipt?: IdentityProfileCompleteRequestV1['privacyAcknowledgement']
      }
    | undefined
  >(undefined)
  const deadline =
    state.kind === 'entry'
      ? state.resolution.expiresAt
      : state.kind === 'confirm'
        ? state.handoff.continuation.expiresAt
        : state.kind === 'rejected'
          ? journey.flowExpiresAt
          : state.progress.expiresAt
  useEffect(() => {
    const expire = () => {
      journey.stop()
      controller.current.abort()
      privacyCommand.current = undefined
      setState({ kind: 'rejected' })
      setProof('')
      setEmail('')
      setHandle('')
      setFirstName('')
      setLastName('')
      setAcknowledged(false)
      setPending(false)
      setConcealed(true)
    }
    const duration = Math.min(Date.parse(deadline), Date.parse(journey.flowExpiresAt)) - Date.now()
    if (!Number.isFinite(duration) || duration <= 0) {
      expire()
      return
    }
    const timer = window.setTimeout(expire, duration)
    return () => window.clearTimeout(timer)
  }, [deadline, journey])
  useEffect(() => {
    const generation = ++lifecycle.current
    controller.current = new AbortController()
    const scrub = () => {
      privacyCommand.current = undefined
      journey.stop()
      controller.current.abort()
      flushSync(() => {
        setConcealed(true)
        setProof('')
        setEmail('')
        setHandle('')
        setFirstName('')
        setLastName('')
      })
    }
    window.addEventListener('pagehide', scrub)
    return () => {
      window.removeEventListener('pagehide', scrub)
      controller.current.abort()
      queueMicrotask(() => {
        if (lifecycle.current === generation) {
          privacyCommand.current = undefined
          journey.stop()
        }
      })
    }
  }, [journey])
  async function run(work: () => Promise<FederationJourneyState | void>) {
    if (busy.current || controller.current.signal.aborted) return
    busy.current = true
    setPending(true)
    setFailed(false)
    try {
      const next = await work()
      if (!controller.current.signal.aborted && next !== undefined) {
        setState(next)
        setProof('')
        if (next.kind !== 'profile') {
          setHandle('')
          setFirstName('')
          setLastName('')
          setAcknowledged(false)
        }
        if (next.kind !== 'verify-email' || next.challengeId !== null) setEmail('')
      }
    } catch (error) {
      if (federationCommandWasDenied(error)) privacyCommand.current = undefined
      if (!controller.current.signal.aborted) setFailed(true)
    } finally {
      busy.current = false
      if (!controller.current.signal.aborted) setPending(false)
    }
  }
  async function cancel() {
    if(cancelBusy.current) return
    cancelBusy.current = true
    privacyCommand.current = undefined
    journey.stop()
    controller.current.abort()
    setConcealed(true)
    setState({kind:'rejected'})
    setProof(''); setEmail(''); setHandle(''); setFirstName(''); setLastName(''); setAcknowledged(false)
    setCancelling(true); setCancelFailed(false)
    try {
      if(!owners.cancel) throw new Error('security.owner.unavailable')
      await owners.cancel()
      setCancelled(true)
    } catch { setCancelFailed(true) }
    finally { cancelBusy.current = false; setCancelling(false) }
  }
  if (concealed) return <Stack>
    <Text>{t(cancelling?'security.journey.cancelPending':cancelFailed?'security.journey.cancelFailed':cancelled?'security.journey.cancelled':'security.journey.expired')}</Text>
    {cancelFailed&&<Button label={t('security.journey.retryButton')} disabled={cancelling} onClick={()=>void cancel()}/>}
  </Stack>
  const form = (children: React.ReactNode, submit: () => Promise<FederationJourneyState>) => (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void run(submit)
      }}
    >
      <Stack gap={3}>{children}</Stack>
    </form>
  )
  return (
    <Stack gap={4}>
      {state.kind === 'confirm' && (
        <>
          <Text>
            {t('security.journey.confirm', {
              tenant: state.handoff.tenantDisplayName,
              provider: state.handoff.providerDisplayName,
            })}
          </Text>
          <Button
            label={t('security.journey.continue')}
            loading={pending}
            disabled={pending}
            onClick={() => {
              void run(() => journey.confirm(state))
            }}
          />
        </>
      )}
      {state.kind === 'verify-email' &&
        form(
          <>
            <Text>{t('security.journey.emailDescription')}</Text>
            {state.challengeId === null ? (
              <>
                <FormField id="jit-primary-email" label={t('security.journey.email')} required>
                  <Input
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    disabled={pending}
                    value={email}
                    onChange={setEmail}
                  />
                </FormField>
                <Button
                  type="submit"
                  label={t('security.journey.send')}
                  loading={pending}
                  disabled={pending || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)}
                />
              </>
            ) : (
              <>
                <FormField id="jit-email-proof" label={t('security.journey.proof')} required>
                  <Input
                    maxLength={1024}
                    autoComplete="one-time-code"
                    disabled={pending}
                    value={proof}
                    onChange={setProof}
                  />
                </FormField>
                <Button
                  type="submit"
                  label={t('security.journey.verify')}
                  loading={pending}
                  disabled={pending || proof.length < 1}
                />
              </>
            )}
          </>,
          () =>
            state.challengeId === null
              ? journey.email(state, email.trim())
              : journey.verify(state, proof),
        )}
      {state.kind === 'profile' &&
        form(
          <>
            <Text>{t('security.journey.profile')}</Text>
            <FormField id="jit-handle" label={t('security.journey.handle')} required>
              <Input maxLength={48} value={handle} disabled={pending} onChange={setHandle} />
            </FormField>
            <FormField id="jit-first-name" label={t('security.journey.firstName')} required>
              <Input maxLength={160} value={firstName} disabled={pending} onChange={setFirstName} />
            </FormField>
            <FormField id="jit-last-name" label={t('security.journey.lastName')}>
              <Input maxLength={160} value={lastName} disabled={pending} onChange={setLastName} />
            </FormField>
            <FormField id="jit-avatar-color" label={t('security.journey.color')}>
              <Input maxLength={7} value={color} disabled={pending} onChange={setColor} />
            </FormField>
            <Text tone="secondary">{t('security.journey.picture')}</Text>
            {(state.privacyPolicy !== null || owners.privacy.required(state)) && (
              <Checkbox
                label={t(state.privacyPolicy?.purpose==='freely_given_consent' ? 'security.journey.privacyOptional' : 'security.journey.privacy')}
                checked={acknowledged}
                disabled={pending}
                onCheckedChange={(value) => setAcknowledged(value === true)}
              />
            )}
            <Button
              type="submit"
              label={t('security.journey.save')}
              loading={pending}
              disabled={
                pending ||
                !/^[a-z0-9][a-z0-9_-]{1,46}[a-z0-9]$/u.test(handle) ||
                !firstName.trim() ||
                !/^#[0-9a-f]{6}$/u.test(color) ||
                (owners.privacy.required(state) && !acknowledged)
              }
            />
          </>,
          async () => {
            const profile = {
              handle,
              firstName: firstName.trim(),
              lastName: lastName.trim() || null,
              avatarColor: color,
              approvedPictureRefId: null,
            }
            const fingerprint = JSON.stringify([state, profile, acknowledged])
            if (privacyCommand.current && privacyCommand.current.fingerprint !== fingerprint)
              throw new Error('security.operation.conflict')
            privacyCommand.current ??= { fingerprint, id: randomUuid7() }
            const original = privacyCommand.current
            if (original.receipt === undefined)
              original.receipt = acknowledged
                ? await owners.privacy.acknowledge(state,controller.current.signal, original.id)
                : null
            if (owners.privacy.required(state) && original.receipt === null)
              throw new Error('security.owner.unavailable')
            const next = await journey.profile(state, profile, original.receipt)
            privacyCommand.current = undefined
            return next
          },
        )}
      {state.kind === 'factor' && (
        <>
          <Text>{t('security.journey.factor')}</Text>
          <Button
            label={t('security.journey.verifyFactor')}
            loading={pending}
            disabled={pending || owners.factor === undefined}
            onClick={() => {
              void run(async () =>
                nextFederationState(
                  await owners.factor!(state.progress, controller.current.signal),
                ),
              )
            }}
          />
        </>
      )}
      {state.kind === 'collision' && (
        <>
          <Text>{t('security.journey.collision')}</Text>
          <Button
            label={t('security.journey.link')}
            loading={pending}
            disabled={pending || owners.linkExisting === undefined}
            onClick={() => {
              void run(async () =>
                nextFederationState(
                  await owners.linkExisting!(state.progress, controller.current.signal),
                ),
              )
            }}
          />
        </>
      )}
      {state.kind === 'invitations' && (
        <FederationInvitationInbox
          client={owners.recipient}
          leave={() => setState(leaveFederationInbox(state))}
        />
      )}
      {state.kind === 'test_completed' && <Text>{t('security.journey.testCompleted')}</Text>}
      {state.kind === 'ready' && (
        <>
          <Text>{t('security.journey.ready')}</Text>
          <Button
            label={t('security.journey.continue')}
            loading={pending}
            disabled={pending || owners.account === undefined}
            onClick={() => {
              void run(async () => {
                const uri = await journey.finish(state, owners.account!)
                if (uri !== null) await navigation(uri)
              })
            }}
          />
          {owners.account === undefined && <Text>{t('security.journey.noSession')}</Text>}
        </>
      )}
      {state.kind === 'rejected' && <Text>{t('security.journey.rejected')}</Text>}
      {failed && (
        <div role="alert">
          <Text>{t('security.journey.retry')}</Text>
        </div>
      )}
      {state.kind !== 'test_completed' && <Button
        label={t('security.journey.cancel')}
        variant="ghost"
        tone="neutral"
        onClick={() => void cancel()}
      />}
    </Stack>
  )
}
