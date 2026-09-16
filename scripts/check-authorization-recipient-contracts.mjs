import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const auth = resolve(fileURLToPath(new URL('..', import.meta.url)))
const docs = resolve(auth, '../metamorph-saas/docs/features/authorization/contracts/generated/recipient-inbox-v1')
const generated = resolve(auth, 'src/contracts/generated/authorization-recipient-v1')
const read = (path) => JSON.parse(readFileSync(path, 'utf8'))
const sourceManifest = read(resolve(docs, 'manifest.json'))
const consumerManifest = read(resolve(generated, 'manifest.json'))
assert.deepEqual(consumerManifest, sourceManifest, 'recipient manifest differs from authorization owner')
assert.deepEqual(Object.keys(sourceManifest.operations).sort(), ['accept', 'bootstrap', 'detail', 'emailedEntry', 'list', 'reject', 'status'])

const ajv = new Ajv2020({ strict: false, allErrors: true })
addFormats(ajv)
for (const bits of [8, 16]) {
  ajv.addFormat(`uint${bits}`, { type: 'number', validate: (value) => Number.isInteger(value) && value >= 0 && value <= 2 ** bits - 1 })
}
const schema = (name) => ajv.compile(read(resolve(docs, `schemas/${name}.schema.json`)))
const fixtures = read(resolve(generated, 'fixtures.json'))
const bootstrap = schema('RecipientInboxBootstrapResultV1')
const list = schema('RecipientInvitationListResultV1')
const decision = schema('RecipientInvitationDecisionRequestV1')
const operation = schema('RecipientInvitationOperationV1')
const listRequest = schema('RecipientInvitationListRequestV1')
assert.equal(bootstrap(fixtures.bootstrap), true, JSON.stringify(bootstrap.errors))
for (const key of ['pinned', 'claimRequired', 'history', 'rejectedHistory']) {
  assert.equal(list(fixtures[key]), true, `${key}: ${JSON.stringify(list.errors)}`)
}
for (const key of ['pending', 'completed', 'rejected']) {
  assert.equal(operation(fixtures[key]), true, `${key}: ${JSON.stringify(operation.errors)}`)
}
const oversized = structuredClone(fixtures.claimRequired)
oversized.items = Array.from({ length: 51 }, () => structuredClone(fixtures.claimRequired.items[0]))
assert.equal(list(oversized), false, 'recipient page accepted more than 50 items')
assert.equal(operation({ ...fixtures.pending, state: 'failed', safeErrorCode: 'Raw email: person@example.com' }), false,
  'operation accepted unsafe free-text error')
const teaser = fixtures.claimRequired.items[0]
assert.equal(teaser.kind, 'claim_required')
assert.notEqual(fixtures.emailedLink.invitationId, fixtures.pinned.items[0].invitation.invitationId,
  'emailed-link and pinned offer must be distinct')
for (const forbidden of ['invitationId', 'tenantId', 'inviterDisplay', 'target', 'recipientEmail', 'emailedToken']) {
  assert.equal(JSON.stringify(teaser).includes(forbidden), false, `teaser exposed ${forbidden}`)
}
assert.equal(JSON.stringify(fixtures.claimRequired).includes(fixtures.emailedLink.emailedToken), false,
  'teaser contains complete emailed token')
const polluted = structuredClone(fixtures.claimRequired)
polluted.items[0].invitationId = fixtures.pinned.items[0].invitation.invitationId
assert.equal(list(polluted), false, 'teaser accepted a full invitation ID')
const wrongVersion = structuredClone(fixtures.pinned)
wrongVersion.schemaVersion = 2
assert.equal(list(wrongVersion), false, 'unsupported recipient schema version accepted')
assert.equal(listRequest({ state: 'pending', limit: 50 }), true)
assert.equal(listRequest({ state: 'pending', limit: 51 }), false, 'over-limit inbox query accepted')
assert.equal(listRequest({ state: 'pending', extra: true }), false, 'unknown inbox query field accepted')
const request = { schemaVersion: 1, mutationId: '0198f1cb-5661-7c52-90b7-2c0000000003', expected: { invitationVersion: '3' } }
assert.equal(decision(request), true, JSON.stringify(decision.errors))
assert.equal(decision({ ...request, mutationId: '00000000-0000-4000-8000-000000000001' }), false,
  'decision schema accepted a non-v7 mutation ID')
assert.equal(decision({ ...request, expected: { invitationVersion: '0' } }), false,
  'decision schema accepted a zero version')
assert.equal(decision({ ...request, expected: { invitationVersion: '3', grant: true } }), false, 'decision accepted an unauthorized grant field')
assert.equal(decision({ ...request, schemaVersion: 2 }), false)
console.log('authorization recipient generated DTOs and safe fixtures OK')
