/**
 * Polymorph's schema dependency can JIT validators. Identity runs under a CSP
 * without unsafe-eval, so establish its documented cross-bundle global before
 * any Polymorph module evaluates or parses a schema.
 */
const runtime = globalThis as typeof globalThis & {
  __zod_globalConfig?: { jitless?: boolean }
}
runtime.__zod_globalConfig = {
  ...runtime.__zod_globalConfig,
  jitless: true,
}
