import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import { _ } from 'ajv/dist/compile/codegen/index.js'
import standaloneCode from 'ajv/dist/standalone/index.js'
import addFormats from 'ajv-formats'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = resolve(
  root,
  '../metamorph-saas/docs/features/authentication/contracts/generated/enterprise-security-v1/api',
)
const outputPath = resolve(
  root,
  'src/enterprise-security/scim-validators.generated.ts',
)
const routes = JSON.parse(
  await readFile(
    resolve(sourceRoot, '../../../enterprise-security-http-routes-v1.json'),
    'utf8',
  ),
).routes.filter((r) => r.operationKey.startsWith('identity.scim.'))
if (
  routes.length !== 3 ||
  new Set(routes.map((r) => r.operationKey)).size !== 3
)
  throw new Error('Expected three SCIM identity routes')
const schemas = Object.fromEntries(
  routes.flatMap((r) =>
    ['request', 'response'].map((side) => [
      r.operationKey.replaceAll('.', '_') + '_' + side,
      r.operationKey + '.' + side + '.schema.json',
    ]),
  ),
)
schemas.scim_error = 'error.schema.json'
schemas.scim_entry = 'scim-entry.schema.json'
function replaceNumericFormats(value) {
  if (Array.isArray(value)) return value.map(replaceNumericFormats)
  if (value === null || typeof value !== 'object') return value
  const next = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      replaceNumericFormats(item),
    ]),
  )
  const maximum = { uint8: 255, uint16: 65_535, uint32: 4_294_967_295 }[
    next.format
  ]
  if (maximum !== undefined) {
    delete next.format
    next.type ??= 'number'
    next.minimum = Math.max(next.minimum ?? 0, 0)
    next.maximum = Math.min(next.maximum ?? maximum, maximum)
    next.multipleOf = 1
  }
  if (next.format === 'provider-https-url') {
    delete next.format
    next['x-providerHttpsUrl'] = true
  }
  return next
}

const ajv = new Ajv2020({
  allErrors: false,
  inlineRefs: false,
  strict: true,
  code: { source: true, esm: true },
})
addFormats(ajv)
ajv.addKeyword({
  keyword: 'x-maxUtf8Bytes',
  type: 'string',
  schemaType: 'number',
  code(context) {
    context.fail(
      _`new TextEncoder().encode(${context.data}).byteLength > ${context.schemaCode}`,
    )
  },
})
ajv.addKeyword({
  keyword: 'x-providerHttpsUrl',
  type: 'string',
  schemaType: 'boolean',
  code(context) {
    if (context.schema) context.fail(_`!providerHttpsUrl(${context.data})`)
  },
})
ajv.addKeyword({
  keyword: 'x-nfc',
  type: 'string',
  schemaType: 'boolean',
  code(context) {
    if (context.schema)
      context.fail(_`${context.data}.normalize("NFC") !== ${context.data}`)
  },
})
ajv.addKeyword({
  keyword: 'x-trimmed',
  type: 'string',
  schemaType: 'boolean',
  code(context) {
    if (context.schema)
      context.fail(_`${context.data}.trim() !== ${context.data}`)
  },
})

// Canonical structural IDs share identical generic definitions across operations.
// Generic Rust schema names are local to a schema and cannot be merged by name.
const sharedDefinitions = new Map()
function rewriteReferences(value, definitions, cache, resolving) {
  if (Array.isArray(value))
    return value.map((item) =>
      rewriteReferences(item, definitions, cache, resolving),
    )
  if (value === null || typeof value !== 'object') return value
  const result = {}
  for (const key of Object.keys(value).sort()) {
    if (key === '$comment' || key === 'description') continue
    if (key === '$ref' && value[key].startsWith('#/$defs/')) {
      const name = value[key].slice(8)
      if (!cache.has(name)) {
        if (resolving.has(name) || !definitions[name])
          throw new Error('Invalid or cyclic admin schema definition: ' + name)
        resolving.add(name)
        const definition = rewriteReferences(
          definitions[name],
          definitions,
          cache,
          resolving,
        )
        resolving.delete(name)
        const id =
          'urn:octamorph:admin-security:def:' +
          createHash('sha256').update(JSON.stringify(definition)).digest('hex')
        cache.set(name, id)
        sharedDefinitions.set(id, definition)
      }
      result[key] = cache.get(name)
    } else
      result[key] = rewriteReferences(value[key], definitions, cache, resolving)
  }
  return result
}
const exports = {}
const roots = []
const typeNames = new Map()
for (const [name, file] of Object.entries(schemas)) {
  const schema = replaceNumericFormats(
    JSON.parse(await readFile(resolve(sourceRoot, file), 'utf8')),
  )
  typeNames.set(
    name,
    schema.$comment?.match(
      /enterprise-security-contract::([^ ]+)\. Do not edit\./u,
    )?.[1] ?? schema.title,
  )
  const definitions = schema.$defs ?? {}
  delete schema.$defs
  delete schema.$id
  const normalized = rewriteReferences(
    schema,
    definitions,
    new Map(),
    new Set(),
  )
  const key = `urn:octamorph:admin-security:operation:${name}`
  roots.push([key, normalized])
  exports[name] = key
}
for (const [key, schema] of sharedDefinitions) ajv.addSchema(schema, key)
for (const [key, schema] of roots) ajv.addSchema(schema, key)

let source = standaloneCode(ajv, exports)
source = source
  .replace('"use strict";', '')
  .replaceAll('require("ajv/dist/runtime/ucs2length").default', 'ucs2length')
  .replaceAll('require("ajv/dist/runtime/equal").default', 'deepEqual')
  .replaceAll('require("ajv-formats/dist/formats").fullFormats', 'fullFormats')

const imports = []
if (source.includes('providerHttpsUrl('))
  imports.push('import { providerHttpsUrl } from "./response-decode";')
if (source.includes('ucs2length')) {
  imports.push('import ucs2Module from "ajv/dist/runtime/ucs2length.js";')
  imports.push('const ucs2length = ucs2Module.default ?? ucs2Module;')
}
if (source.includes('deepEqual')) {
  imports.push('import equalModule from "ajv/dist/runtime/equal.js";')
  imports.push('const deepEqual = equalModule.default ?? equalModule;')
}
if (source.includes('fullFormats')) {
  imports.push('import formatModule from "ajv-formats/dist/formats.js";')
  imports.push('const { fullFormats } = formatModule;')
}
const unsupportedRequires = [...source.matchAll(/require\(([^)]+)\)/gu)].map(
  (match) => match[1],
)
if (unsupportedRequires.length > 0) {
  throw new Error(
    `Generated validator contains unsupported CommonJS runtime helpers: ${[
      ...new Set(unsupportedRequires),
    ].join(', ')}`,
  )
}

const generated = [
  '/* Generated by scripts/generate-scim-validators.mjs. Do not edit. */',
  '// @ts-nocheck',
  ...imports,
  '',
  source.trim(),
  '',
].join('\n')

async function emit(path, source) {
  if (process.argv.includes('--check')) {
    if ((await readFile(path, 'utf8').catch(() => '')) !== source)
      throw new Error('Admin security generated consumer is stale: ' + path)
  } else await writeFile(path, source)
}

const typeImports = new Set()
const types = [],
  contracts = []
for (const route of routes) {
  if (
    route.method !== 'POST' ||
    route.surface !== 'regional_identity' ||
    route.successStatus !== 200 ||
    route.idempotency !== 'required_header'
  )
    throw new Error('Unsupported SCIM identity binding')
  const key = route.operationKey.replaceAll('.', '_')
  const request = typeNames.get(key + '_request'),
    response = typeNames.get(key + '_response')
  for (const name of [request, response]) {
    if (!/^[A-Za-z][A-Za-z0-9]+V1$/u.test(name))
      throw new Error('Invalid source DTO')
    typeImports.add(
      `import type { ${name} } from "../contracts/generated/enterprise-security-v1/types/${name}";`,
    )
  }
  types.push(
    `  "${route.operationKey}": { request: ${request}; response: ${response}; };`,
  )
  contracts.push(
    `  "${route.operationKey}": { path: ${JSON.stringify(route.path)}, maxRequestBytes: ${route.maxRequestBytes}, maxResponseBytes: ${route.maxResponseBytes}, request: validators.${key}_request, response: validators.${key}_response },`,
  )
}
await emit(
  resolve(root, 'src/enterprise-security/scim-contract.generated.ts'),
  [
    '/* Generated by scripts/generate-scim-validators.mjs from SaaS Rust schemas and HTTP routes. Do not edit. */',
    ...[...typeImports].sort(),
    'import * as validators from "./scim-validators.generated";',
    'export interface ScimIdentityOperations {',
    ...types,
    '}',
    'export const scimIdentityContracts: { readonly [K in keyof ScimIdentityOperations]: { path: string; maxRequestBytes: number; maxResponseBytes: number; request: (input: unknown) => boolean; response: (input: unknown) => boolean } } = {',
    ...contracts,
    '} as const;',
    '',
  ].join('\n'),
)
await emit(outputPath, generated)
