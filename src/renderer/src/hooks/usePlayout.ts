import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mrsApi } from '../api/axios'

export const useTake = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: {
            showId: string
            elementId: string
            channelId: string
            layer?: number
        }) => {
            const response = await mrsApi.post(
                `/api/shows/${params.showId}/elements/${params.elementId}/take`,
                null,
                { params: { channel_id: params.channelId, layer: params.layer } }
            )
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channel'] })
        }
    })
}
