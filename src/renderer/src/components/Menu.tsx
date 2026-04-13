import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ShowsDialog } from './ShowsDialog'
import { useShowStore } from '../stores/showStore'
import { useConnectionStore } from '../stores/connectionStore'
import { ImportStatusModal, ImportItem } from './ImportStatusModal'
import { PlayoutConfigModal } from './PlayoutConfigModal'
import logo from '../assets/logo.png'

export function Menu() {
  const queryClient = useQueryClient()
  const activeShowId = useShowStore((state) => state.activeShowId)

  const [isShowsDialogOpen, setIsShowsDialogOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importItems, setImportItems] = useState<ImportItem[]>([])

  // Synchronize active show state to the main process for native menu updates
  useEffect(() => {
    // @ts-ignore
    window.electron.ipcRenderer.send('sync:active-show', activeShowId)
  }, [activeShowId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        handleDocumentation()
      }
    }

    // Define listeners
    const onManageShows = () => setIsShowsDialogOpen(true)
    const onImportScene = () => handleImportScene()
    const onSettings = () => setIsConfigModalOpen(true)
    const onDocumentation = () => handleDocumentation()
    const onAbout = () => handleAbout()

    // @ts-ignore
    window.electron.ipcRenderer.on('menu:manage-shows', onManageShows)
    // @ts-ignore
    window.electron.ipcRenderer.on('menu:import-scene', onImportScene)
    // @ts-ignore
    window.electron.ipcRenderer.on('menu:settings', onSettings)
    // @ts-ignore
    window.electron.ipcRenderer.on('menu:documentation', onDocumentation)
    // @ts-ignore
    window.electron.ipcRenderer.on('menu:about', onAbout)

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:manage-shows')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:import-scene')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:settings')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:documentation')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:about')
    }
  }, [])

  const handleDocumentation = () => {
    console.log('Open Documentation')
  }

  const handleAbout = () => {
    console.log('Open About')
  }

  const handleImportScene = async () => {
    if (!activeShowId) {
      console.error('No active show selected')
      return
    }

    try {
      // @ts-ignore - window.electron is exposed via preload
      const filePaths: string[] = await window.electron.ipcRenderer.invoke('dialog:openFile')

      if (filePaths && filePaths.length > 0) {
        // Initialize import items
        const newItems: ImportItem[] = filePaths.map(path => {
          const fileNameWithExt = path.split(/[\\/]/).pop() || ''
          const name = fileNameWithExt.replace(/\.[^/.]+$/, '')
          return {
            id: Math.random().toString(36).substr(2, 9),
            name,
            path,
            status: 'pending'
          }
        })

        setImportItems(newItems)
        setIsImportModalOpen(true)

        console.log(`Starting import for ${filePaths.length} files...`)

        let hasErrorInBatch = false

        for (const item of newItems) {
          // Update status to importing
          setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'importing' } : i))

          try {
            const { host, port } = useConnectionStore.getState()
            const baseUrl = `http://${host.toLowerCase()}:${port}`
            const apiKey = import.meta.env.VITE_MRS_API_KEY || ''

            const importUrl = `${baseUrl}/api/templates/import-advanced?show_id=${encodeURIComponent(activeShowId)}&name=${encodeURIComponent(item.name)}&path=${encodeURIComponent(item.path)}`

            const response = await fetch(importUrl, {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
              },
              body: ''
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              const errorMessage = errorData.detail || errorData.error || `Error ${response.status}`
              throw new Error(errorMessage)
            }

            setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success' } : i))
          } catch (apiError: any) {
            hasErrorInBatch = true
            console.error(`Failed to import ${item.name}:`, apiError)
            const errorMessage = apiError.response?.data?.detail || apiError.response?.data?.error || apiError.message || 'Unknown error'
            const statusText = apiError.response?.status ? `(${apiError.response.status}) ` : ''
            setImportItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: `${statusText}${errorMessage}` } : i))
          }
        }

        if (!hasErrorInBatch) {
          console.log('[Import] Success! Refreshing templates...')
          queryClient.invalidateQueries({ queryKey: ['templates', activeShowId] })
          setTimeout(() => {
            setIsImportModalOpen(false)
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error)
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--glacier-950)', borderBottom: '1px solid var(--glacier-700)', display: 'flex', alignItems: 'center', height: '48px', paddingLeft: '16px', paddingRight: '16px', gap: '24px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '18px', color: 'var(--glacier-50)', flexShrink: 0 }}>
        <img
          src={logo}
          alt="Maverick Logo"
          style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px var(--mint-green))' }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Space for future Top Bar buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* User can add custom buttons here */}
      </div>

      <PlayoutConfigModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} />

      <ShowsDialog isOpen={isShowsDialogOpen} onClose={() => setIsShowsDialogOpen(false)} />

      <ImportStatusModal
        isOpen={isImportModalOpen}
        items={importItems}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  )
}
