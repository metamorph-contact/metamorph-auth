import { describe, expect, it } from 'vitest'

import { exceedsUtf8Limit, normalizeEmailForWire, utf8Length, validBoundedText, validEmail } from './validation'

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

  it('sends Unicode and A-label domains with the same canonical bytes', () => {
    expect(normalizeEmailForWire('Person@BÜCHER.example')).toBe('person@xn--bcher-kva.example')
    expect(normalizeEmailForWire('person@xn--bcher-kva.example')).toBe('person@xn--bcher-kva.example')
    expect(normalizeEmailForWire(' Person@GMAIL.COM ')).toBe('person@gmail.com')
    expect(normalizeEmailForWire('pérson@example.com')).toBeNull()
    expect(normalizeEmailForWire('person@example.com.')).toBeNull()
    expect(normalizeEmailForWire('person@127.0.0.1')).toBeNull()
    expect(normalizeEmailForWire(`person@${'\u00ad'.repeat(520)}example.com`)).toBeNull()
  })

  it('rejects protocol control characters', () => {
    expect(validBoundedText('valid\nnot', 32)).toBe(false)
  })
})
