import { useQuery } from '@tanstack/react-query'
import { secureAxios } from '../api/secure-axios'

export interface Template {
    id: string
    name: string
    path: string
    show_id: string
    schema?: any
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
