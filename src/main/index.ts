import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { enforceSecurity } from './security/anti-debug'
import { IntegrityCheck } from './security/integrity'
import { CertificatePinning } from './security/certificate-pinning'
import { setupSecureIPC } from './ipc/secure-handlers'

// Enforce broadcast security
enforceSecurity()

if (is.dev) {
    app.commandLine.appendSwitch('ignore-certificate-errors')
}

// Verify app integrity
if (!IntegrityCheck.verify()) {
    console.error('Integrity check failed - exiting')
    app.quit()
}

// Setup certificate pinning
CertificatePinning.setupPinning()

// Setup secure IPC handlers
setupSecureIPC()

function createWindow(): void {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.maverick.everest')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC test
    ipcMain.on('ping', () => console.log('pong'))

    // Bypass CORS for local MRS connections in development
    if (is.dev) {
        const { session } = require('electron')
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            const corsHeaders = {
                'Access-Control-Allow-Origin': ['*'],
                'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS'],
                'Access-Control-Allow-Headers': ['*']
            }

            const lowerUrl = details.url.toLowerCase()
            if (lowerUrl.includes('127.0.0.1') || lowerUrl.includes('localhost') || lowerUrl.includes('0.0.0.0')) {
                callback({
                    responseHeaders: {
                        ...details.responseHeaders,
                        ...corsHeaders
                    }
                })
            } else {
                callback({ responseHeaders: details.responseHeaders })
            }
        })
    }

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
