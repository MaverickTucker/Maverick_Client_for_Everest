import { useQuery } from '@tanstack/react-query'
import { secureAxios } from '../api/secure-axios'

export interface SceneField {
    tag: string
    type: string
    label?: string
    default?: any
}

export interface SceneInfo {
    scene_path: string
    tags: SceneField[]
}

export function useTemplateDetails(templateId: string | null) {
    return useQuery<SceneInfo>({
        queryKey: ['template-details', templateId],
        queryFn: async () => {
            if (!templateId) throw new Error('No template selected')
            const response = await secureAxios.get(`/api/templates/${templateId}/scene-info`)
            console.log('[useTemplateDetails] Raw Data:', response.data)

            // The MRS usually returns { scene_info: { tags: [...] } } or direct object
            const data = response.data
            if (data.scene_info) return data.scene_info
            return data
        },
        enabled: !!templateId,
        staleTime: 60000 // Cache for 1 minute
    })
}
