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
        mutationFn: async (params: { showId: string; elementId: string; name: string; templateId: string; data: any }) => {
            const response = await secureAxios.put(`/api/shows/${params.showId}/elements/${params.elementId}`, {
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

export function useDeleteElement() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: { showId: string; elementId: string }) => {
            const response = await secureAxios.delete(`/api/shows/${params.showId}/elements/${params.elementId}`)
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['elements', variables.showId] })
        }
    })
}
