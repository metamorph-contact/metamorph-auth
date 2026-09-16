/** Called at the actual location commit, after any asynchronous page fade.
 * Every deadline comes from the current flow/catalog/advisory/attempt, not URL input. */
export function assertExternalNavigationLive(
  signal: AbortSignal,
  deadlines: readonly string[],
  now = Date.now(),
): void {
  signal.throwIfAborted()
  if (deadlines.length === 0 || deadlines.some((value) => !Number.isFinite(Date.parse(value)) || Date.parse(value) <= now))
    throw new Error('security.ceremony.expired')
}
