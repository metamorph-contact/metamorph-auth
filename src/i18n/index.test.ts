import { describe, expect, it } from 'vitest'

import i18n, { EN_MESSAGES, setLocale } from './index'

describe('identity translations', () => {
  it('registers one non-empty value per English key', () => {
    expect(Object.keys(EN_MESSAGES).length).toBe(new Set(Object.keys(EN_MESSAGES)).size)
    expect(Object.values(EN_MESSAGES).every((message) => message.trim().length > 0)).toBe(true)
  })

  it('sets both language and direction on the document root', async () => {
    await setLocale('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('uses distinct singular and plural account-unavailability copy', () => {
    expect(i18n.t('auth.chooseAccount.unavailable', { count: 1 })).toContain('1 signed-in account could')
    expect(i18n.t('auth.chooseAccount.unavailable', { count: 2 })).toContain('2 signed-in accounts could')
  })
})
