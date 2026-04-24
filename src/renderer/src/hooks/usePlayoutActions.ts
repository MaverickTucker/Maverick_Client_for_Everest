import { useShowStore } from '../stores/showStore'
import { useSelectionStore } from '../stores/selectionStore'
import { useConfigStore } from '../stores/configStore'
import { useTake, useOut, useCont, useUpdatePlayout } from './usePlayout'
import { usePlayoutMeta } from './usePlayoutMeta'

/**
 * Shared hook for all playout actions (Take, Out, Continue).
 * Reads channel/layer from per-item overrides in selectionStore (set via the
 * channel/layer dropdowns in the UI), falling back to the PGM channel default.
 * Uses getState() snapshots to avoid stale closure bugs.
 * Used by both Menu.tsx buttons and Layout.tsx Numpad handlers.
 */
export function usePlayoutActions() {
    const activeShowId = useShowStore((state) => state.activeShowId)
    const { getMeta } = usePlayoutMeta(activeShowId)

    const takeMutation = useTake()
    const outMutation = useOut()
    const contMutation = useCont()
    const updatePlayoutMutation = useUpdatePlayout()

    /** Resolve the channel/layer to use for a given element/template ID. */
    function resolveChannel(elementId: string, isElement: boolean) {
        const { elementOverrides, templateOverrides } = useSelectionStore.getState()
        const channels = useConfigStore.getState().channels
        const pgmChannel = channels.find(c => c.role === 'PGM') || channels[0]
        const override = isElement ? elementOverrides[elementId] : templateOverrides[elementId]
        return {
            channelId: override?.channelId || pgmChannel?.id || '',
            layer: override?.layer || 1
        }
    }

    const handleTake = async () => {
        // Always use fieldValues from the store — this contains the user's latest edits
        // from the Field Editor, regardless of whether it's an element or template.
        const { selectedElementId, selectedTemplateId, fieldValues } = useSelectionStore.getState()

        if (!activeShowId) return
        const isElement = !!selectedElementId
        const elementId = selectedElementId || selectedTemplateId
        if (!elementId) return

        const { channelId, layer } = resolveChannel(elementId, isElement)
        if (!channelId) return

        try {
            const { name, templateId, container } = getMeta(elementId, isElement ? 'element' : 'template')
            await takeMutation.mutateAsync({
                showId: activeShowId,
                elementId,
                itemType: isElement ? 'element' : 'template',
                channelId,
                layer,
                name,
                templateId,
                container,
                data: fieldValues
            })
        } catch (err) {
            console.error('TAKE action failed:', err)
            alert('Failed to trigger TAKE. Verify engine health.')
        }
    }

    const handleOut = async () => {
        const { selectedElementId, selectedTemplateId } = useSelectionStore.getState()

        if (!activeShowId) return
        const isElement = !!selectedElementId
        const elementId = selectedElementId || selectedTemplateId
        if (!elementId) return

        const { channelId } = resolveChannel(elementId, isElement)
        if (!channelId) return

        try {
            await outMutation.mutateAsync({
                showId: activeShowId,
                elementId,
                itemType: isElement ? 'element' : 'template',
                channelId
            })
        } catch (err) {
            console.error('OUT action failed:', err)
            alert('Failed to trigger OUT. Check server connection.')
        }
    }

    const handleCont = async () => {
        const { selectedElementId, selectedTemplateId } = useSelectionStore.getState()

        if (!activeShowId) return
        const isElement = !!selectedElementId
        const elementId = selectedElementId || selectedTemplateId
        if (!elementId) return

        const { channelId } = resolveChannel(elementId, isElement)
        if (!channelId) return

        try {
            await contMutation.mutateAsync({
                showId: activeShowId,
                elementId,
                itemType: isElement ? 'element' : 'template',
                channelId
            })
        } catch (err) {
            console.error('CONT action failed:', err)
            alert('Failed to trigger CONTINUE. Check server connection.')
        }
    }

    const handleUpdate = async () => {
        const { selectedElementId, selectedTemplateId, fieldValues } = useSelectionStore.getState()

        if (!activeShowId) return
        const isElement = !!selectedElementId
        const elementId = selectedElementId || selectedTemplateId
        if (!elementId) return

        const { channelId } = resolveChannel(elementId, isElement)
        if (!channelId) return

        try {
            const { name, templateId, container } = getMeta(elementId, isElement ? 'element' : 'template')
            await updatePlayoutMutation.mutateAsync({
                showId: activeShowId,
                elementId,
                itemType: isElement ? 'element' : 'template',
                channelId,
                name,
                templateId,
                container,
                data: fieldValues
            })
        } catch (err) {
            console.error('UPDATE action failed:', err)
            alert('Failed to trigger UPDATE. Verify engine health.')
        }
    }

    return {
        handleTake,
        handleOut,
        handleCont,
        handleUpdate,
        takeMutation,
        outMutation,
        contMutation,
        updatePlayoutMutation
    }
}
