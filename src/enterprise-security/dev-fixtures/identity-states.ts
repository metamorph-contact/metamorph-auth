export const identityPreviewStates = [
  'ready', 'empty', 'loading', 'retryable-error', 'terminal-error',
  'partial', 'stale-revision', 'read-only', 'assurance-challenge',
  'regional-correction', 'provider-outage', 'async-progress',
] as const
export type IdentityPreviewState = (typeof identityPreviewStates)[number]
