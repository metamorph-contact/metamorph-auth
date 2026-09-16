import {useEffect,useMemo,useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button,Stack,Text} from '@polymorph/ui/identity'
import type {IdentityFlow} from '../protocol/client'
import {recoverFederationEstablishment,cancelIdentityFlow,randomSecret32} from '../protocol/client'
import type {AccountEstablishmentResultV1} from '../contracts/generated/csi07/AccountEstablishmentResultV1'
import {AccountInvitationInbox} from './account-inbox'
import type {FederationReturnFragment} from '../security/fragment'
import {clearFederationReturn} from '../security/session-receipts'
import {identityFederationClient} from './federation-client'
import {FederationJourney,type FederationJourneyState} from './federation-journey'
import {FederationJourneyPanel,type FederationPanelOwners} from './federation-panel'
import {identityRecipientClient} from './identity-recipient-client'
import i18n from '../i18n'
import en from '../i18n/locales/en/enterprise-security.json'
i18n.addResourceBundle('en','enterprise-security',en)

/** The fragment contains advisory identifiers. Current C cookie/CSRF and I's
 * independent return cookie supply every actual admission and recovery. */
export function FederationReturnPanel({flow,fragment,navigation}:{
  flow:IdentityFlow;fragment:FederationReturnFragment;navigation:(uri:string)=>Promise<void>
}) {
  const {t}=useTranslation('enterprise-security')
  const journey=useMemo(()=>new FederationJourney(flow.bootstrap.flowId,flow.catalog.projection.clientId,
    identityFederationClient(flow,fragment.issuer),flow.bootstrap.expiresAt),[flow,fragment.issuer])
  const [state,setState]=useState<FederationJourneyState>()
  const [failed,setFailed]=useState(false)
  const [retry,setRetry]=useState(0)
  const [establishment,setEstablishment]=useState<AccountEstablishmentResultV1>()
  useEffect(()=>()=>journey.stop(),[journey])
  useEffect(()=>{
    let mounted=true
    const hide=()=>journey.stop()
    window.addEventListener('pagehide',hide)
    setFailed(false)
    void journey.resume(fragment.attempt,fragment.provider).then(result=>{
      if(mounted)setState(result)
    }).catch(()=>{if(mounted)setFailed(true)})
    return()=>{mounted=false;window.removeEventListener('pagehide',hide)}
  },[journey,fragment.attempt,fragment.provider,retry])
  const cancelAttempt=useMemo(()=>randomSecret32(),[flow])
  const owners=useMemo<FederationPanelOwners>(()=>({
    cancel:()=>cancelIdentityFlow(flow,cancelAttempt),
    recipient:identityRecipientClient(flow),
    account:{
      establishment:async(progress,_command,signal)=>{
        if(progress.continuationId!==fragment.attempt||Date.parse(progress.expiresAt)>Date.parse(flow.bootstrap.expiresAt))throw new Error('security.ceremony.mismatch')
        return recoverFederationEstablishment(flow,signal)
      },
      continueAccount:async(result)=>{
        setEstablishment(result)
        return null
      },
    },
    privacy:{required:state=>state.privacyPolicy?.purpose==='required_notice',
      acknowledge:(state,signal,command)=>journey.acknowledgePrivacy(state,signal,command)},
  }),[flow,fragment.attempt,journey,cancelAttempt])
  if(establishment!==undefined)return <AccountInvitationInbox flow={flow} establishment={establishment}
    release={()=>{setEstablishment(undefined);setState({kind:'rejected'})}}
    navigation={async uri=>{await navigation(uri);clearFederationReturn()}}/>
  if(state!==undefined)return <FederationJourneyPanel journey={journey} initial={state} owners={owners} navigation={navigation}/>
  return <Stack>{failed&&<><Text>{t('security.journey.unavailable')}</Text>
    <Button label={t('security.journey.retryButton')} onClick={()=>setRetry(value=>value+1)}/></>}</Stack>
}
