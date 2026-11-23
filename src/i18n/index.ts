import { createI18n } from 'vue-i18n'
import { detectInitialLocale } from './language'
import { messages } from './locales'
import type { Locale } from './types'

const initialLocale = detectInitialLocale()

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: 'zh-CN',
  messages,
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
})

export function currentLocale(): Locale {
  return i18n.global.locale.value as Locale
}

export function setI18nLocale(locale: Locale): void {
  i18n.global.locale.value = locale
}
