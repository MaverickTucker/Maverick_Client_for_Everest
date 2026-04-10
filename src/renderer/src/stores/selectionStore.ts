import { create } from 'zustand'

interface SelectionState {
    selectedTemplateId: string | null
    selectedElementId: string | null
    setSelectedTemplateId: (id: string | null) => void
    setSelectedElementId: (id: string | null) => void
    clearSelection: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selectedTemplateId: null,
    selectedElementId: null,
    setSelectedTemplateId: (id) => set({ selectedTemplateId: id, selectedElementId: null }),
    setSelectedElementId: (id) => set({ selectedElementId: id, selectedTemplateId: null }),
    clearSelection: () => set({ selectedTemplateId: null, selectedElementId: null }),
}))
