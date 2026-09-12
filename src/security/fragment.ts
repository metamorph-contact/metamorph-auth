const MAX_FRAGMENT_BYTES = 16 * 1024
const TOKEN = /^[A-Za-z0-9._~-]{1,1024}$/u
const PROTECTED = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]*){2}(?:(?:\.[A-Za-z0-9_-]*){2})?$/u

declare global {
  interface Window {
    __MM_AUTH_FRAGMENT_V1__?: string
  }
}

export type InitialEntryFragment = Readonly<{
  kind: 'initial' | 'relocation'
  projection: string
  controller: string
  catalog: string
  digest: string
  recovery: string
  start: string
}>

export type EmailVerificationFragment = Readonly<{
  kind: 'signupVerification'
  projection: string
  catalog: string
  digest: string
  home: string
  controller: string
  token: string
  controllerContext: string
  homeContext: string
}>

export type PasswordRecoveryFragment = Readonly<{
  kind: 'passwordRecovery'
  projection: string
  catalog: string
  digest: string
  home: string
  token: string
  context: string
}>

export type DestinationContinuationFragment = Readonly<{
  kind: 'destination'
  flow: string
  operation: string
  digest: string
  receipt: string
}>

export type AuthFragment =
  | InitialEntryFragment
  | EmailVerificationFragment
  | PasswordRecoveryFragment
  | DestinationContinuationFragment

export class InvalidAuthFragmentError extends Error {
  constructor(message = 'Invalid authentication continuation') {
    super(message)
    this.name = 'InvalidAuthFragmentError'
  }
}

function exact(params: URLSearchParams, names: readonly string[]): void {
  const actual = [...params.keys()]
  if (
    actual.length !== names.length ||
    new Set(actual).size !== actual.length ||
    names.some((name, index) => actual[index] !== name)
  ) {
    throw new InvalidAuthFragmentError()
  }
}

function value(params: URLSearchParams, name: string): string {
  const candidate = params.get(name)
  if (candidate === null || !TOKEN.test(candidate)) {
    throw new InvalidAuthFragmentError()
  }
  return candidate
}

function protectedValue(params: URLSearchParams, name: string, maximum: number): string {
  const candidate = params.get(name)
  if (
    candidate === null ||
    candidate.length < 5 ||
    candidate.length > maximum ||
    !PROTECTED.test(candidate)
  ) {
    throw new InvalidAuthFragmentError()
  }
  return candidate
}

function digestValue(params: URLSearchParams, name: string): string {
  const candidate = params.get(name)
  if (candidate === null || !/^[A-Za-z0-9_-]{43}$/u.test(candidate)) {
    throw new InvalidAuthFragmentError()
  }
  return candidate
}

function parseFragment(hash: string): AuthFragment {
  if (!hash.startsWith('#') || new TextEncoder().encode(hash).byteLength > MAX_FRAGMENT_BYTES) {
    throw new InvalidAuthFragmentError()
  }
  const params = new URLSearchParams(hash.slice(1))
  if (params.get('v') !== '1') throw new InvalidAuthFragmentError()
  const kind = params.get('kind')
  if (kind === 'initial' || kind === 'relocation') {
    exact(params, ['v', 'kind', 'projection', 'controller', 'catalog', 'digest', 'recovery', 'start'])
    return Object.freeze({
      kind,
      projection: value(params, 'projection'),
      controller: value(params, 'controller'),
      catalog: value(params, 'catalog'),
      digest: digestValue(params, 'digest'),
      recovery: protectedValue(params, 'recovery', 3 * 1024),
      start: protectedValue(params, 'start', 8 * 1024),
    })
  }
  if (kind === 'signupVerification') {
    exact(params, [
      'v', 'kind', 'projection', 'catalog', 'digest', 'home', 'controller', 'token',
      'controllerContext', 'homeContext',
    ])
    return Object.freeze({
      kind,
      projection: value(params, 'projection'),
      catalog: value(params, 'catalog'),
      digest: digestValue(params, 'digest'),
      home: value(params, 'home'),
      controller: value(params, 'controller'),
      token: value(params, 'token'),
      controllerContext: protectedValue(params, 'controllerContext', 8 * 1024),
      homeContext: protectedValue(params, 'homeContext', 8 * 1024),
    })
  }
  if (kind === 'passwordRecovery') {
    exact(params, ['v', 'kind', 'projection', 'catalog', 'digest', 'home', 'token', 'context'])
    return Object.freeze({
      kind,
      projection: value(params, 'projection'),
      catalog: value(params, 'catalog'),
      digest: digestValue(params, 'digest'),
      home: value(params, 'home'),
      token: value(params, 'token'),
      context: protectedValue(params, 'context', 8 * 1024),
    })
  }
  if (kind === null && params.has('flow')) {
    exact(params, ['v', 'flow', 'operation', 'digest', 'receipt'])
    return Object.freeze({
      kind: 'destination',
      flow: value(params, 'flow'),
      operation: value(params, 'operation'),
      digest: digestValue(params, 'digest'),
      receipt: protectedValue(params, 'receipt', 8 * 1024),
    })
  }
  throw new InvalidAuthFragmentError()
}

/**
 * Copies a bounded fragment into memory, removes the complete fragment from
 * browser history, verifies that removal, and only then returns capabilities.
 */
export function consumeAuthFragment(
  location = window.location,
  beforeClear?: (fragment: AuthFragment) => void,
): AuthFragment {
  const staged = window.__MM_AUTH_FRAGMENT_V1__
  if (staged !== undefined) delete window.__MM_AUTH_FRAGMENT_V1__
  const snapshot = staged ?? location.hash
  if (new TextEncoder().encode(snapshot).byteLength > MAX_FRAGMENT_BYTES) {
    if (location.hash !== '') window.history.replaceState(window.history.state, '', `${location.pathname}${location.search}`)
    throw new InvalidAuthFragmentError()
  }
  let parsed: AuthFragment
  let failure: unknown
  try {
    parsed = parseFragment(snapshot)
    beforeClear?.(parsed)
  } catch (error) {
    failure = error
  }
  const clean = `${location.pathname}${location.search}`
  if (location.hash !== '') window.history.replaceState(window.history.state, '', clean)
  if (window.location.hash !== '') throw new InvalidAuthFragmentError('Could not clear continuation data')
  if (failure !== undefined) throw failure
  // The assignment is guaranteed unless parsing/persistence failed, which was rethrown above.
  // eslint-free repository: the assertion keeps the security ordering explicit to TypeScript.
  if (parsed! === undefined) throw new InvalidAuthFragmentError()
  return parsed
}

let consumed: AuthFragment | undefined

export function consumeAuthFragmentOnce(beforeClear?: (fragment: AuthFragment) => void): AuthFragment {
  consumed ??= consumeAuthFragment(window.location, beforeClear)
  return consumed
}

/**
 * Reports whether the first-executable shell staged a capability fragment, or
 * whether one is still present on the URL. Callers use this only to choose
 * between fresh-entry consumption and durable recovery; the capability value
 * remains encapsulated here.
 */
export function hasUnconsumedAuthFragment(location = window.location): boolean {
  return window.__MM_AUTH_FRAGMENT_V1__ !== undefined
    ? window.__MM_AUTH_FRAGMENT_V1__ !== ''
    : location.hash !== ''
}

export function discardConsumedAuthFragment(): void {
  consumed = undefined
}

export const __test = { parseFragment }
