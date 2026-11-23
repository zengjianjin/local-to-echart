import type { Locale } from './types'

export const LOCALE_STORAGE_KEY = 'echarts-studio-locale'
export const SUPPORTED_LOCALES: readonly Locale[] = ['zh-CN', 'zh-TW', 'en-US']
export const DEFAULT_LOCALE: Locale = 'zh-CN'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale)
}

function browserLanguageCandidates(): string[] {
  if (typeof navigator === 'undefined') return []
  const candidates = [navigator.language, ...(navigator.languages ?? [])].filter(Boolean)
  return candidates.map((candidate) => candidate.toLowerCase())
}

export function detectSystemLocale(): Locale {
  for (const candidate of browserLanguageCandidates()) {
    if (candidate.startsWith('zh')) {
      if (
        candidate.includes('hant') ||
        candidate.includes('-tw') ||
        candidate.includes('-hk') ||
        candidate.includes('-mo')
      ) {
        return 'zh-TW'
      }
      return 'zh-CN'
    }
    if (candidate.startsWith('en')) return 'en-US'
  }
  return DEFAULT_LOCALE
}

export function readStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

export function detectInitialLocale(): Locale {
  return readStoredLocale() ?? detectSystemLocale()
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore storage failures; the in-memory locale still applies.
  }
}
