import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NDISource {
    name: string
    address: string
}

interface NDIState {
    sources: NDISource[]
    selectedSource: string | null
    previewFrame: string | null // Base64 JPEG data URI
    isConnected: boolean
    isConnecting: boolean
    lastError: string | null

    // Actions
    setSources: (sources: NDISource[]) => void
    setSelectedSource: (sourceName: string | null) => void
    setPreviewFrame: (data: string) => void
    connect: () => void
    disconnect: () => void
    sendMessage: (msg: any) => void
}

let socket: WebSocket | null = null

export const useNDIStore = create<NDIState>()(
    persist(
        (set, get) => ({
            sources: [],
            selectedSource: null,
            previewFrame: null,
            isConnected: false,
            isConnecting: false,
            lastError: null,

            setSources: (sources) => set({ sources }),
            setSelectedSource: (sourceName) => {
                console.log('[NDI Store] Selecting source:', sourceName)
                set({ selectedSource: sourceName })
                get().sendMessage({ type: 'SELECT_SOURCE', name: sourceName })
            },
            setPreviewFrame: (data) => set({ previewFrame: data }),

            connect: () => {
                if (socket || get().isConnected) return

                set({ isConnecting: true, lastError: null })

                // Default C++ NDI Bridge port
                const wsUrl = 'ws://127.0.0.1:8192'

                try {
                    socket = new WebSocket(wsUrl)
                    socket.binaryType = 'arraybuffer'

                    socket.onopen = () => {
                        console.log('[NDI Store] Connected to Bridge')
                        set({ isConnected: true, isConnecting: false })
                    }

                    socket.onmessage = (event) => {
                        if (event.data instanceof ArrayBuffer) {
                            console.log(`[NDI Store] Received binary frame: ${event.data.byteLength} bytes`)
                            const blob = new Blob([event.data], { type: 'image/jpeg' })
                            const url = URL.createObjectURL(blob)

                            // Revoke old URL to prevent memory leaks
                            const oldUrl = get().previewFrame
                            if (oldUrl && oldUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(oldUrl)
                            }

                            set({ previewFrame: url })
                            return
                        }

                        try {
                            const data = JSON.parse(event.data)
                            console.log('[NDI Store] Received JSON:', data.type)
                            switch (data.type) {
                                case 'SOURCE_LIST':
                                    set({ sources: data.sources })
                                    break
                                case 'FRAME_DATA':
                                    // Fallback for legacy Base64 if needed, though bridge is now binary
                                    set({ previewFrame: data.image })
                                    break
                                case 'ERROR':
                                    set({ lastError: data.message })
                                    break
                            }
                        } catch (e) {
                            console.error('[NDI Store] Failed to parse message', e)
                        }
                    }

                    socket.onclose = () => {
                        console.log('[NDI Store] Disconnected from Bridge')
                        set({ isConnected: false, isConnecting: false })
                        socket = null
                        // Auto-reconnect after 5 seconds
                        setTimeout(() => get().connect(), 5000)
                    }

                    socket.onerror = (err) => {
                        console.error('[NDI Store] WebSocket Error', err)
                        set({ isConnected: false, isConnecting: false, lastError: 'Connection failed' })
                    }
                } catch (error) {
                    set({ isConnecting: false, lastError: 'Failed to initialize WebSocket' })
                }
            },

            disconnect: () => {
                if (socket) {
                    socket.close()
                    socket = null
                }
                set({ isConnected: false })
            },

            sendMessage: (msg) => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    console.log('[NDI Store] Sending message to Bridge:', msg)
                    socket.send(JSON.stringify(msg))
                } else {
                    console.warn('[NDI Store] Cannot send message, socket not open')
                }
            }
        }),
        {
            name: 'maverick-ndi-storage',
            partialize: (state) => ({ selectedSource: state.selectedSource }),
        }
    )
)
