import { useElements, Element } from './useElements'
import { useTemplates, Template } from './useTemplates'

export interface PlayoutMeta {
    selectedElement: Element | null
    selectedTemplate: Template | null
    name: string
    templateId: string
    container: string
}

export function usePlayoutMeta(showId: string | null) {
    const { data: elements = [], isLoading: elementsLoading } = useElements(showId)
    const { data: templates = [], isLoading: templatesLoading } = useTemplates(showId)

    const getMeta = (id: string | null, type: 'template' | 'element'): PlayoutMeta => {
        if (!id) {
            return {
                selectedElement: null,
                selectedTemplate: null,
                name: '',
                templateId: '',
                container: ''
            }
        }

        const isElement = type === 'element'
        const selectedElement = isElement ? elements.find(e => e.id === id) : null

        const templateUuid = isElement ? selectedElement?.template_id : id
        const selectedTemplate = templates.find(t => t.id === templateUuid) || null

        return {
            selectedElement: selectedElement || null,
            selectedTemplate,
            name: selectedElement?.name || '',
            templateId: templateUuid || '',
            container: selectedTemplate?.scene_info?.container || 'Main'
        }
    }

    return {
        elements,
        templates,
        isLoading: elementsLoading || templatesLoading,
        getMeta
    }
}
