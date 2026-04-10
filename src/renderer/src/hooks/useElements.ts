import { useQuery } from '@tanstack/react-query'
import { secureAxios } from '../api/secure-axios'

export interface Element {
    id: string
    show_id: string
    name: string
    data: any
}

export function useElements(showId: string | null) {
    return useQuery<Element[]>({
        queryKey: ['elements', showId],
        queryFn: async () => {
            if (!showId) return []
            console.log(`[useElements] Fetching for Show ID: ${showId}`)
            const response = await secureAxios.get('/api/elements', {
                params: { show_id: showId }
            })
            console.log('[useElements] Raw Response:', response.data)

            // Handle both direct array and wrapped { data: [] } formats
            if (Array.isArray(response.data)) return response.data
            if (response.data && Array.isArray(response.data.elements)) return response.data.elements
            if (response.data && Array.isArray(response.data.data)) return response.data.data

            return []
        },
        enabled: !!showId
    })
}
