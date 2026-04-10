import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ShowState {
    activeShowId: string | null
    activeShowName: string | null
    setActiveShow: (id: string, name: string) => void
    clearActiveShow: () => void
}

export const useShowStore = create<ShowState>()(
    persist(
        (set) => ({
            activeShowId: null,
            activeShowName: null,
            setActiveShow: (id: string, name: string) => set({ activeShowId: id, activeShowName: name }),
            clearActiveShow: () => set({ activeShowId: null, activeShowName: null }),
        }),
        {
            name: 'maverick-active-show',
        }
    )
)
