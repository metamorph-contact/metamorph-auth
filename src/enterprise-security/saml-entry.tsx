import { Button, FormField, Input, Stack, Text } from '@polymorph/ui/identity'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IdentityFlow } from '../protocol/client'
import { prepareFederationAttempt, recoverFederationEstablishment, cancelIdentityFlow, randomSecret32 } from '../protocol/client'
import type { AccountEstablishmentResultV1 } from '../contracts/generated/csi07/AccountEstablishmentResultV1'
import { AccountInvitationInbox } from './account-inbox'
import { clearFederationReturn } from '../security/session-receipts'
import { identityApiForRegion } from '../catalog/boundaries'
import { consumeAuthFragmentOnce, discardConsumedAuthFragment } from '../security/fragment'
import { identityFederationClient } from './federation-client'
import { identityRecipientClient } from './identity-recipient-client'
import { FederationJourney, type FederationJourneyState } from './federation-journey'
import { FederationJourneyPanel, type FederationPanelOwners } from './federation-panel'
import i18n from '../i18n'
import en from '../i18n/locales/en/enterprise-security.json'
i18n.addResourceBundle('en', 'enterprise-security', en)

/** P has produced the actual start and C has admitted its current cookie-backed
 * flow. A typed bootstrap carries opaque original assertion custody only. */
export function SamlHandoffFlowPanel({ flow, navigation }: {
  flow: IdentityFlow; navigation: (uri: string) => Promise<void>
}) {
  const { t } = useTranslation('enterprise-security')
  const custody = useMemo(() => ({ handoff: flow.bootstrap.samlHandoff ?? undefined,
    journey: undefined as FederationJourney | undefined }), [flow])
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FederationJourneyState>()
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [expired, setExpired] = useState(!custody.handoff)
  const [establishment, setEstablishment] = useState<AccountEstablishmentResultV1>()
  const controller = useRef(new AbortController())
  const lifecycle = useRef(0)
  const busy = useRef(false)
  useEffect(() => {
    const generation = ++lifecycle.current
    controller.current = new AbortController()
    const scrub = () => {
      controller.current.abort()
      if (custody.handoff) custody.handoff.handoffProof = ''
      flow.bootstrap.samlHandoff = null
      custody.handoff = undefined
      custody.journey?.stop()
      setEmail('')
      setState(undefined)
      setExpired(true)
    }
    const duration = custody.handoff ? Math.min(Date.parse(custody.handoff.expiresAt),
      Date.parse(flow.bootstrap.expiresAt), Date.parse(flow.catalog.projection.expiresAt)) - Date.now() : 0
    const timer = window.setTimeout(() => { if (custody.handoff) scrub() }, Math.max(0, duration))
    window.addEventListener('pagehide', scrub)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', scrub)
      controller.current.abort()
      queueMicrotask(() => { if (lifecycle.current === generation) scrub() })
    }
  }, [custody, flow])
  const cancelAttempt = useMemo(()=>randomSecret32(),[flow])
  const owners = useMemo<FederationPanelOwners>(() => ({
    cancel:()=>cancelIdentityFlow(flow,cancelAttempt),
    recipient: identityRecipientClient(flow),
    account: {
      establishment: (_progress, _command, signal) => recoverFederationEstablishment(flow, signal),
      continueAccount: async result => { setEstablishment(result); return null },
    },
    privacy: {
      required: value => value.privacyPolicy?.purpose === 'required_notice',
      acknowledge: (value, signal, command) => {
        const journey = custody.journey
        if (!journey) throw new Error('security.owner.unavailable')
        return journey.acknowledgePrivacy(value, signal, command)
      },
    },
  }), [flow, custody, cancelAttempt])
  const begin = async () => {
    if (busy.current || !custody.handoff || expired) return
    busy.current = true
    setPending(true)
    setFailed(false)
    const signal = controller.current.signal
    try {
      await prepareFederationAttempt(flow, email)
      signal.throwIfAborted()
      const handoff = custody.handoff
      if (!handoff || Date.parse(handoff.expiresAt) <= Date.now()) throw new Error('security.ceremony.expired')
      identityApiForRegion(flow.catalog, handoff.providerRegionId)
      custody.journey ??= new FederationJourney(flow.bootstrap.flowId, flow.catalog.projection.clientId,
        identityFederationClient(flow, handoff.providerRegionId), flow.bootstrap.expiresAt)
      const result = await custody.journey.redeem(handoff.handoffProof, flow.bootstrap.flowId)
      signal.throwIfAborted()
      handoff.handoffProof = ''
      custody.handoff = undefined
      setEmail('')
      setState(result)
    } catch {
      if (!signal.aborted) setFailed(true)
    } finally {
      busy.current = false
      if (!signal.aborted) setPending(false)
    }
  }
  if (establishment) return <AccountInvitationInbox flow={flow} establishment={establishment}
    release={()=>{setEstablishment(undefined);setState({kind:'rejected'})}}
    navigation={async uri=>{await navigation(uri);clearFederationReturn()}} />
  if (state && custody.journey) return <FederationJourneyPanel journey={custody.journey}
    initial={state} owners={owners} navigation={navigation} />
  if (expired) return <Text>{t('security.journey.expired')}</Text>
  return <form onSubmit={event => { event.preventDefault(); void begin() }}><Stack>
    <Text>{t('security.journey.samlEmailDescription')}</Text>
    <FormField id="saml-entry-email" label={t('security.journey.email')} required>
      <Input type="email" maxLength={254} autoComplete="email" value={email} disabled={pending} onChange={setEmail} />
    </FormField>
    {failed && <Text>{t('security.journey.unavailable')}</Text>}
    <Button type="submit" label={t('security.journey.continue')} loading={pending}
      disabled={pending || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)} />
  </Stack></form>
}

/** Bare handoff fragments do not supply a product start. Actual unsolicited
 * entry uses the registered P entry above before reaching the identity flow. */
export function SamlHandoffEntryPage() {
  const { t } = useTranslation('enterprise-security')
  useMemo(() => {
    try { consumeAuthFragmentOnce() } catch { /* invalid entry remains closed */ }
    finally { discardConsumedAuthFragment() }
  }, [])
  return <Text>{t('security.journey.expired')}</Text>
}
