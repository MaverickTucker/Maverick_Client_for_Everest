import { app } from 'electron'

export function checkDebugger(): boolean {
    // Basic check for development mode
    if (process.env.NODE_ENV === 'development') return false

    // check if debug port is open or other flags
    const isDebug = process.spawnargs.some((arg) => arg.includes('--inspect') || arg.includes('--remote-debugging-port'))

    return isDebug
}

export function enforceSecurity(): void {
    if (checkDebugger()) {
        console.error('Security violation: Debugger detected')
        app.quit()
    }
}
