import type { Locale } from '../types'
import enUS from './en-US'
import zhCN from './zh-CN'
import zhTW from './zh-TW'

export type AppMessages = typeof zhCN

export const messages = {
  'zh-CN': zhCN,
  'zh-TW': zhTW satisfies AppMessages,
  'en-US': enUS satisfies AppMessages,
} satisfies Record<Locale, AppMessages>
