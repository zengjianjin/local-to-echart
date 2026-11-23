const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setLocale: (locale) => ipcRenderer.send('i18n:set-locale', locale),
})
