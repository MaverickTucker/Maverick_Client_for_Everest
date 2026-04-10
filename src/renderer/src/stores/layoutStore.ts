import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PanelSizes {
  leftColumn: number
  topRight: number
}

interface LayoutState {
  panelSizes: PanelSizes
  collapsedPanels: {
    templates: boolean
    elements: boolean
    fieldEditor: boolean
    preview: boolean
  }
  setPanelSize: (panel: keyof PanelSizes, size: number) => void
  togglePanel: (panel: keyof LayoutState['collapsedPanels']) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      panelSizes: {
        leftColumn: 30,
        topRight: 50
      },
      collapsedPanels: {
        templates: false,
        elements: false,
        fieldEditor: false,
        preview: false
      },
      setPanelSize: (panel, size) =>
        set((state) => ({
          panelSizes: {
            ...state.panelSizes,
            [panel]: size
          }
        })),
      togglePanel: (panel) =>
        set((state) => ({
          collapsedPanels: {
            ...state.collapsedPanels,
            [panel]: !state.collapsedPanels[panel]
          }
        }))
    }),
    { name: 'layout-storage' }
  )
)
