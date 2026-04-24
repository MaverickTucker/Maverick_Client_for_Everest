import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PanelSizes {
  leftColumn: number
  rightColumn: number
  leftVerticalSplit: number
  rightVerticalSplit: number
}


interface LayoutState {
  panelSizes: PanelSizes
  setPanelSize: (panel: keyof PanelSizes, size: number) => void
  callupBuffer: string
  appendCallup: (digit: string) => void
  setCallup: (value: string) => void
  clearCallup: () => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      panelSizes: {
        leftColumn: 50,
        rightColumn: 50,
        leftVerticalSplit: 50,
        rightVerticalSplit: 50
      },

      setPanelSize: (panel, size) =>
        set((state) => ({
          panelSizes: {
            ...state.panelSizes,
            [panel]: size
          }
        })),

      callupBuffer: '',
      appendCallup: (digit) =>
        set((state) => ({
          callupBuffer: (state.callupBuffer + digit).slice(-4)
        })),
      setCallup: (value) => set({ callupBuffer: value.slice(-4) }),
      clearCallup: () => set({ callupBuffer: '' })
    }),
    { name: 'layout-storage' }
  )
)

