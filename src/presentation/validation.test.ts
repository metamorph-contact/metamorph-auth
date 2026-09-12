import { describe, expect, it } from 'vitest'

import { exceedsUtf8Limit, utf8Length, validBoundedText, validEmail } from './validation'

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
})
