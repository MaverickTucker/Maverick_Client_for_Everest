import { create } from 'zustand'

interface SelectionState {
    selectedTemplateId: string | null
    selectedElementId: string | null
    focusedTemplateId: string | null
    focusedElementId: string | null
    fieldValues: Record<string, string>
    setSelectedTemplateId: (id: string | null) => void
    setSelectedElementId: (id: string | null) => void
    setFocusedTemplateId: (id: string | null) => void
    setFocusedElementId: (id: string | null) => void
    setFieldValues: (values: Record<string, string>) => void
    updateField: (tag: string, value: string) => void
    clearSelection: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selectedTemplateId: null,
    selectedElementId: null,
    focusedTemplateId: null,
    focusedElementId: null,
    fieldValues: {},
    setSelectedTemplateId: (id) => set({
        selectedTemplateId: id,
        focusedTemplateId: id,
        selectedElementId: null,
        focusedElementId: null,
        fieldValues: {}
    }),
    setSelectedElementId: (id) => set({
        selectedElementId: id,
        focusedElementId: id,
        selectedTemplateId: null,
        focusedTemplateId: null,
        fieldValues: {}
    }),
    setFocusedTemplateId: (id) => set({
        focusedTemplateId: id,
        focusedElementId: null,
    }),
    setFocusedElementId: (id) => set({
        focusedElementId: id,
        focusedTemplateId: null,
    }),
    setFieldValues: (fieldValues) => set({ fieldValues }),
    updateField: (tag, value) => set((state) => ({
        fieldValues: { ...state.fieldValues, [tag]: value }
    })),
    clearSelection: () => set({
        selectedTemplateId: null,
        selectedElementId: null,
        focusedTemplateId: null,
        focusedElementId: null,
        fieldValues: {}
    }),
}))
