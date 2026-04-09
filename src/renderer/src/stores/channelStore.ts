import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChannelState {
    pgm: { templateId?: string; elementId?: string; tags?: any } | null
    pvw: { templateId?: string; elementId?: string; tags?: any } | null
    setPGM: (state: any) => void
    setPVW: (state: any) => void
    handleEvent: (event: any) => void
}

export const useChannelStore = create<ChannelState>()(
    persist(
        (set) => ({
            pgm: null,
            pvw: null,
            setPGM: (pgm) => set({ pgm }),
            setPVW: (pvw) => set({ pvw }),
            handleEvent: (event) => {
                if (event.type === 'take') {
                    set({ pgm: event.data })
                }
            }
        }),
        { name: 'channel-storage' }
    )
)
