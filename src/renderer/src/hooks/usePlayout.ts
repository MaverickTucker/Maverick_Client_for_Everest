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
            name?: string
            templateId?: string
            container?: string
            data?: any
        }) => {
            const pathType = params.itemType === 'template' ? 'templates' : 'elements'
            const response = await secureAxios.post(
                `/api/shows/${params.showId}/${pathType}/${params.elementId}/take`,
                params.itemType === 'template'
                    ? (params.data || null)
                    : {
                        name: params.itemType === 'element' ? (params as any).name : '',
                        template_id: params.itemType === 'element' ? (params as any).templateId : '',
                        data: params.data
                    },
                { params: { channel_id: params.channelId, layer: params.layer } }
            )
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channel'] })
        }
    })
}

export const useUpdatePlayout = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: {
            showId: string
            elementId: string
            itemType: 'template' | 'element'
            channelId: string
            name?: string
            templateId?: string
            container?: string
            data: any
        }) => {
            const pathType = params.itemType === 'template' ? 'templates' : 'elements'
            const url = `/api/shows/${params.showId}/${pathType}/${params.elementId}/update`
            const queryParams = {
                container: params.container || 'Main'
            }

            const body = {
                name: params.name || '',
                template_id: params.templateId || '',
                data: params.data
            }

            console.log(`[useUpdatePlayout] POST ${url}`, {
                body,
                queryParams,
                dataKeys: Object.keys(params.data || {}),
                dataCount: Object.keys(params.data || {}).length
            })

            // Log individual key-value pairs for deep inspection
            if (params.data) {
                Object.entries(params.data).forEach(([key, val]) => {
                    console.log(`  - Data field: "${key}" = "${val}"`)
                })
            }

            const response = await secureAxios.post(
                url,
                body,
                { params: queryParams }
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
