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

    // Export Show
    const exportShow = useMutation({
        mutationFn: async (id: string) => {
            const response = await secureAxios.get(`/api/shows/${id}/export`)
            const data = response.data
            const showName = shows.find(s => s.id === id)?.name || 'show'
            const fileName = `${showName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`

            // Use native Electron save dialog
            if ((window as any).api?.saveShowExport) {
                const result = await (window as any).api.saveShowExport(JSON.stringify(data, null, 2), fileName)
                if (result.canceled) return null
                return result
            }

            // Fallback for non-electron (though shouldn't happen here)
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.parentNode?.removeChild(link)
            window.URL.revokeObjectURL(url)

            return data
        }
    })

    // Import Show
    const importShow = useMutation({
        mutationFn: async (importData?: any) => {
            let dataToImport = importData

            // If no data provided, open native dialog
            if (!dataToImport && (window as any).api?.importShowFile) {
                const result = await (window as any).api.importShowFile()
                if (result.canceled) return null
                dataToImport = result.content
            }

            if (!dataToImport) throw new Error('No import data provided')

            const response = await secureAxios.post('/api/shows/import', dataToImport)
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
        deleteShow,
        exportShow,
        importShow
    }
}
