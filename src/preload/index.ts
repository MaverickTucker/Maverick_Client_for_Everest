const { contextBridge, ipcRenderer } = require('electron')
const { electronAPI } = require('@electron-toolkit/preload')

// Custom APIs for renderer
const api = {
    quitApp: () => ipcRenderer.send('app:quit'),
    saveShowExport: (data: string, filename: string) => ipcRenderer.invoke('dialog:saveShow', data, filename),
    importShowFile: () => ipcRenderer.invoke('dialog:importShow')
}

// Use `contextBridge` APIs to expose Electron APIs to renderer
try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
} catch (error) {
    console.error(error)
}
