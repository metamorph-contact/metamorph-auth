import { decodeBoundedJsonText } from '../contracts/decode'
import type { Plan03ResponseMap } from '../contracts/generated/enterprise-security-v1/plan03-responses.generated'
import { plan03Validators } from './plan03-validators.generated'
import type { SecurityApiErrorV1 } from '../contracts/generated/enterprise-security-v1/types/SecurityApiErrorV1'

type ResponseValidator = (input: unknown) => boolean
const validators = plan03Validators as unknown as Readonly<Record<string, ResponseValidator>>

function providerHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname
    const hasAsciiControl = [...value].some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
    return new TextEncoder().encode(value).byteLength <= 2048
      && value.trim() === value
      && !hasAsciiControl
      && new TextEncoder().encode(url.href).byteLength <= 2048
      && url.protocol === 'https:'
      && !url.username && !url.password && !value.includes('#')
      && !host.includes(':') && !/^\d+\.\d+\.\d+\.\d+$/.test(host)
      && !host.endsWith('.') && host.length <= 253
      && host.split('.').every((label) => label.length >= 1 && label.length <= 63)
      && url.port !== '0'
  } catch {
    return false
  }
}

function validatorFor(name: string): ResponseValidator {
  if (!Object.hasOwn(validators, name)) throw new Error('Missing Plan 03 response schema')
  const validator = validators[name]
  return validator
}

function decode(name: string, text: string, maxBytes: number): unknown {
  const value = decodeBoundedJsonText(text, maxBytes)
  if (!validatorFor(name)(value)) throw new Error('Invalid Plan 03 response')
  if (name === 'identity.step_up.start') {
    const result = value as { kind: string; launch?: { navigationUri: string } }
    if (result.kind === 'federated' && !providerHttpsUrl(result.launch?.navigationUri ?? '')) {
      throw new Error('Invalid Plan 03 response')
    }
  }
  return value
}

export function decodePlan03Response<K extends keyof Plan03ResponseMap>(
  operation: K,
  text: string,
): Plan03ResponseMap[K] {
  return decode(operation, text, 256 * 1024) as Plan03ResponseMap[K]
}

export function decodePlan03Error(text: string): SecurityApiErrorV1 {
  return decode('error', text, 16 * 1024) as SecurityApiErrorV1
}
