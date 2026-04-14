import { useQuery } from '@tanstack/react-query'
import { secureAxios } from '../api/secure-axios'

export interface SceneField {
    tag_id: string
    tag?: string // Normalized version for UI
    node: string
    type: string
    label?: string
    default?: any
}

export interface SceneInfo {
    scene_path: string
    tags: SceneField[]
    container?: string
    directors?: any[]
}

export function useTemplateDetails(showId: string | null, templateId: string | null) {
    return useQuery<SceneInfo>({
        queryKey: ['template-details', showId, templateId],
        queryFn: async () => {
            if (!showId || !templateId) throw new Error('Missing parameters for template details')

            // New hierarchical GET endpoint as per user 
            const response = await secureAxios.get(`/api/shows/${showId}/templates/${templateId}/scene-info`)

            console.log('[useTemplateDetails] Raw Data:', response.data)

            let data = response.data
            // Handle common MRS response wrappers: { data: ... } or { scene_info: ... } or { info: ... }
            if (data.data) data = data.data
            if (data.scene_info) data = data.scene_info
            if (data.info) data = data.info

            // Normalize tags/fields: Ensure we have a 'tags' array
            const tagsSource = data.tags || data.fields || []
            if (Array.isArray(tagsSource)) {
                data.tags = tagsSource.map((t: any) => ({
                    ...t,
                    tag: t.tag || t.tag_id || t.TagId || t.name // Broad mapping for compatibility
                }))
            } else {
                data.tags = []
            }

            return data
        },
        enabled: !!showId && !!templateId,
        staleTime: 60000 // Cache for 1 minute
    })
}
