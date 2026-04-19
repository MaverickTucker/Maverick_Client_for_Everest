import { create } from 'zustand'

interface SelectionState {
    selectedTemplateId: string | null
    selectedElementId: string | null
    focusedTemplateId: string | null
    focusedElementId: string | null
    fieldValues: Record<string, string>
    templateOverrides: Record<string, { channelId: string, layer: number }>
    elementOverrides: Record<string, { channelId: string, layer: number }>
    selectionVersion: number
    setSelectedTemplateId: (id: string | null) => void
    setSelectedElementId: (id: string | null) => void
    setFocusedTemplateId: (id: string | null) => void
    setFocusedElementId: (id: string | null) => void
    setFieldValues: (values: Record<string, string>) => void
    updateField: (tag: string, value: string) => void
    updateTemplateOverride: (id: string, channelId: string, layer: number) => void
    updateElementOverride: (id: string, channelId: string, layer: number) => void
    clearSelection: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selectedTemplateId: null,
    selectedElementId: null,
    focusedTemplateId: null,
    focusedElementId: null,
    fieldValues: {},
    templateOverrides: {},
    elementOverrides: {},
    selectionVersion: 0,
    setSelectedTemplateId: (id) => set((state) => ({
        selectedTemplateId: id,
        focusedTemplateId: id,
        selectedElementId: null,
        focusedElementId: null,
        fieldValues: {},
        selectionVersion: state.selectionVersion + 1
    })),
    setSelectedElementId: (id) => set((state) => ({
        selectedElementId: id,
        focusedElementId: id,
        selectedTemplateId: null,
        focusedTemplateId: null,
        fieldValues: {},
        selectionVersion: state.selectionVersion + 1
    })),
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
    updateTemplateOverride: (id, channelId, layer) => set((state) => ({
        templateOverrides: { ...state.templateOverrides, [id]: { channelId, layer } }
    })),
    updateElementOverride: (id, channelId, layer) => set((state) => ({
        elementOverrides: { ...state.elementOverrides, [id]: { channelId, layer } }
    })),
    clearSelection: () => set({
        selectedTemplateId: null,
        selectedElementId: null,
        focusedTemplateId: null,
        focusedElementId: null,
        fieldValues: {},
        templateOverrides: {},
        elementOverrides: {}
    }),
}))
