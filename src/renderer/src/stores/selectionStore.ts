import { create } from 'zustand'

interface SelectionState {
    selectedTemplateId: string | null
    selectedElementId: string | null
    fieldValues: Record<string, string>
    setSelectedTemplateId: (id: string | null) => void
    setSelectedElementId: (id: string | null) => void
    setFieldValues: (values: Record<string, string>) => void
    updateField: (tag: string, value: string) => void
    clearSelection: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selectedTemplateId: null,
    selectedElementId: null,
    fieldValues: {},
    setSelectedTemplateId: (id) => set({
        selectedTemplateId: id,
        selectedElementId: null,
        fieldValues: {}
    }),
    setSelectedElementId: (id) => set({
        selectedElementId: id,
        selectedTemplateId: null,
        fieldValues: {}
    }),
    setFieldValues: (fieldValues) => set({ fieldValues }),
    updateField: (tag, value) => set((state) => ({
        fieldValues: { ...state.fieldValues, [tag]: value }
    })),
    clearSelection: () => set({
        selectedTemplateId: null,
        selectedElementId: null,
        fieldValues: {}
    }),
}))
