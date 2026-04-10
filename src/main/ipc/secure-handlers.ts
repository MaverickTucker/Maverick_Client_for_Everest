import { ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { SecureStorage } from '../security/secure-storage'

// Whitelist of allowed IPC channels
const ALLOWED_CHANNELS = {
    'config:get': true,
    'config:set': true,
    'hardware:button': true,
    'playout:take': true,
    'playout:out': true
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
}
