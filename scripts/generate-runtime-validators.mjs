import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import Ajv2020 from 'ajv/dist/2020.js'
import standaloneCode from 'ajv/dist/standalone/index.js'
import addFormats from 'ajv-formats'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(root, 'src/contracts/runtime-validators.generated.ts')
const schemas = {
  catalogProjection: 'src/contracts/schemas/signed-auth-projection-v1.schema.json',
  browserKeySet: 'src/contracts/schemas/signed-browser-verification-key-set-v1.schema.json',
  protocolError: 'src/contracts/schemas/csi07/protocol-error-envelope-v1.schema.json',
  flowBootstrap: 'src/contracts/schemas/csi07/flow-bootstrap-v1.schema.json',
  browserAnchor: 'src/contracts/schemas/csi07/browser-anchor-result-v1.schema.json',
  credentialCapability: 'src/contracts/schemas/csi07/credential-capability-result-v1.schema.json',
  routeResolution: 'src/contracts/schemas/csi07/credential-route-resolution-v1.schema.json',
  routeContinuation: 'src/contracts/schemas/csi07/credential-route-continuation-result-v1.schema.json',
  credentialAttempt: 'src/contracts/schemas/csi07/credential-attempt-result-v1.schema.json',
  credentialRegistration: 'src/contracts/schemas/csi07/credential-attempt-registration-result-v1.schema.json',
  credentialAttemptRecovery: 'src/contracts/schemas/csi07/credential-attempt-recovery-result-v1.schema.json',
  credentialPreparationRecovery: 'src/contracts/schemas/csi07/credential-preparation-recovery-result-v1.schema.json',
  accountEstablishment: 'src/contracts/schemas/csi07/account-establishment-result-v1.schema.json',
  accounts: 'src/contracts/schemas/csi07/accounts-result-v1.schema.json',
  accountMetadata: 'src/contracts/schemas/csi07/account-metadata-result-v1.schema.json',
  accountValidation: 'src/contracts/schemas/csi07/account-validation-result-v1.schema.json',
  accountSelection: 'src/contracts/schemas/csi07/account-selection-result-v1.schema.json',
  accountAuthorization: 'src/contracts/schemas/csi07/account-authorization-result-v1.schema.json',
  providerRuntimeTestFlow: 'src/contracts/schemas/csi07/provider-runtime-test-flow-result-v1.schema.json',
  strongActionDelegation: 'src/contracts/schemas/csi07/strong-action-delegation-result-v1.schema.json',
  accountContinuation: 'src/contracts/schemas/csi07/account-continuation-result-v1.schema.json',
  recipientAccountAdmission: 'src/contracts/schemas/csi07/recipient-account-admission-v1.schema.json',
  recipientBootstrap: 'src/contracts/schemas/authorization-recipient-v1/RecipientInboxBootstrapResultV1.schema.json',
  recipientList: 'src/contracts/schemas/authorization-recipient-v1/RecipientInvitationListResultV1.schema.json',
  recipientDetail: 'src/contracts/schemas/authorization-recipient-v1/RecipientInvitationDetailResultV1.schema.json',
  recipientOperation: 'src/contracts/schemas/authorization-recipient-v1/RecipientInvitationOperationV1.schema.json',
  recipientEmailedEntryRequest: 'src/contracts/schemas/authorization-recipient-v1/RecipientEmailedEntryRequestV1.schema.json',
  recipientEmailedEntry: 'src/contracts/schemas/authorization-recipient-v1/RecipientEmailedEntryResultV1.schema.json',
  recipientDecision: 'src/contracts/schemas/authorization-recipient-v1/RecipientInvitationDecisionRequestV1.schema.json',

  signupPreparation: 'src/contracts/schemas/csi07/signup-preparation-result-v1.schema.json',
  signupRegistration: 'src/contracts/schemas/csi07/signup-operation-registration-result-v1.schema.json',
  signupContinuation: 'src/contracts/schemas/csi07/signup-continuation-result-v1.schema.json',
  verifiedSignupTransfer: 'src/contracts/schemas/csi07/verified-signup-transfer-result-v1.schema.json',
  destinationReceipt: 'src/contracts/schemas/csi08/destination-receipt-result-v1.schema.json',
  authorizationFinalization: 'src/contracts/schemas/csi08/authorization-finalization-result-v1.schema.json',
  signupProgress: 'src/contracts/schemas/csi11/signup-progress-v1.schema.json',
  signupCompletion: 'src/contracts/schemas/csi11/signup-completion-result-v1.schema.json',
  emailPreview: 'src/contracts/schemas/csi11/email-link-preview-result-v1.schema.json',
  emailVerification: 'src/contracts/schemas/csi11/email-verification-result-v1.schema.json',
  recoveryAccepted: 'src/contracts/schemas/csi11/password-recovery-accepted-v1.schema.json',
  recoveryCompleted: 'src/contracts/schemas/csi11/password-recovery-completed-v1.schema.json',
  logoutOptions: 'src/contracts/schemas/csi10/browser-logout-options-result-v1.schema.json',
  logoutAccountMetadata: 'src/contracts/schemas/csi10/logout-account-metadata-result-v1.schema.json',
  logoutResult: 'src/contracts/schemas/csi10/browser-logout-result-v1.schema.json',
  productBootstrap: 'src/contracts/schemas/csi10/bootstrap-result-v1.schema.json',
  profileActivity: '../metamorph-saas/docs/features/authentication/contracts/generated/enterprise-security-v1/api/profile.activity.list.response.schema.json',
}

function replaceNumericFormats(value) {
  if (Array.isArray(value)) return value.map(replaceNumericFormats)
  if (value === null || typeof value !== 'object') return value
  const next = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceNumericFormats(item)]))
  const maximum = { uint8: 255, uint16: 65_535, uint32: 4_294_967_295 }[next.format]
  if (maximum !== undefined) {
    delete next.format
    next.type ??= 'number'
    next.minimum = Math.max(next.minimum ?? 0, 0)
    next.maximum = Math.min(next.maximum ?? maximum, maximum)
    next.multipleOf = 1
  }
  return next
}

const ajv = new Ajv2020({ allErrors: true, strict: true, code: { source: true, esm: true } })
addFormats(ajv)
const exports = {}
for (const [name, relativePath] of Object.entries(schemas)) {
  const schema = replaceNumericFormats(JSON.parse(await readFile(resolve(root, relativePath), 'utf8')))
  const key = `metamorph-auth:${name}`
  delete schema.$id
  ajv.addSchema(schema, key)
  exports[name] = key
}

let source = standaloneCode(ajv, exports)
source = source
  .replace('"use strict";', '')
  .replaceAll('require("ajv/dist/runtime/ucs2length").default', 'ucs2length')
  .replaceAll('require("ajv/dist/runtime/equal").default', 'deepEqual')
  .replaceAll('require("ajv-formats/dist/formats").fullFormats', 'fullFormats')

const imports = []
if (source.includes('ucs2length')) {
  imports.push('import ucs2Module from \'ajv/dist/runtime/ucs2length.js\'')
  imports.push('const ucs2length = ucs2Module.default ?? ucs2Module')
}
if (source.includes('deepEqual')) {
  imports.push('import equalModule from \'ajv/dist/runtime/equal.js\'')
  imports.push('const deepEqual = equalModule.default ?? equalModule')
}
if (source.includes('fullFormats')) {
  imports.push('import formatModule from \'ajv-formats/dist/formats.js\'')
  imports.push('const { fullFormats } = formatModule')
}
const unsupportedRequires = [...source.matchAll(/require\(([^)]+)\)/gu)].map((match) => match[1])
if (unsupportedRequires.length > 0) {
  throw new Error(`Generated validator contains unsupported CommonJS runtime helpers: ${[...new Set(unsupportedRequires)].join(', ')}`)
}

const generated = [
  '/* Generated by scripts/generate-runtime-validators.mjs. Do not edit. */',
  '// @ts-nocheck',
  ...imports,
  '',
  source.trim(),
  '',
].join('\n')

if (process.argv.includes('--check')) {
  const existing = await readFile(outputPath, 'utf8').catch(() => '')
  if (existing !== generated) throw new Error('Runtime validators are stale; run npm run generate:validators')
} else {
  await writeFile(outputPath, generated)
}
