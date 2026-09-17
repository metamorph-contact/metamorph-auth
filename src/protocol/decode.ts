import { decodeBoundedJsonText } from '../contracts/decode'
import * as generated from '../contracts/runtime-validators.generated.ts'

type RuntimeValidator = ((input: unknown) => boolean) & {
  readonly errors?: readonly unknown[] | null
}

export type ResponseSchemaName =
  | 'protocolError' | 'flowBootstrap' | 'browserAnchor' | 'credentialCapability'
  | 'routeResolution' | 'routeContinuation' | 'credentialAttempt' | 'credentialRegistration'
  | 'credentialAttemptRecovery' | 'credentialPreparationRecovery' | 'accountEstablishment' | 'accounts' | 'accountMetadata'
  | 'accountValidation' | 'accountSelection' | 'accountAuthorization' | 'accountContinuation' | 'providerRuntimeTestFlow'
  | 'strongActionDelegation'
  | 'signupPreparation' | 'signupRegistration' | 'signupContinuation' | 'verifiedSignupTransfer'
  | 'destinationReceipt' | 'authorizationFinalization' | 'signupProgress' | 'signupCompletion'
  | 'emailPreview' | 'emailVerification' | 'recoveryAccepted' | 'recoveryCompleted'
  | 'logoutOptions' | 'logoutAccountMetadata' | 'logoutResult' | 'productBootstrap'
  | 'recipientAccountAdmission' | 'recipientBootstrap' | 'recipientList' | 'recipientDetail' | 'recipientOperation' | 'recipientDecision' | 'recipientEmailedEntryRequest' | 'recipientEmailedEntry'
  | 'profileActivity'

const validators = {
  protocolError: generated.protocolError,
  flowBootstrap: generated.flowBootstrap,
  browserAnchor: generated.browserAnchor,
  credentialCapability: generated.credentialCapability,
  routeResolution: generated.routeResolution,
  routeContinuation: generated.routeContinuation,
  credentialAttempt: generated.credentialAttempt,
  credentialRegistration: generated.credentialRegistration,
  credentialAttemptRecovery: generated.credentialAttemptRecovery,
  credentialPreparationRecovery: generated.credentialPreparationRecovery,
  accountEstablishment: generated.accountEstablishment,
  accounts: generated.accounts,
  accountMetadata: generated.accountMetadata,
  accountValidation: generated.accountValidation,
  accountSelection: generated.accountSelection,
  accountAuthorization: generated.accountAuthorization,
  providerRuntimeTestFlow: generated.providerRuntimeTestFlow,
  strongActionDelegation: generated.strongActionDelegation,
  accountContinuation: generated.accountContinuation,
  recipientAccountAdmission: generated.recipientAccountAdmission,
  recipientBootstrap: generated.recipientBootstrap,
  recipientList: generated.recipientList,
  recipientDetail: generated.recipientDetail,
  recipientOperation: generated.recipientOperation,
  recipientDecision: generated.recipientDecision,
  recipientEmailedEntryRequest: generated.recipientEmailedEntryRequest,
  recipientEmailedEntry: generated.recipientEmailedEntry,
  profileActivity: generated.profileActivity,
  signupPreparation: generated.signupPreparation,
  signupRegistration: generated.signupRegistration,
  signupContinuation: generated.signupContinuation,
  verifiedSignupTransfer: generated.verifiedSignupTransfer,
  destinationReceipt: generated.destinationReceipt,
  authorizationFinalization: generated.authorizationFinalization,
  signupProgress: generated.signupProgress,
  signupCompletion: generated.signupCompletion,
  emailPreview: generated.emailPreview,
  emailVerification: generated.emailVerification,
  recoveryAccepted: generated.recoveryAccepted,
  recoveryCompleted: generated.recoveryCompleted,
  logoutOptions: generated.logoutOptions,
  logoutAccountMetadata: generated.logoutAccountMetadata,
  logoutResult: generated.logoutResult,
  productBootstrap: generated.productBootstrap,
} as unknown as Readonly<Record<ResponseSchemaName, RuntimeValidator>>

export function decodeProtocolResponse<T>(name: ResponseSchemaName, text: string, maxBytes = 256 * 1024): T {
  const input = decodeBoundedJsonText(text, maxBytes)
  if (typeof input !== 'object' || input === null || !('schemaVersion' in input) || input.schemaVersion !== 1) {
    throw new Error(`Unsupported ${name} schema version`)
  }
  const validator = validators[name]
  if (!validator(input)) throw new Error(`Invalid ${name} response`)
  return Object.freeze(input) as T
}
