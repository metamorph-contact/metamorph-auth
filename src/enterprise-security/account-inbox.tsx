import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Stack, Text } from '@polymorph/ui/identity'
import type { IdentityFlow, DisplayAccount } from '../protocol/client'
import type { AccountEstablishmentResultV1 } from '../contracts/generated/csi07/AccountEstablishmentResultV1'
import { continueAccountEstablishment, chooseAccount } from '../protocol/client'
import { identityRecipientClient } from './identity-recipient-client'
import { FederationInvitationInbox } from './federation-inbox'
import i18n from '../i18n'
import { randomUuid7 } from '../protocol/random'
import en from '../i18n/locales/en/enterprise-security.json'
i18n.addResourceBundle('en', 'enterprise-security', en)

/** The actual H outcome admits an identity account before any product/target
 * grant. Invitation decisions remain with the existing recipient owner. */
export function AccountInvitationInbox({ flow, establishment, navigation, release }: {
  flow: IdentityFlow; establishment: AccountEstablishmentResultV1
  navigation: (uri: string) => Promise<void>
  release: () => void
}) {
  const { t } = useTranslation('enterprise-security')
  const client = useMemo(() => identityRecipientClient(flow, establishment), [flow, establishment])
  const [expired, setExpired] = useState(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const busy = useRef(false)
  const lifetime = useRef(new AbortController())
  const lifecycle = useRef(0)
  const releaseOwner = useRef(release)
  releaseOwner.current = release
  useEffect(() => {
    const generation = ++lifecycle.current
    lifetime.current = new AbortController()
    const stop = () => { lifetime.current.abort(); client.dispose?.(); setExpired(true); releaseOwner.current() }
    const expiry = 'expiresAt' in establishment
      ? Math.min(Date.parse(establishment.expiresAt), Date.parse(flow.bootstrap.expiresAt)) : 0
    const timer = window.setTimeout(stop, Math.max(0, expiry - Date.now()))
    window.addEventListener('pagehide', stop)
    return () => {
      lifetime.current.abort()
      client.dispose?.()
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', stop)
      queueMicrotask(()=>{if(lifecycle.current===generation)releaseOwner.current()})
    }
  }, [client, establishment, flow])
  const leave = async () => {
    if (busy.current || expired) return
    busy.current = true
    setPending(true)
    setFailed(false)
    const signal = lifetime.current.signal
    try {
      // Admission must complete even when the user explicitly skips display.
      await client.bootstrap(signal)
      const uri = await continueAccountEstablishment(flow, establishment)
      signal.throwIfAborted()
      if (uri === null) throw new Error('security.owner.unavailable')
      await navigation(uri)
    } catch {
      if (!signal.aborted) { setFailed(true); setPending(false) }
    } finally { busy.current = false }
  }
  if (expired) return <Text>{t('security.journey.expired')}</Text>
  return <Stack>
    <FederationInvitationInbox client={client} leave={() => void leave()} disabled={pending} />
    {failed && <><Text>{t('security.journey.unavailable')}</Text>
      <Button label={t('security.journey.retryButton')} disabled={pending} onClick={() => void leave()} /></>}
    {pending && <Text>{t('security.journey.loading')}</Text>}
  </Stack>
}

/** Existing account selection admits the current C capsule for inbox reads.
 * Product continuation still performs the ordinary current H validation. */
export function SelectedAccountInvitationInbox({flow,selected,navigation,release}:{
  flow:IdentityFlow;selected:DisplayAccount;navigation:(uri:string)=>Promise<void>;release:()=>void
}) {
  const {t}=useTranslation('enterprise-security')
  const client=useMemo(()=>identityRecipientClient(flow,undefined,selected.reference.browserAccountId),[flow,selected])
  const [pending,setPending]=useState(false);const [failed,setFailed]=useState(false);const [expired,setExpired]=useState(false)
  const lifetime=useRef(new AbortController());const generation=useRef(0);const busy=useRef(false)
  const attempt=useRef<string|undefined>(undefined);const releaseOwner=useRef(release);releaseOwner.current=release
  useEffect(()=>{
    const scope=++generation.current;lifetime.current=new AbortController()
    const stop=()=>{lifetime.current.abort();client.dispose?.();setExpired(true);releaseOwner.current()}
    const expiry=Math.min(Date.parse(flow.bootstrap.expiresAt),Date.parse(flow.bootstrap.emailedInvitation?.expiresAt??flow.bootstrap.expiresAt))
    const timer=window.setTimeout(stop,Math.max(0,expiry-Date.now()));window.addEventListener('pagehide',stop)
    return ()=>{window.clearTimeout(timer);window.removeEventListener('pagehide',stop);lifetime.current.abort();client.dispose?.()
      queueMicrotask(()=>{if(generation.current===scope)releaseOwner.current()})}
  },[flow,client])
  const leave=async()=>{
    if(busy.current||expired)return;busy.current=true;setPending(true);setFailed(false)
    const signal=lifetime.current.signal
    try {
      await client.bootstrap(signal);signal.throwIfAborted();attempt.current??=randomUuid7()
      const uri=await chooseAccount(flow,selected,attempt.current);signal.throwIfAborted()
      if(uri===null)throw new Error('security.owner.unavailable');await navigation(uri)
    }catch {if(!signal.aborted){setFailed(true);setPending(false)}}finally{busy.current=false}
  }
  if(expired)return <Text>{t('security.journey.expired')}</Text>
  return <Stack><FederationInvitationInbox client={client} leave={()=>void leave()} disabled={pending}/>
    {failed&&<><Text>{t('security.journey.unavailable')}</Text><Button label={t('security.journey.retryButton')} disabled={pending} onClick={()=>void leave()}/></>}
  </Stack>
}
