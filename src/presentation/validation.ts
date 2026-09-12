const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u

export function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

export function validBoundedText(value: string, maximumBytes: number, required = true): boolean {
  const length = utf8Length(value)
  return (!required || length > 0) && length <= maximumBytes && !CONTROL_CHARACTERS.test(value)
}

export function validEmail(value: string): boolean {
  return validBoundedText(value, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value)
}

export function exceedsUtf8Limit(value: string, maximumBytes: number): boolean {
  return utf8Length(value) > maximumBytes
}
