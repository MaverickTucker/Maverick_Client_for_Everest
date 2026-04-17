import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { secureAxios } from '../api/secure-axios'

export interface Template {
    id: string
    name: string
    path?: string
    engine_scene_path?: string
    show_id: string
    schema?: any
    created_at?: string
    scene_info?: {
        container?: string
        tags: Array<{
            tag_id: string
            node: string
            type: string
            label?: string
        }>
        directors?: any[]
    }
}

export function useTemplates(showId: string | null) {
    return useQuery<Template[]>({
        queryKey: ['templates', showId],
        queryFn: async () => {
            if (!showId) return []
            console.log(`[useTemplates] Fetching for Show ID: ${showId}`)
            const response = await secureAxios.get(`/api/shows/${showId}/templates`)
            console.log('[useTemplates] Raw Response:', response.data)

            // Handle both direct array and wrapped { data: [] } formats
            if (Array.isArray(response.data)) return response.data
            if (response.data && Array.isArray(response.data.templates)) return response.data.templates
            if (response.data && Array.isArray(response.data.data)) return response.data.data

            return []
        },
        enabled: !!showId
    })
}

export function useDeleteTemplate() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: { showId: string; templateId: string }) => {
            const response = await secureAxios.delete(`/api/shows/${params.showId}/templates/${params.templateId}`)
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['templates', variables.showId] })
            // Also invalidate elements since they depend on templates
            queryClient.invalidateQueries({ queryKey: ['elements', variables.showId] })
        }
    })
}
