import { useMutation, useQueryClient } from '@tanstack/react-query'
import { secureAxios } from '../api/secure-axios'

export function useCreateElement() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: { showId: string; name: string; templateId: string; data: any }) => {
            const response = await secureAxios.post(`/api/shows/${params.showId}/elements`, {
                name: params.name,
                template_id: params.templateId,
                data: params.data
            })
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['elements', variables.showId] })
        }
    })
}

export function useUpdateElement() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: { showId: string; elementId: string; name?: string; data: any }) => {
            const response = await secureAxios.put(`/api/shows/${params.showId}/elements/${params.elementId}`, {
                name: params.name,
                data: params.data
            })
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['elements', variables.showId] })
        }
    })
}
