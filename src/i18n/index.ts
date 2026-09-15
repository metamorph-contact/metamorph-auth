import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import commonEn from './locales/en/common.json'
import authenticationEn from './locales/en/authentication.json'
import errorsEn from './locales/en/errors.json'
import imageEditorEn from './locales/en/image-editor.json'
import catalogEn from './locales/en/catalog.json'
import securityActivityEn from './locales/en/security-activity.json'

export const SUPPORTED_LOCALES = ['en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale)
}

function mergeBundles(...bundles: Readonly<Record<string, string>>[]): Record<string, string> {
  const messages: Record<string, string> = {}
  for (const bundle of bundles) {
    for (const [key, message] of Object.entries(bundle)) {
      if (Object.hasOwn(messages, key)) throw new Error(`Duplicate translation key: ${key}`)
      messages[key] = message
    }
  }
  return messages
}

export const EN_MESSAGES = Object.freeze(mergeBundles(commonEn, authenticationEn, errorsEn, imageEditorEn, catalogEn, securityActivityEn))

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: false,
  supportedLngs: [...SUPPORTED_LOCALES],
  resources: { en: { translation: EN_MESSAGES } },
  interpolation: { escapeValue: false },
  returnNull: false,
})

document.documentElement.lang = 'en'
document.documentElement.dir = i18n.dir('en')

export async function setLocale(locale: string): Promise<void> {
  if (!isSupportedLocale(locale)) throw new Error('Unsupported locale')
  await i18n.changeLanguage(locale)
  document.documentElement.lang = locale
  document.documentElement.dir = i18n.dir(locale)
}

export default i18n
