import { ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { SecureStorage } from '../security/secure-storage'

// Whitelist of allowed IPC channels
const ALLOWED_CHANNELS = {
    'config:get': true,
    'config:set': true,
    'hardware:button': true,
    'playout:take': true,
    'playout:out': true,
    'dialog:openFile': true,
    'dialog:saveShow': true,
    'dialog:importShow': true
}

// Validate IPC channel access
function validateChannel(channel: string): boolean {
    return ALLOWED_CHANNELS[channel as keyof typeof ALLOWED_CHANNELS] === true
}

// Validate IPC message structure
function validateMessage(message: any): boolean {
    if (typeof message !== 'object' || message === null) {
        return false
    }
    return true
}

export function setupSecureIPC(): void {
    console.log('[Main] Setting up secure IPC handlers...')
    // Config get handler
    ipcMain.handle('config:get', (_event: IpcMainInvokeEvent, key: string) => {
        if (!validateChannel('config:get')) {
            throw new Error('Unauthorized channel')
        }

        // Validate key format (alphanumeric + underscore only)
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
            throw new Error('Invalid config key')
        }

        try {
            return SecureStorage.getConfig(key)
        } catch (error) {
            console.error('Config get error:', error)
            throw new Error('Failed to retrieve config')
        }
    })

    // Config set handler
    ipcMain.handle('config:set', (_event: IpcMainInvokeEvent, key: string, value: string) => {
        if (!validateChannel('config:set')) {
            throw new Error('Unauthorized channel')
        }

        // Validate inputs
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
            throw new Error('Invalid config key')
        }

        if (typeof value !== 'string' || value.length > 10000) {
            throw new Error('Invalid config value')
        }

        try {
            SecureStorage.saveConfig(key, value)
            return { success: true }
        } catch (error) {
            console.error('Config set error:', error)
            throw new Error('Failed to save config')
        }
    })

    // Hardware button handler
    ipcMain.on('hardware:button', (_event: IpcMainEvent, button: number) => {
        if (!validateChannel('hardware:button')) {
            console.error('Unauthorized hardware channel')
            return
        }

        if (typeof button !== 'number' || button < 0 || button > 255) {
            console.error('Invalid button number')
            return
        }

        // Process hardware button event
        console.log(`Hardware button pressed: ${button}`)
    })

    // Playout take handler
    ipcMain.handle('playout:take', (_event: IpcMainInvokeEvent, params: any) => {
        if (!validateChannel('playout:take')) {
            throw new Error('Unauthorized channel')
        }

        if (!validateMessage(params)) {
            throw new Error('Invalid message format')
        }

        // Validate required fields
        if (!params.showId || !params.elementId || !params.channelId) {
            throw new Error('Missing required parameters')
        }

        console.log('Playout take:', params)
        return { success: true, timestamp: Date.now() }
    })

    // Playout out handler
    ipcMain.handle('playout:out', (_event: IpcMainInvokeEvent, params: any) => {
        if (!validateChannel('playout:out')) {
            throw new Error('Unauthorized channel')
        }

        if (!validateMessage(params)) {
            throw new Error('Invalid message format')
        }

        if (!params.channelId) {
            throw new Error('Missing channel ID')
        }

        console.log('Playout out:', params)
        return { success: true, timestamp: Date.now() }
    })

    // Dialog open file handler
    console.log('[Main] Registering dialog:openFile handler')
    ipcMain.handle('dialog:openFile', async (_event: IpcMainInvokeEvent) => {
        if (!validateChannel('dialog:openFile')) {
            throw new Error('Unauthorized channel')
        }

        const { dialog, BrowserWindow } = require('electron')
        const focusedWindow = BrowserWindow.getFocusedWindow()

        if (!focusedWindow) {
            throw new Error('No focused window')
        }

        const result = await dialog.showOpenDialog(focusedWindow, {
            title: 'Import Everest Scene',
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Everest Scene', extensions: ['sum'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        })

        if (result.canceled || result.filePaths.length === 0) {
            return []
        }

        return result.filePaths
    })

    // Save show export handler
    ipcMain.handle('dialog:saveShow', async (_event: IpcMainInvokeEvent, data: string, filename: string) => {
        if (!validateChannel('dialog:saveShow')) {
            throw new Error('Unauthorized channel')
        }

        const { dialog, BrowserWindow } = require('electron')
        const fs = require('fs')
        const focusedWindow = BrowserWindow.getFocusedWindow()

        if (!focusedWindow) {
            throw new Error('No focused window')
        }

        const result = await dialog.showSaveDialog(focusedWindow, {
            title: 'Export Show Configuration',
            defaultPath: filename,
            filters: [
                { name: 'JSON Configuration', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        })

        if (result.canceled || !result.filePath) {
            return { canceled: true }
        }

        try {
            fs.writeFileSync(result.filePath, data, 'utf-8')
            return { success: true, filePath: result.filePath }
        } catch (error) {
            console.error('File save error:', error)
            throw new Error('Failed to save file')
        }
    })

    // Import show handler
    ipcMain.handle('dialog:importShow', async (_event: IpcMainInvokeEvent) => {
        if (!validateChannel('dialog:importShow')) {
            throw new Error('Unauthorized channel')
        }

        const { dialog, BrowserWindow } = require('electron')
        const fs = require('fs')
        const focusedWindow = BrowserWindow.getFocusedWindow()

        if (!focusedWindow) {
            throw new Error('No focused window')
        }

        const result = await dialog.showOpenDialog(focusedWindow, {
            title: 'Import Show Configuration',
            properties: ['openFile'],
            filters: [
                { name: 'JSON Configuration', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        })

        if (result.canceled || result.filePaths.length === 0) {
            return { canceled: true }
        }

        try {
            const content = fs.readFileSync(result.filePaths[0], 'utf-8')
            return { success: true, content: JSON.parse(content) }
        } catch (error) {
            console.error('File read error:', error)
            throw new Error('Failed to read or parse file')
        }
    })
}
