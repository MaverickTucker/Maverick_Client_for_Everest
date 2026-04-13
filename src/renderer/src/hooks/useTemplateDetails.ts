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

export function useTemplateDetails(templateId: string | null) {
    return useQuery<SceneInfo>({
        queryKey: ['template-details', templateId],
        queryFn: async () => {
            if (!templateId) throw new Error('No template selected')
            const response = await secureAxios.get(`/api/templates/${templateId}/scene-info`)
            console.log('[useTemplateDetails] Raw Data:', response.data)

            let data = response.data
            // The MRS usually returns { tags: [...] } directly or wrapped in scene_info
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
        enabled: !!templateId,
        staleTime: 60000 // Cache for 1 minute
    })
}
