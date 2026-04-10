import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConnectionState {
    host: string
    port: string
    isConnected: boolean
    isConnecting: boolean
    connect: (host: string, port: string) => Promise<boolean>
    disconnect: () => void
}

export const useConnectionStore = create<ConnectionState>()(
    persist(
        (set) => ({
            host: '127.0.0.1',
            port: '8188',
            isConnected: false,
            isConnecting: false,

            connect: async (host: string, port: string) => {
                set({ isConnecting: true })
                // In a real app we might ping the server or check window.api.invoke('ping')
                // For now, assume success when they hit connect!
                // We defer latency simulation just for a nice UI
                return new Promise<boolean>((resolve) => {
                    setTimeout(() => {
                        set({ host, port, isConnected: true, isConnecting: false })
                        resolve(true)
                    }, 800)
                })
            },

            disconnect: () => set({ isConnected: false }),
        }),
        {
            name: 'maverick-connection',
            partialize: (state) => ({ host: state.host, port: state.port }),
        }
    )
)
