const messages = {
  'zh-CN': {
    windowTitle: 'Local to ECharts Studio',
    menuDev: '开发',
    menuReload: '重新加载',
    menuForceReload: '强制重新加载',
    menuToggleDevTools: '切换开发者工具',
  },
  'zh-TW': {
    windowTitle: 'Local to ECharts Studio',
    menuDev: '開發',
    menuReload: '重新載入',
    menuForceReload: '強制重新載入',
    menuToggleDevTools: '切換開發者工具',
  },
  'en-US': {
    windowTitle: 'Local to ECharts Studio',
    menuDev: 'Developer',
    menuReload: 'Reload',
    menuForceReload: 'Force reload',
    menuToggleDevTools: 'Toggle Developer Tools',
  },
}

function isSupportedLocale(value) {
  return value === 'zh-CN' || value === 'zh-TW' || value === 'en-US'
}

function normalizeLocale(value) {
  return isSupportedLocale(value) ? value : 'zh-CN'
}

function detectSystemLocale(value) {
  if (typeof value !== 'string') return 'zh-CN'
  const locale = value.toLowerCase()
  if (locale.startsWith('en')) return 'en-US'
  if (locale.includes('hant') || locale.includes('-tw') || locale.includes('-hk') || locale.includes('-mo')) {
    return 'zh-TW'
  }
  return 'zh-CN'
}

function messagesFor(locale) {
  return messages[normalizeLocale(locale)]
}

module.exports = {
  messages,
  isSupportedLocale,
  normalizeLocale,
  detectSystemLocale,
  messagesFor,
}
