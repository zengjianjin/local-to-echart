const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron')
const path = require('node:path')
const { detectSystemLocale, isSupportedLocale, messagesFor } = require('./i18n.cjs')

const devUrl = process.env.VLE_DEV_URL || ''
const isDev = Boolean(devUrl) && !app.isPackaged

let mainWindow = null
let currentLocale = 'zh-CN'

function openExternal(url) {
  if (/^https?:\/\//.test(url)) {
    shell.openExternal(url)
  }
}

function applyLocalizedUi() {
  const texts = messagesFor(currentLocale)
  mainWindow?.setTitle(texts.windowTitle)
  if (!isDev) {
    Menu.setApplicationMenu(null)
    return
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'editMenu' },
      { role: 'viewMenu' },
      {
        label: texts.menuDev,
        submenu: [
          { role: 'reload', label: texts.menuReload },
          { role: 'forceReload', label: texts.menuForceReload },
          { role: 'toggleDevTools', label: texts.menuToggleDevTools },
        ],
      },
    ]),
  )
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1560,
    height: 940,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#0B1120',
    title: messagesFor(currentLocale).windowTitle,
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDev) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    if (isDev) mainWindow?.webContents.openDevTools({ mode: 'detach' })
  })

  mainWindow.webContents.on('console-message', (event) => {
    console.error(`[renderer:${event.level}] ${event.message}`)
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isDev && url.startsWith(devUrl)) return
    if (url.startsWith('file://')) return
    event.preventDefault()
    openExternal(url)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  applyLocalizedUi()
}

ipcMain.on('i18n:set-locale', (_event, locale) => {
  if (!isSupportedLocale(locale) || locale === currentLocale) return
  currentLocale = locale
  applyLocalizedUi()
})

app.whenReady().then(() => {
  currentLocale = detectSystemLocale(app.getLocale())
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
