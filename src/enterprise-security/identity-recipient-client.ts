import type { IdentityFlow } from '../protocol/client'
import { admitAccountForInbox, recoverFederationEstablishment } from '../protocol/client'
import type { AccountEstablishmentResultV1 } from '../contracts/generated/csi07/AccountEstablishmentResultV1'
import { identityApiForRegion } from '../catalog/boundaries'
import { decodeProtocolResponse, type ResponseSchemaName } from '../protocol/decode'
import { recipientOperations } from '../contracts/generated/authorization-recipient-v1/operations.generated'
import type { RecipientInboxBootstrapResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInboxBootstrapResultV1'
import type { RecipientInvitationDecisionRequestV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationDecisionRequestV1'
import type { RecipientInvitationDetailResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationDetailResultV1'
import type { RecipientInvitationFilterV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationFilterV1'
import type { RecipientInvitationListResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationListResultV1'
import type { RecipientInvitationOperationV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientInvitationOperationV1'

import type { RecipientEmailedEntryRequestV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientEmailedEntryRequestV1'
import type { RecipientEmailedEntryResultV1 } from '../contracts/generated/authorization-recipient-v1/types/RecipientEmailedEntryResultV1'
import { randomUuid7 } from '../protocol/random'

export const recipientIdentityScreens = ['SCR-IDN-009'] as const
export type RecipientIdentityScreen = (typeof recipientIdentityScreens)[number]

export interface IdentityRecipientClient {
  bootstrap(signal: AbortSignal): Promise<RecipientInboxBootstrapResultV1>
  dispose?(): void
  readEmailed?(signal: AbortSignal): Promise<RecipientEmailedEntryResultV1 | undefined>
  list(filter: RecipientInvitationFilterV1, signal: AbortSignal, cursor?: string): Promise<RecipientInvitationListResultV1>
  detail(invitationId: string, signal: AbortSignal): Promise<RecipientInvitationDetailResultV1>
  accept(invitationId: string, request: RecipientInvitationDecisionRequestV1, signal: AbortSignal): Promise<RecipientInvitationOperationV1>
  reject(invitationId: string, request: RecipientInvitationDecisionRequestV1, signal: AbortSignal): Promise<RecipientInvitationOperationV1>
  status(operationId: string, signal: AbortSignal): Promise<RecipientInvitationOperationV1>
}

export class RecipientPreviewError extends Error {
  constructor(readonly code: string) { super(code); this.name = 'RecipientPreviewError' }
}

async function boundedRecipientText(response:Response,maximum=256*1024):Promise<string> {
  const length=response.headers.get('content-length')
  if(length!==null&&(!/^\d+$/u.test(length)||Number(length)>maximum))throw new RecipientPreviewError('authorization.recipient.owner_unavailable')
  if(response.body===null)return ''
  const reader=response.body.getReader();const chunks:Uint8Array[]=[];let bytes=0
  try {
    while(true) {const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength
      if(bytes>maximum)throw new RecipientPreviewError('authorization.recipient.owner_unavailable');chunks.push(part.value)}
  }catch(error) {await reader.cancel().catch(()=>undefined);throw error}
  const result=new Uint8Array(bytes);let offset=0
  for(const chunk of chunks) {result.set(chunk,offset);offset+=chunk.byteLength}
  return new TextDecoder('utf-8',{fatal:true}).decode(result)
}
function invitationPath(operation:'accept'|'reject'|'detail',id:string):string {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(id))throw new RecipientPreviewError('authorization.recipient.not_found')
  return recipientOperations[operation].path.replace('{invitationId}',encodeURIComponent(id))
}
/** Account/flow-scoped supplier. It retains no bearer outside this instance,
 * does not retry decisions, and never forwards a bearer to an unlisted origin. */
export function identityRecipientClient(flow:IdentityFlow,establishment?:AccountEstablishmentResultV1,selectedBrowserAccountId?:string):IdentityRecipientClient {
  let account:{browserAccountId:string}|undefined
  let emailedReceipt:RecipientEmailedEntryResultV1|undefined
  let emailedMutationId:string|undefined
  let emailedReadDeadline:number|undefined
  const emailedDecisions=new Map<string,{id:string;version:string;kind:string}>()
  let delegation:RecipientInboxBootstrapResultV1|undefined
  let bootstrapInFlight:Promise<RecipientInboxBootstrapResultV1>|undefined
  let lifetime=new AbortController()
  let attached=false
  const stop=()=>{lifetime.abort();window.removeEventListener('pagehide',stop);attached=false;account=undefined;delegation=undefined;emailedReceipt=undefined;emailedDecisions.clear();bootstrapInFlight=undefined}
  async function bootstrap(signal:AbortSignal):Promise<RecipientInboxBootstrapResultV1> {
    signal.throwIfAborted()
    // Explicit bootstrap can establish a new mounted scope after cleanup
    // (including React's development effect replay). Old work keeps its own
    // aborted generation and cannot republish capability custody.
    if(lifetime.signal.aborted)lifetime=new AbortController()
    const scope=lifetime
    scope.signal.throwIfAborted()
    if(!attached) {attached=true;window.addEventListener('pagehide',stop,{once:true})}
    if(delegation!==undefined&&Date.parse(delegation.expiresAt)>Date.now()+1000)return delegation
    if(bootstrapInFlight!==undefined) {const result=await bootstrapInFlight;signal.throwIfAborted();scope.signal.throwIfAborted();return result}
    const work=(async()=>{
      if(account===undefined) {
        const combined=AbortSignal.any([signal,scope.signal])
        const admitted=selectedBrowserAccountId===undefined
          ? await admitAccountForInbox(flow,establishment ?? await recoverFederationEstablishment(flow,combined),combined)
          : {browserAccountId:selectedBrowserAccountId}
        signal.throwIfAborted();scope.signal.throwIfAborted()
        account=admitted
      }
      signal.throwIfAborted();scope.signal.throwIfAborted()
      const result=await flow.controller.post<unknown,RecipientInboxBootstrapResultV1>(recipientOperations.bootstrap.path,
        {schemaVersion:1,browserAccountId:account.browserAccountId,head:{browserHeadId:flow.head.browserHeadId,
          browserInitializationId:flow.head.browserInitializationId,placement:flow.head.placement}},'recipientBootstrap')
      signal.throwIfAborted();scope.signal.throwIfAborted()
      identityApiForRegion(flow.catalog,result.route.homeRegionId,result.route.identityApiOrigin)
      if(!Number.isFinite(Date.parse(result.expiresAt))||Date.parse(result.expiresAt)<=Date.now()
        ||Date.parse(result.expiresAt)>Date.now()+60_000)throw new RecipientPreviewError('authorization.recipient.capability_expired')
      delegation=result;return result
    })()
    bootstrapInFlight=work
    try {return await work}finally {if(bootstrapInFlight===work)bootstrapInFlight=undefined}
  }
  async function request<T>(path:string,method:'GET'|'POST',schema:ResponseSchemaName,signal:AbortSignal,body?:RecipientInvitationDecisionRequestV1|RecipientEmailedEntryRequestV1):Promise<T> {
    signal.throwIfAborted();lifetime.signal.throwIfAborted()
    const scope=lifetime
    const current=await bootstrap(signal)
    signal.throwIfAborted();scope.signal.throwIfAborted()
    const home=identityApiForRegion(flow.catalog,current.route.homeRegionId,current.route.identityApiOrigin)
    const serialized=body===undefined?undefined:JSON.stringify(body)
    if(serialized!==undefined)decodeProtocolResponse('sourceRegionId' in body!?'recipientEmailedEntryRequest':'recipientDecision',serialized,2048)
    const response=await fetch(new URL(path,home.origin),{method,body:serialized,credentials:'omit',redirect:'error',mode:'cors',cache:'no-store',referrerPolicy:'no-referrer',
      signal:AbortSignal.any([signal,scope.signal,AbortSignal.timeout(20_000)]),headers:{'X-Metamorph-Recipient-Capability':current.recipientCapability,'X-Metamorph-CSRF':current.csrfToken,
        ...(body===undefined?{}:{'Content-Type':'application/json','Idempotency-Key':body.mutationId})}})
    const text=await boundedRecipientText(response)
    signal.throwIfAborted();scope.signal.throwIfAborted()
    if(response.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new RecipientPreviewError('authorization.recipient.owner_unavailable')
    if(response.status!==200&&response.status!==202) {
      // Error payloads cannot introduce free text, routes or arbitrary codes.
      const code=response.status===404?'authorization.recipient.not_found':response.status===409?'authorization.recipient.conflict':'authorization.recipient.owner_unavailable'
      throw new RecipientPreviewError(code)
    }
    return decodeProtocolResponse<T>(schema,text)
  }
  async function readEmailed(signal:AbortSignal):Promise<RecipientEmailedEntryResultV1|undefined> {
    const entry=flow.bootstrap.emailedInvitation
    if(entry===null||entry===undefined)return undefined
    if(Date.parse(entry.expiresAt)<=Date.now())throw new RecipientPreviewError('authorization.recipient.capability_expired')
    if(emailedReceipt!==undefined&&Date.parse(emailedReceipt.expiresAt)>Date.now()+1000)return emailedReceipt
    // Only an observed original deadline allows a new read. Ambiguous reads
    // retain their original command, including mounted effect replay.
    if(emailedReadDeadline!==undefined&&emailedReadDeadline<=Date.now()) {
      emailedReceipt=undefined;emailedMutationId=undefined;emailedReadDeadline=undefined
    }
    emailedMutationId??=randomUuid7()
    const result=await request<RecipientEmailedEntryResultV1>(recipientOperations.emailedEntry.path,'POST','recipientEmailedEntry',signal,
      {schemaVersion:1,mutationId:emailedMutationId,invitationId:entry.invitationId,sourceRegionId:entry.sourceRegionId,emailedToken:entry.emailedToken})
    signal.throwIfAborted();lifetime.signal.throwIfAborted()
    if(result.entryId!==emailedMutationId||result.invitation.invitationId!==entry.invitationId
      ||Date.parse(result.expiresAt)<=Date.now()||Date.parse(result.expiresAt)>Date.now()+60_000
      )throw new RecipientPreviewError('authorization.recipient.conflict')
    const bounded={...result,expiresAt:new Date(Math.min(Date.parse(result.expiresAt),Date.parse(entry.expiresAt))).toISOString()}
    emailedReadDeadline=Date.parse(bounded.expiresAt);emailedReceipt=bounded;return bounded
  }
  function decision(id:string,body:RecipientInvitationDecisionRequestV1,kind:'accept'|'reject',signal:AbortSignal):Promise<RecipientInvitationOperationV1> {
    const entry=flow.bootstrap.emailedInvitation
    if(entry!==null&&entry!==undefined&&id===entry.invitationId) {
      const prior=emailedDecisions.get(body.mutationId)
      if(Date.parse(entry.expiresAt)<=Date.now()||(body.emailedToken!=null&&body.emailedToken!==entry.emailedToken)
        ||(prior!==undefined&&(prior.id!==id||prior.version!==body.expected.invitationVersion||prior.kind!==kind)))
        return Promise.reject(new RecipientPreviewError('authorization.recipient.conflict'))
      if(prior===undefined) {
        if(emailedReceipt===undefined||emailedReceipt.invitation.invitationVersion!==body.expected.invitationVersion
          ||Date.parse(emailedReceipt.expiresAt)<=Date.now()||emailedDecisions.size>=64)
          return Promise.reject(new RecipientPreviewError('authorization.recipient.capability_expired'))
        emailedDecisions.set(body.mutationId,{id,version:body.expected.invitationVersion,kind})
      }
      // An ambiguous command may recover after the reader's original deadline;
      // the native journal admits only its exact original body and never renews it.
      return request<RecipientInvitationOperationV1>(invitationPath(kind,id),'POST','recipientOperation',signal,{...body,emailedToken:entry.emailedToken})
        .then(result=>{emailedDecisions.delete(body.mutationId);return result})
    }
    return request(invitationPath(kind,id),'POST','recipientOperation',signal,body)
  }
  return {
    bootstrap,
    readEmailed,
    dispose:stop,
    list:(filter,signal,cursor)=>{
      if(cursor!==undefined&&!/^[A-Za-z0-9_-]{16,1024}$/u.test(cursor))return Promise.reject(new RecipientPreviewError('authorization.recipient.conflict'))
      const query=new URLSearchParams({state:filter})
      if(cursor!==undefined)query.set('cursor',cursor)
      return request(`${recipientOperations.list.path}?${query}`,'GET','recipientList',signal)
    },
    detail:(id,signal)=>request(invitationPath('detail',id),'GET','recipientDetail',signal),
    accept:(id,body,signal)=>decision(id,body,'accept',signal),
    reject:(id,body,signal)=>decision(id,body,'reject',signal),
    status:(id,signal)=>{
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(id))return Promise.reject(new RecipientPreviewError('authorization.recipient.not_found'))
      return request(recipientOperations.status.path.replace('{operationId}',encodeURIComponent(id)),'GET','recipientOperation',signal)
    },
  }
}
