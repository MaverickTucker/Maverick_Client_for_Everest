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

export function useTemplateDetails(showId: string | null, templateId: string | null, path: string | null) {
    return useQuery<SceneInfo>({
        queryKey: ['template-details', showId, templateId, path],
        queryFn: async () => {
            if (!showId || !templateId || !path) throw new Error('Missing parameters for template details')

            // New hierarchical POST endpoint with path in body
            const response = await secureAxios.post(`/api/shows/${showId}/templates/${templateId}/scene-info`, {
                path: path
            })

            console.log('[useTemplateDetails] Raw Data:', response.data)

            let data = response.data
            // Handle common MRS response wrappers: { data: ... } or { scene_info: ... }
            if (data.data) data = data.data
            if (data.scene_info) data = data.scene_info

            // Normalize: Ensure each tag has a 'tag' property (mapping tag_id -> tag)
            if (data.tags && Array.isArray(data.tags)) {
                data.tags = data.tags.map((t: any) => ({
                    ...t,
                    tag: t.tag || t.tag_id // Map tag_id to tag for Layout.tsx compatibility
                }))
            }

            return data
        },
        enabled: !!showId && !!templateId && !!path,
        staleTime: 60000 // Cache for 1 minute
    })
}
