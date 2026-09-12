import { decodeBoundedJsonText } from '../contracts/decode'
import * as generated from '../contracts/runtime-validators.generated.ts'

type RuntimeValidator = ((input: unknown) => boolean) & {
  readonly errors?: readonly unknown[] | null
}

export type ResponseSchemaName =
  | 'protocolError' | 'flowBootstrap' | 'browserAnchor' | 'credentialCapability'
  | 'routeResolution' | 'routeContinuation' | 'credentialAttempt' | 'credentialRegistration'
  | 'credentialAttemptRecovery' | 'accountEstablishment' | 'accounts' | 'accountMetadata'
  | 'accountValidation' | 'accountSelection' | 'accountAuthorization' | 'accountContinuation'
  | 'signupPreparation' | 'signupRegistration' | 'signupContinuation' | 'verifiedSignupTransfer'
  | 'destinationReceipt' | 'authorizationFinalization' | 'signupProgress' | 'signupCompletion'
  | 'emailPreview' | 'emailVerification' | 'recoveryAccepted' | 'recoveryCompleted'
  | 'logoutOptions' | 'logoutAccountMetadata' | 'logoutResult'

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
  accountEstablishment: generated.accountEstablishment,
  accounts: generated.accounts,
  accountMetadata: generated.accountMetadata,
  accountValidation: generated.accountValidation,
  accountSelection: generated.accountSelection,
  accountAuthorization: generated.accountAuthorization,
  accountContinuation: generated.accountContinuation,
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
