const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('node:path')

const devUrl = process.env.VLE_DEV_URL || ''
const isDev = Boolean(devUrl) && !app.isPackaged

let mainWindow = null

function openExternal(url) {
  if (/^https?:\/\//.test(url)) {
    shell.openExternal(url)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1560,
    height: 940,
    minWidth: 1180,
    minHeight: 720,
    backgroundColor: '#0B1120',
    title: 'Local to ECharts Studio',
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
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

  if (isDev) {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { role: 'appMenu' },
        { role: 'editMenu' },
        { role: 'viewMenu' },
        {
          label: '开发',
          submenu: [
            { role: 'reload', label: '重新加载' },
            { role: 'forceReload', label: '强制重新加载' },
            { role: 'toggleDevTools', label: '切换开发者工具' },
          ],
        },
      ]),
    )
  } else {
    Menu.setApplicationMenu(null)
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
