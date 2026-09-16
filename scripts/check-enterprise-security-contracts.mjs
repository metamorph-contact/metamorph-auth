import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { isIP } from 'node:net';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const fixtureModule = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/contracts/generated/enterprise-security-v1/fixtures.generated.ts');
const {
  buildCustomerAuditEvent,
  buildSecurityErrorEnvelope,
  buildSecurityIntegrationEvent,
  buildProfileEmailsListRequest,
  buildProfileEmailsListResponse,
  securityErrorFixtureCount,
  securityEventWireLimits,
} = await import(pathToFileURL(fixtureModule).href);

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const docs = path.join(repo, 'metamorph-saas/docs/features/authentication/contracts/generated/enterprise-security-v1');
const read = (relative) => JSON.parse(readFileSync(path.join(docs, relative), 'utf8'));
const manifest = JSON.parse(readFileSync(path.join(docs, '../../enterprise-security-contract-manifest-v1.json'), 'utf8'));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
for (const bits of [8, 16, 32]) {
  ajv.addFormat(`uint${bits}`, {
    type: 'number',
    validate: (value) => Number.isInteger(value) && value >= 0 && value <= 2 ** bits - 1,
  });
}
ajv.addKeyword({ keyword: 'x-maxUtf8Bytes', type: 'string', schemaType: 'number',
  validate: (maximum, value) => Buffer.byteLength(value, 'utf8') <= maximum });
ajv.addKeyword({ keyword: 'x-nfc', type: 'string', schemaType: 'boolean',
  validate: (required, value) => !required || value.normalize('NFC') === value });
ajv.addKeyword({ keyword: 'x-trimmed', type: 'string', schemaType: 'boolean',
  validate: (required, value) => !required || value.trim() === value });
ajv.addFormat('provider-https-url', {
  type: 'string',
  validate(value) {
    try {
      const url = new URL(value);
      const host = url.hostname;
      return value.length > 0 && Buffer.byteLength(value) <= 2048
        && value.trim() === value && url.protocol === 'https:'
        && !url.username && !url.password && !value.includes('#')
        && !isIP(host) && !host.endsWith('.') && host.length <= 253
        && host.split('.').every((label) => label.length >= 1 && label.length <= 63)
        && url.port !== '0';
    } catch {
      return false;
    }
  },
});
const error = ajv.compile(read('api/error.schema.json'));
const audit = ajv.compile(read('events/customer-audit.schema.json'));
const integration = ajv.compile(read('events/integration.schema.json'));
let operationSchemaCount = 0;
for (const name of readdirSync(path.join(docs, 'api'))) {
  const schema = read(`api/${name}`);
  assert.equal(manifest.schemaIds[schema.$id], `metamorph-saas/docs/features/authentication/contracts/generated/enterprise-security-v1/api/${name}`);
  if (name === 'error.schema.json') continue;
  assert.ok(name.endsWith('.schema.json'), `unexpected schema: ${name}`);
  try {
    ajv.compile(schema);
  } catch (cause) {
    throw new Error(`invalid generated operation schema ${name}`, { cause });
  }
  operationSchemaCount += 1;
}
assert.equal(operationSchemaCount, 242 * 2);
for (const name of readdirSync(path.join(docs, 'events'))) {
  const schema = read(`events/${name}`);
  assert.equal(manifest.schemaIds[schema.$id], `metamorph-saas/docs/features/authentication/contracts/generated/enterprise-security-v1/events/${name}`);
}
assert.equal(Object.keys(manifest.schemaIds).length, operationSchemaCount + 5);
const apiIndex = ajv.compile(JSON.parse(readFileSync(path.join(docs, '../../enterprise-security-api-v1.schema.json'), 'utf8')));
const eventIndex = ajv.compile(JSON.parse(readFileSync(path.join(docs, '../../enterprise-security-events-v1.schema.json'), 'utf8')));
assert.equal(typeof apiIndex, 'function');
assert.equal(typeof eventIndex, 'function');
const requestSchema = ajv.getSchema('urn:metamorph:enterprise-security:v1:api:profile.emails.list:request');
const responseSchema = ajv.getSchema('urn:metamorph:enterprise-security:v1:api:profile.emails.list:response');
assert.ok(requestSchema && responseSchema);
const provider = read('api/admin.providers.update.request.schema.json').$defs;
const displayName = ajv.compile(provider.ProviderDisplayNameV1);
const providerUrl = ajv.compile(provider.ProviderHttpsUrlV1);
const proof = ajv.compile(read('api/profile.emails.verify.request.schema.json').$defs.OneTimeProofV1);
const providerSecret = ajv.compile(read('api/admin.providers.rotate_secret.request.schema.json').$defs.ProviderSecretInputV1);
const sourceIp = ajv.compile(read('events/customer-audit.schema.json').$defs.SecuritySourceIpV1);
assert.equal(displayName('Fixture Provider'), true);
assert.equal(displayName('é'.repeat(120)), false, 'UTF-8 byte limit bypassed');
assert.equal(displayName('bad\u202e'), false, 'bidi display text accepted');
assert.equal(providerUrl('https://idp.example.test/path'), true);
assert.equal(providerUrl('HTTPS://idp.example.test/path'), true, 'Rust-normalized uppercase scheme rejected');
for (const unsafeUrl of ['https://127.0.0.1/path', 'https://user@idp.example.test/path',
  'https://idp.example.test/path#fragment', 'https://idp.example.test./path']) {
  assert.equal(providerUrl(unsafeUrl), false, `unsafe provider URL accepted: ${unsafeUrl}`);
}
assert.equal(proof('A'.repeat(42) + 'A'), true);
assert.equal(proof('A'.repeat(42) + 'B'), false, 'noncanonical base64url proof accepted');
assert.equal(providerSecret('safe-fixture-material'), true);
assert.equal(providerSecret('bad\0material'), false, 'NUL secret input accepted');
assert.equal(sourceIp('192.0.2.1'), true);
assert.equal(sourceIp('not-an-ip'), false, 'invalid source IP accepted');
const clone = (value) => structuredClone(value);

assert.equal(securityErrorFixtureCount, 20);
const codes = new Set();
for (let index = 0; index < securityErrorFixtureCount; index += 1) {
  const envelope = buildSecurityErrorEnvelope(index);
  assert.equal(error(envelope), true, JSON.stringify(error.errors));
  assert.deepEqual(JSON.parse(JSON.stringify(envelope)), envelope);
  codes.add(envelope.error.code);
  const extra = { ...envelope, unsafe: true };
  assert.equal(error(extra), false, 'unknown envelope field accepted');
}
assert.equal(codes.size, 20);
assert.throws(() => buildSecurityErrorEnvelope(20), RangeError);
const badEnum = buildSecurityErrorEnvelope(0);
badEnum.error.code = 'security.unlisted';
assert.equal(error(badEnum), false, 'unknown error code accepted');
const badId = buildSecurityErrorEnvelope(0);
badId.correlationId = '00000000-0000-4000-8000-000000000000';
assert.equal(error(badId), false, 'non-v7 identifier accepted');
const noDetail = buildSecurityErrorEnvelope(0);
noDetail.error.detail = {};
assert.equal(error(noDetail), false, 'unexpected error detail accepted');
const routeRetry = [...Array(securityErrorFixtureCount).keys()].map(buildSecurityErrorEnvelope)
  .find((value) => value.error.code === 'security.route.retry');
assert.ok(routeRetry);
delete routeRetry.error.detail.realmId;
assert.equal(error(routeRetry), false, 'incomplete route detail accepted');

const operationRequest = buildProfileEmailsListRequest();
const operationResponse = buildProfileEmailsListResponse();
assert.equal(requestSchema(operationRequest), true, JSON.stringify(requestSchema.errors));
assert.equal(responseSchema(operationResponse), true, JSON.stringify(responseSchema.errors));
assert.deepEqual(JSON.parse(JSON.stringify(operationRequest)), operationRequest);
assert.deepEqual(JSON.parse(JSON.stringify(operationResponse)), operationResponse);
const badOperation = clone(operationRequest);
badOperation.page.unsafe = true;
assert.equal(requestSchema(badOperation), false, 'unknown operation field accepted');
const maxPage = clone(operationRequest);
maxPage.page.limit = 100;
assert.equal(requestSchema(maxPage), true);
maxPage.page.limit = 101;
assert.equal(requestSchema(maxPage), false, 'out-of-range page limit accepted');

const auditEvent = buildCustomerAuditEvent();
const integrationEvent = buildSecurityIntegrationEvent();
assert.equal(audit(auditEvent), true, JSON.stringify(audit.errors));
const semanticRejection = read('fixtures.json').semanticRejection;
assert.equal(semanticRejection.expectedRustDecodeError, 'invalid_semantics');
assert.equal(audit(semanticRejection.auditDeniedMarkedSucceeded), true,
  'semantic rejection fixture must remain structurally valid');
assert.equal(semanticRejection.auditDeniedMarkedSucceeded.result, 'succeeded');
assert.equal(semanticRejection.auditDeniedMarkedSucceeded.eventType, 'authentication.security.denied');
assert.equal(integration(integrationEvent), true, JSON.stringify(integration.errors));
assert.deepEqual(JSON.parse(JSON.stringify(auditEvent)), auditEvent);
assert.deepEqual(JSON.parse(JSON.stringify(integrationEvent)), integrationEvent);
const extraAudit = clone(auditEvent);
extraAudit.details.value.unexpectedField = true;
assert.equal(audit(extraAudit), false, 'unknown nested audit field accepted');
const badEventKind = clone(integrationEvent);
badEventKind.payload.kind = 'unsafe_payload';
assert.equal(integration(badEventKind), false, 'unknown integration kind accepted');
const badTime = clone(integrationEvent);
badTime.occurredAt = 'invalid-date';
assert.equal(integration(badTime), false, 'invalid timestamp accepted');
const missing = clone(integrationEvent);
delete missing.causationEventId;
assert.equal(integration(missing), true, 'absent optional value rejected');
assert.equal(integration({ ...integrationEvent, causationEventId: null }), true, 'nullable value rejected');
const maxRevision = clone(integrationEvent);
maxRevision.sourceRevision = '18446744073709551615';
assert.equal(integration(maxRevision), true, 'maximum u64 revision rejected');
maxRevision.sourceRevision = '18446744073709551616';
assert.equal(integration(maxRevision), false, 'out-of-range u64 revision accepted');
const decodeBounded = (bytes, limit, validator) => {
  if (bytes.length > limit) throw new RangeError('security event exceeds wire limit');
  const value = JSON.parse(bytes.toString('utf8'));
  if (!validator(value)) throw new TypeError('invalid security event');
  return value;
};
for (const [value, limit, validator] of [
  [auditEvent, securityEventWireLimits.customerAudit, audit],
  [integrationEvent, securityEventWireLimits.integration, integration],
]) {
  const bytes = Buffer.from(JSON.stringify(value));
  assert.ok(bytes.length <= limit);
  const exact = Buffer.concat([bytes, Buffer.alloc(limit - bytes.length, 0x20)]);
  assert.equal(exact.length, limit);
  assert.deepEqual(decodeBounded(exact, limit, validator), value);
  assert.throws(() => decodeBounded(Buffer.concat([exact, Buffer.from(' ')]), limit, validator), RangeError);
}
console.log('EA-00J TypeScript/schema fixtures: 20 errors, audit, integration, rejections and boundaries pass');
