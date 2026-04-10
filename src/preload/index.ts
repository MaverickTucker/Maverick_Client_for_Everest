const { contextBridge } = require('electron')
const { electronAPI } = require('@electron-toolkit/preload')

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to renderer
try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
} catch (error) {
    console.error(error)
}
