import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { secureAxios } from '../api/secure-axios'

export interface Show {
    id: string
    name: string
    profile_id?: string
}

export function useShows() {
    const queryClient = useQueryClient()

    // Fetch Shows
    const { data: shows = [], isLoading, isError, error } = useQuery<Show[]>({
        queryKey: ['shows'],
        queryFn: async () => {
            const response = await secureAxios.get('/api/shows')
            return response.data
        }
    })

    // Create Show
    const createShow = useMutation({
        mutationFn: async (newShow: Partial<Show>) => {
            const response = await secureAxios.post('/api/shows', newShow)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shows'] })
        }
    })

    // Update Show
    const updateShow = useMutation({
        mutationFn: async (show: Show) => {
            const response = await secureAxios.put(`/api/shows/${show.id}`, show)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shows'] })
        }
    })

    // Delete Show
    const deleteShow = useMutation({
        mutationFn: async (id: string) => {
            const response = await secureAxios.delete(`/api/shows/${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shows'] })
        }
    })

    return {
        shows,
        isLoading,
        isError,
        error,
        createShow,
        updateShow,
        deleteShow
    }
}
