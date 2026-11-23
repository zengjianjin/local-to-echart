import { i18n } from './index'
import type { MessageParams } from './types'

type Translator = (key: string, params?: MessageParams) => string

const globalTranslate = i18n.global.t.bind(i18n.global) as Translator

export function translate(key: string, params?: MessageParams): string {
  return globalTranslate(key, params)
}
