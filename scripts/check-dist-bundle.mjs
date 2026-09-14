import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'

const root = resolve(new URL('..', import.meta.url).pathname)
const html = await readFile(resolve(root, 'dist/index.html'), 'utf8')
const fragmentGate = html.indexOf('__MM_AUTH_FRAGMENT_V1__')
const firstExecutable = html.search(/<script(?:\s|>)/u)
const firstExecutableEnd = firstExecutable < 0 ? -1 : html.indexOf('</script>', firstExecutable)
if (fragmentGate < firstExecutable || firstExecutable < 0 || firstExecutableEnd < fragmentGate ||
    /<script[^>]+src=["']\/fragment-gate\.js["']/u.test(html)) {
  throw new Error('Identity fragment scrub is not inline in the first executable')
}
const release = JSON.parse(await readFile(resolve(root, 'catalog/identity-ui-release.development.json'), 'utf8'))
const firstScriptStart = html.indexOf('>', firstExecutable) + 1
const firstScript = html.slice(firstScriptStart, firstExecutableEnd)
const firstScriptHash = `sha256-${createHash('sha256').update(firstScript).digest('base64')}`
if (release.executableAssetCount !== release.scriptSha256.length ||
    !release.scriptSha256.includes(firstScriptHash)) {
  throw new Error('Identity fragment scrub is not admitted by the release CSP hashes')
}
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.js)"/gu)].map((match) => match[1])
const unique = [...new Set(assets)]
let compressed = 0
for (const asset of unique) compressed += gzipSync(await readFile(resolve(root, `dist${asset}`))).byteLength
const maximum = 330 * 1024
if (compressed > maximum) {
  throw new Error(`Initial identity JavaScript is ${compressed} bytes gzip; limit is ${maximum}`)
}

const builtFiles = await readdir(resolve(root, 'dist/assets'))
const javascript = (await Promise.all(
  builtFiles.filter((name) => name.endsWith('.js')).map((name) => readFile(resolve(root, 'dist/assets', name), 'utf8')),
)).join('\n')
if (javascript.includes('EA01_FIXTURE_ONLY') || javascript.includes('_preview/enterprise-security')) {
  throw new Error('Enterprise fixture or preview route leaked into the production identity bundle')
}
const functionCalls = [...javascript.matchAll(/\bFunction\s*\(/gu)]
const onlyJitlessProbe = functionCalls.length <= 1 && functionCalls.every((match) =>
  javascript.slice(Math.max(0, match.index - 240), match.index).includes('jitless'),
)
if (/\beval\s*\(/u.test(javascript) || javascript.includes('new Function') || !onlyJitlessProbe ||
    !javascript.includes('__zod_globalConfig') ||
    !javascript.includes('jitless')) {
  throw new Error('Built identity JavaScript is not guaranteed to run without dynamic code evaluation')
}

const css = (await Promise.all(
  builtFiles.filter((name) => name.endsWith('.css')).map((name) => readFile(resolve(root, 'dist/assets', name), 'utf8')),
)).join('\n')
if (!css.includes('box-sizing:border-box')) {
  throw new Error('Polymorph base reset is missing from the built identity CSS')
}
