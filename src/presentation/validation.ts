const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u
export const PASSWORD_WIRE_MAX_BYTES = 16 * 1024

export function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

export function validBoundedText(value: string, maximumBytes: number, required = true): boolean {
  const length = utf8Length(value)
  return (!required || length > 0) && length <= maximumBytes && !CONTROL_CHARACTERS.test(value)
}

export function validEmail(value: string): boolean {
  return normalizeEmailForWire(value) !== null
}

/** CSI wire email has an ASCII local part and an IDNA A-label domain. */
export function normalizeEmailForWire(value: string): string | null {
  const input = value.trim()
  if (input.length === 0 || CONTROL_CHARACTERS.test(input)) return null
  const at = input.lastIndexOf('@')
  if (at <= 0 || at === input.length - 1) return null
  const local = input.slice(0, at)
  const rawDomain = input.slice(at + 1)
  if (utf8Length(rawDomain) > 1_024) return null
  if (/[^\x21-\x7e]/u.test(local) || local.includes('@') || /[\s\\/:?#@*%\[\]]/u.test(rawDomain) || rawDomain.endsWith('.')) return null
  let domain: string
  try {
    const parsed = new URL(`http://${rawDomain}`)
    domain = parsed.hostname
    if (parsed.host !== domain || parsed.pathname !== '/' || parsed.username !== '' || parsed.password !== '') return null
  } catch {
    return null
  }
  if (domain.length > 253 || /^\d+(?:\.\d+)+$/u.test(domain)) return null
  const labels = domain.split('.')
  if (labels.length < 2 || labels.some((label) => label.length === 0 || label.length > 63 || label.startsWith('-') || label.endsWith('-') || !/^[a-z0-9-]+$/u.test(label))) return null
  const canonical = `${local.toLowerCase()}@${domain}`
  return validBoundedText(canonical, 254) ? canonical : null
}

export function exceedsUtf8Limit(value: string, maximumBytes: number): boolean {
  return utf8Length(value) > maximumBytes
}

export function boundedPasswordInput(value: string): string | null {
  return utf8Length(value) <= PASSWORD_WIRE_MAX_BYTES ? value : null
}

export function validPasswordInput(value: string): boolean {
  const length = utf8Length(value)
  return length > 0 && length <= PASSWORD_WIRE_MAX_BYTES
}
