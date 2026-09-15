import { AuthPage, Button, Text } from '@polymorph/ui/identity'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IdentityFlow } from '../protocol/client'
import { consumeAuthFragmentOnce, discardConsumedAuthFragment } from '../security/fragment'
import { identityApiForRegion } from '../catalog/boundaries'
import { identityFederationClient } from './federation-client'
import { FederationJourney, live, type FederationJourneyState } from './federation-journey'
import { FederationJourneyPanel, type FederationPanelOwners } from './federation-panel'
import { randomUuid7 } from '../protocol/random'
import i18n from '../i18n'
import en from '../i18n/locales/en/enterprise-security.json'
i18n.addResourceBundle('en', 'enterprise-security', en)

type AdmittedHandoff = {
  flow: IdentityFlow
  owners: FederationPanelOwners
  navigate: (uri: string) => Promise<void>
}
export interface SamlHandoffFlowOwner {
  /** Recover the same actual fresh CSI flow for this original command from an
   * admitted server-side registration/start proof. A region hint grants nothing. */
  begin(providerRegionId: string, commandId: string, signal: AbortSignal): Promise<AdmittedHandoff>
}
let entryOwner: SamlHandoffFlowOwner | undefined
export function configureSamlHandoffFlowOwner(owner: SamlHandoffFlowOwner): void {
  entryOwner = owner
}
export function SamlHandoffEntryPage() {
  const { t } = useTranslation('enterprise-security')
  const ingress = useMemo(() => {
    try {
      const value = consumeAuthFragmentOnce()
      if (value.kind !== 'samlHandoff') return undefined
      const memory: {
        proof?: string
        region: string
        commandId: string
        deadline: number
        admitted?: AdmittedHandoff
        journey?: FederationJourney
      } = {
        proof: value.handoffProof,
        region: value.providerRegionId,
        commandId: randomUuid7(),
        deadline: Date.now() + 2 * 60_000,
      }
      return memory
    } catch {
      return undefined
    }
  }, [])
  const [ready, setReady] = useState<{
    journey: FederationJourney
    state: FederationJourneyState
    owners: FederationPanelOwners
    navigate: (uri: string) => Promise<void>
  }>()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const lifecycle = useRef(0)
  useEffect(() => {
    const generation = ++lifecycle.current
    const controller = new AbortController()
    let timer: number | undefined
    const scrub = () => {
      window.clearTimeout(timer)
      controller.abort()
      ingress?.journey?.stop()
      if (ingress) {
        ingress.proof = undefined
        ingress.admitted = undefined
        ingress.journey = undefined
      }
      discardConsumedAuthFragment()
      setReady(undefined)
      setFailed(true)
    }
    const boundCustody = () => {
      window.clearTimeout(timer)
      if (!ingress?.proof) return
      const remaining = ingress.deadline - Date.now()
      if (remaining <= 0) {
        scrub()
        return
      }
      timer = window.setTimeout(scrub, remaining)
    }
    boundCustody()
    queueMicrotask(() => {
      if (controller.signal.aborted) return
      discardConsumedAuthFragment()
      if (!entryOwner && ingress) ingress.proof = undefined
      setFailed(false)
      void (async () => {
        const owner = entryOwner
        if (!ingress?.proof || !owner) throw new Error('security.owner.unavailable')
        ingress.admitted ??= await owner.begin(ingress.region, ingress.commandId, controller.signal)
        controller.signal.throwIfAborted()
        const admitted = ingress.admitted
        ingress.deadline = Math.min(
          ingress.deadline,
          Date.parse(admitted.flow.bootstrap.expiresAt),
          Date.parse(admitted.flow.catalog.projection.expiresAt),
        )
        boundCustody()
        controller.signal.throwIfAborted()
        live(admitted.flow.bootstrap.expiresAt)
        live(admitted.flow.catalog.projection.expiresAt)
        identityApiForRegion(admitted.flow.catalog, ingress.region)
        ingress.journey ??= new FederationJourney(
          admitted.flow.bootstrap.flowId,
          admitted.flow.catalog.projection.clientId,
          identityFederationClient(admitted.flow, ingress.region),
          admitted.flow.bootstrap.expiresAt,
        )
        const state = await ingress.journey.redeem(ingress.proof)
        controller.signal.throwIfAborted()
        ingress.proof = undefined
        window.clearTimeout(timer)
        setReady({
          journey: ingress.journey,
          state,
          owners: admitted.owners,
          navigate: admitted.navigate,
        })
      })().catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    })
    window.addEventListener('pagehide', scrub)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', scrub)
      controller.abort()
      queueMicrotask(() => {
        // StrictMode's replay precedes this microtask; real unmount erases custody.
        if (lifecycle.current === generation) {
          ingress?.journey?.stop()
          if (ingress) {
            ingress.proof = undefined
            ingress.admitted = undefined
            ingress.journey = undefined
          }
        }
      })
    }
  }, [ingress, attempt])
  return (
    <div className="identity-shell">
      <AuthPage title={t('security.journey.samlTitle')} pending={!ready && !failed}>
        {ready ? (
          <FederationJourneyPanel
            journey={ready.journey}
            initial={ready.state}
            owners={ready.owners}
            navigation={ready.navigate}
          />
        ) : failed ? (
          <>
            <Text>{t('security.journey.unavailable')}</Text>
            {entryOwner && ingress?.proof && (
              <Button
                label={t('security.journey.continue')}
                onClick={() => setAttempt((v) => v + 1)}
              />
            )}
          </>
        ) : (
          <Text>{t('security.journey.loading')}</Text>
        )}
      </AuthPage>
    </div>
  )
}
