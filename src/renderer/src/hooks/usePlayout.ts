import { useMutation, useQueryClient } from '@tanstack/react-query'
import { secureAxios } from '../api/secure-axios'

export const useTake = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: {
            showId: string
            elementId: string
            itemType: 'template' | 'element'
            channelId: string
            layer?: number
            data?: any
        }) => {
            const pathType = params.itemType === 'template' ? 'templates' : 'elements'
            const response = await secureAxios.post(
                `/api/shows/${params.showId}/${pathType}/${params.elementId}/take`,
                params.data || null,
                { params: { channel_id: params.channelId, layer: params.layer } }
            )
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channel'] })
        }
    })
}

export const useOut = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: {
            showId: string
            elementId: string
            itemType: 'template' | 'element'
            channelId: string
        }) => {
            const pathType = params.itemType === 'template' ? 'templates' : 'elements'
            const response = await secureAxios.post(
                `/api/shows/${params.showId}/${pathType}/${params.elementId}/out`,
                null,
                { params: { channel_id: params.channelId } }
            )
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channel'] })
        }
    })
}

export const useCont = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: {
            showId: string
            elementId: string
            itemType: 'template' | 'element'
            channelId: string
        }) => {
            const pathType = params.itemType === 'template' ? 'templates' : 'elements'
            const response = await secureAxios.post(
                `/api/shows/${params.showId}/${pathType}/${params.elementId}/cont`,
                null,
                { params: { channel_id: params.channelId } }
            )
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channel'] })
        }
    })
}

export const useRead = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: {
            showId: string
            elementId: string
            itemType: 'template' | 'element'
            channelId: string
        }) => {
            const pathType = params.itemType === 'template' ? 'templates' : 'elements'
            const response = await secureAxios.post(
                `/api/shows/${params.showId}/${pathType}/${params.elementId}/read`,
                null,
                { params: { channel_id: params.channelId } }
            )
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channel'] })
        }
    })
}
