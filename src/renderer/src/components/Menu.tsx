import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ShowsDialog } from './ShowsDialog'
import { useShowStore } from '../stores/showStore'
import { useConnectionStore } from '../stores/connectionStore'
import { useSelectionStore } from '../stores/selectionStore'
import { useConfigStore } from '../stores/configStore'
import { useTake, useOut, useCont } from '../hooks/usePlayout'
import { ImportStatusModal, ImportItem } from './ImportStatusModal'
import { PlayoutConfigModal } from './PlayoutConfigModal'
import logo from '../assets/logo.png'
import everestLogo from '../assets/EverestLogo.png'

export function Menu() {
  const queryClient = useQueryClient()
  const activeShowId = useShowStore((state) => state.activeShowId)
  const activeShowName = useShowStore((state) => state.activeShowName)
  const {
    selectedTemplateId,
    selectedElementId,
    fieldValues
  } = useSelectionStore()

  const channels = useConfigStore(state => state.channels)
  const pgmChannel = channels.find(c => c.role === 'PGM') || channels[0]

  const takeMutation = useTake()
  const outMutation = useOut()
  const contMutation = useCont()

  const [isShowsDialogOpen, setIsShowsDialogOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importItems, setImportItems] = useState<ImportItem[]>([])

  // New Top Bar States
  const [numericId, setNumericId] = useState('0000')
  const [slug, setSlug] = useState('')

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

            // Hierarchical endpoint: /api/shows/{show_id}/templates/import-advanced
            const importUrl = `${baseUrl}/api/shows/${activeShowId}/templates/import-advanced?name=${encodeURIComponent(item.name)}&path=${encodeURIComponent(item.path)}`

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

  // Handle number input (4 digits only)
  const handleNumericInput = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 4)
    setNumericId(digits.padStart(4, '0'))
  }

  const handleSave = () => console.log('SAVE', { numericId, slug, fieldValues })
  const handleSaveAs = () => console.log('SAVE AS', { numericId, slug, fieldValues })

  const handleOut = () => {
    if (!activeShowId || !pgmChannel) return
    const elementId = selectedElementId || selectedTemplateId
    if (!elementId) return

    outMutation.mutate({ showId: activeShowId, elementId, channelId: pgmChannel.id })
  }

  const handleCont = () => {
    if (!activeShowId || !pgmChannel) return
    const elementId = selectedElementId || selectedTemplateId
    if (!elementId) return

    contMutation.mutate({ showId: activeShowId, elementId, channelId: pgmChannel.id })
  }

  const handleTake = () => {
    if (!activeShowId || !pgmChannel) return
    const elementId = selectedElementId || selectedTemplateId
    if (!elementId) return

    takeMutation.mutate({
      showId: activeShowId,
      elementId,
      channelId: pgmChannel.id,
      data: fieldValues
    })
  }

  return (
    <div style={{
      backgroundColor: 'var(--glacier-950)',
      borderBottom: '1px solid var(--glacier-700)',
      display: 'flex',
      alignItems: 'center',
      height: '48px',
      paddingLeft: '8px',
      paddingRight: '12px',
      gap: '16px',
      userSelect: 'none'
    }}>
      {/* 1. Logos (Left) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <img src={logo} alt="Maverick" style={{ width: '48px', height: '48px', borderRadius: '4px', filter: 'drop-shadow(0 0 8px var(--mint-green))' }} />
        <div style={{ color: 'var(--glacier-700)', fontSize: '14px' }}>|</div>
        <img src={everestLogo} alt="Everest" style={{ width: '24px', height: '24px', opacity: 0.9 }} />
      </div>

      {/* 2. Active Context (Center-Left) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--glacier-500)', fontWeight: 700, letterSpacing: '0.05em' }}>SHOW</span>
          <span style={{ fontSize: '13px', color: 'var(--glacier-100)', fontWeight: 500, minWidth: '80px' }}>{activeShowName || 'NO SHOW'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--glacier-500)', fontWeight: 700 }}>SLUG</span>
          <input
            type="text"
            placeholder="SLUG"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            style={{
              backgroundColor: 'rgba(52, 211, 153, 0.05)',
              border: '1px solid var(--glacier-700)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'var(--mint-green)',
              fontSize: '14px',
              fontWeight: 700,
              width: '60px',
              outline: 'none',
              textAlign: 'center',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleSave} style={{ padding: '4px 12px', backgroundColor: 'var(--mint-green)', color: 'var(--glacier-950)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>SAVE</button>
          <button onClick={handleSaveAs} style={{ padding: '4px 12px', backgroundColor: 'var(--glacier-700)', color: 'var(--glacier-100)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>SAVE AS</button>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* 3. Playout (Right) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--glacier-700)',
          borderRadius: '4px',
          padding: '2px 8px',
          gap: '8px'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--glacier-500)', fontWeight: 700 }}>#</span>
          <input
            type="text"
            value={numericId}
            onChange={(e) => handleNumericInput(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--mint-green)',
              fontSize: '14px',
              fontWeight: 700,
              width: '60px',
              outline: 'none',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleOut} style={{ padding: '6px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)' }}>OUT</button>
          <button onClick={handleCont} style={{ padding: '6px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }}>CONT</button>
          <button onClick={handleTake} style={{ padding: '6px 16px', backgroundColor: 'var(--mint-green)', color: 'var(--glacier-950)', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 10px var(--mint-green-alpha)' }}>TAKE</button>
        </div>
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
