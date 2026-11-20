// Electron main process. The renderer is a plain Vite/Vue app -- all product
// logic (parsing, charts, exports) runs in the renderer, so no preload or
// native bridge is needed. Keep nodeIntegration off and contextIsolation on.
const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('node:path')

const DEV_URL = process.env.VLE_DEV_URL || 'http://localhost:1420'
const isDev = !app.isPackaged

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'local-to-echarts · 本地数据看图工具',
    backgroundColor: '#f6f7fb',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  if (isDev) {
    mainWindow.loadURL(DEV_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Open any http(s) link in the system browser instead of replacing the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isDev && url.startsWith(DEV_URL)) return
    if (/^https?:/i.test(url)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  // Minimal menu: no menu bar in production, reload + devtools in development.
  if (isDev) {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {
        label: 'View',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
          { role: 'toggleDevTools' },
        ],
      },
    ]))
  } else {
    Menu.setApplicationMenu(null)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
