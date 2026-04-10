import { io, Socket } from 'socket.io-client'
import { useConnectionStore } from '../stores/connectionStore'

let socket: Socket | null = null

export function initializeSecureSocket(): Socket {
    if (socket) {
        return socket
    }

    const { host, port } = useConnectionStore.getState()
    const url = `http://${host}:${port}`
    const API_KEY = import.meta.env?.VITE_MRS_API_KEY || ''

    socket = io(url, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket'],
        // Security options
        secure: false, // Switching to HTTP as requested
        rejectUnauthorized: import.meta.env.PROD,
        query: {
            api_key: API_KEY
        },
        // Add JWT token if available inside auth
        auth: {
            token: localStorage.getItem('auth_token') || undefined
        }
    })

    // Handle connection events
    socket.on('connect', () => {
        console.log('WebSocket connected')
    })

    socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
    })

    socket.on('error', (error) => {
        console.error('WebSocket error:', error)
    })

    // Handle authentication errors
    socket.on('auth_error', (error) => {
        console.error('Authentication error:', error)
        // Clear invalid token
        localStorage.removeItem('auth_token')
        socket?.disconnect()
    })

    return socket
}

export function getSocket(): Socket | null {
    return socket
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

// Subscribe to channel events with validation
export function subscribeToChannel(channelId: string, callback: (data: any) => void): void {
    if (!socket) {
        console.error('Socket not initialized')
        return
    }

    // Validate channel ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(channelId)) {
        console.error('Invalid channel ID format')
        return
    }

    socket.emit('subscribe', `channel:${channelId}`)
    socket.on(`channel:${channelId}:events`, (data) => {
        // Validate received data
        if (typeof data === 'object' && data !== null) {
            callback(data)
        }
    })
}

// Unsubscribe from channel
export function unsubscribeFromChannel(channelId: string): void {
    if (!socket) return

    socket.emit('unsubscribe', `channel:${channelId}`)
    socket.off(`channel:${channelId}:events`)
}
