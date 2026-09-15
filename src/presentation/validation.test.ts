import { describe, expect, it } from 'vitest'

import {
  boundedPasswordInput,
  exceedsUtf8Limit,
  PASSWORD_WIRE_MAX_BYTES,
  utf8Length,
  validBoundedText,
  validEmail,
  validPasswordInput,
} from './validation'

describe('identity form bounds', () => {
  it('counts UTF-8 bytes rather than JavaScript code units', () => {
    expect(utf8Length('é')).toBe(2)
    expect(exceedsUtf8Limit('你好', 5)).toBe(true)
    expect(validBoundedText('你好', 6)).toBe(true)
  })

  it('applies the wire byte ceiling to email input', () => {
    expect(validEmail('person@example.com')).toBe(true)
    expect(validEmail(`${'é'.repeat(122)}@example.com`)).toBe(false)
  })

  it('rejects protocol control characters', () => {
    expect(validBoundedText('valid\nnot', 32)).toBe(false)
  })

  it('admits multibyte passwords through the shared 16-KiB wire boundary', () => {
    const accepted = '界'.repeat(384)
    const exact = '😀'.repeat(PASSWORD_WIRE_MAX_BYTES / 4)
    const oversized = `${exact}a`
    expect(utf8Length(accepted)).toBeGreaterThan(1_024)
    expect(validPasswordInput(accepted)).toBe(true)
    expect(boundedPasswordInput(accepted)).toBe(accepted)
    expect(validPasswordInput(exact)).toBe(true)
    expect(boundedPasswordInput(oversized)).toBeNull()
    expect(validPasswordInput(oversized)).toBe(false)
  })
})
