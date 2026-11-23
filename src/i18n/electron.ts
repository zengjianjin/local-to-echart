import type { Locale } from './types'

export function notifyElectronLocale(locale: Locale): void {
  try {
    window.electronAPI?.setLocale?.(locale)
  } catch {
    // The app also runs in a plain browser where the bridge is absent.
  }
}
