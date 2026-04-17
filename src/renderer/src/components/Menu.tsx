import { useEffect, useState } from 'react'
import { LogoSpinner } from './LogoSpinner'
import { useQueryClient } from '@tanstack/react-query'
import { ShowsDialog } from './ShowsDialog'
import { useShowStore } from '../stores/showStore'
import { useConnectionStore } from '../stores/connectionStore'
import { useSelectionStore } from '../stores/selectionStore'
import { useConfigStore } from '../stores/configStore'
import { useTake, useOut, useCont } from '../hooks/usePlayout'
import { useCreateElement, useUpdateElement } from '../hooks/useElementActions'
import { useElements } from '../hooks/useElements'
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
    fieldValues,
    templateOverrides,
    elementOverrides
  } = useSelectionStore()

  const channels = useConfigStore(state => state.channels)
  const pgmChannel = channels.find(c => c.role === 'PGM') || channels[0]

  const takeMutation = useTake()
  const outMutation = useOut()
  const contMutation = useCont()

  const { data: elements = [] } = useElements(activeShowId)
  const createElementMutation = useCreateElement()
  const updateElementMutation = useUpdateElement()

  const [isShowsDialogOpen, setIsShowsDialogOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importItems, setImportItems] = useState<ImportItem[]>([])

  // New Top Bar States
  const [numericId, setNumericId] = useState('0000')
  const [slug, setSlug] = useState('1')

  // Synchronize active show state to the main process for native menu updates
  useEffect(() => {
    // @ts-ignore
    window.electron.ipcRenderer.send('sync:active-show', activeShowId)
  }, [activeShowId])

  // Logic to find next numeric name based on show elements
  const getNextAvailableName = () => {
    const existingNumbers = elements
      .map(e => parseInt(e.name))
      .filter(n => !isNaN(n))
    return Math.max(0, ...existingNumbers) + 1
  }

  // Update slug when elements change or show changes if slug is empty/default
  useEffect(() => {
    if ((!slug || slug === '1') && elements.length > 0) {
      setSlug(getNextAvailableName().toString())
    }
  }, [elements, activeShowId])

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
            // Get the CURRENT show ID from store (not the closure value)
            const currentShowId = useShowStore.getState().activeShowId
            if (!currentShowId) {
              throw new Error('No active show selected')
            }

            const { host, port } = useConnectionStore.getState()
            const baseUrl = `http://${host.toLowerCase()}:${port}`
            const apiKey = import.meta.env.VITE_MRS_API_KEY || ''

            // Hierarchical endpoint: /api/shows/${currentShowId}/templates/scene-importv1
            const importUrl = `${baseUrl}/api/shows/${currentShowId}/templates/scene-importv1?name=${encodeURIComponent(item.name)}&path=${encodeURIComponent(item.path)}`

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
          const currentShowId = useShowStore.getState().activeShowId
          if (currentShowId) {
            queryClient.invalidateQueries({ queryKey: ['templates', currentShowId] })
          }
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

  const handleSlugInput = (val: string) => {
    const digits = val.replace(/\D/g, '')
    setSlug(digits)
  }

  const handleSave = async () => {
    if (!activeShowId || !selectedElementId) return

    try {
      await updateElementMutation.mutateAsync({
        showId: activeShowId,
        elementId: selectedElementId,
        data: fieldValues
      })
      console.log('[Save] Success')
    } catch (err) {
      console.error('Save failed:', err)
      alert('Failed to save element.')
    }
  }

  const handleSaveAs = async () => {
    if (!activeShowId || (!selectedElementId && !selectedTemplateId)) return

    try {
      const templateId = selectedElementId
        ? elements.find(e => e.id === selectedElementId)?.template_id || ''
        : selectedTemplateId || ''

      // Determine name: user slug or incremented name
      let name = slug.trim()
      if (!name) {
        name = getNextAvailableName().toString()
      }

      await createElementMutation.mutateAsync({
        showId: activeShowId,
        name,
        templateId,
        data: fieldValues
      })

      // Auto-increment slug for next save
      const nextSlug = (parseInt(name) || 0) + 1
      setSlug(nextSlug.toString())
      console.log('[Save As] Success', name)
    } catch (err) {
      console.error('Save As failed:', err)
      alert('Failed to create new element.')
    }
  }

  const handleOut = async () => {
    if (!activeShowId || !pgmChannel) return
    const isElement = !!selectedElementId
    const elementId = selectedElementId || selectedTemplateId
    if (!elementId) return

    const override = isElement ? elementOverrides[elementId] : templateOverrides[elementId]
    const channelId = override?.channelId || pgmChannel.id

    try {
      await outMutation.mutateAsync({
        showId: activeShowId,
        elementId,
        itemType: isElement ? 'element' : 'template',
        channelId
      })
    } catch (err) {
      console.error('OUT action failed:', err)
      alert('Failed to trigger OUT. Check server connection.')
    }
  }

  const handleCont = async () => {
    if (!activeShowId || !pgmChannel) return
    const isElement = !!selectedElementId
    const elementId = selectedElementId || selectedTemplateId
    if (!elementId) return

    const override = isElement ? elementOverrides[elementId] : templateOverrides[elementId]
    const channelId = override?.channelId || pgmChannel.id

    try {
      await contMutation.mutateAsync({
        showId: activeShowId,
        elementId,
        itemType: isElement ? 'element' : 'template',
        channelId
      })
    } catch (err) {
      console.error('CONT action failed:', err)
      alert('Failed to trigger CONTINUE. Check server connection.')
    }
  }

  const handleTake = async () => {
    // Get latest values directly from the store to avoid any stale closures
    const state = useSelectionStore.getState()
    const {
      selectedElementId: latestElementId,
      selectedTemplateId: latestTemplateId,
      fieldValues: latestFieldValues,
      elementOverrides,
      templateOverrides
    } = state

    if (!activeShowId || !pgmChannel) return
    const isElement = !!latestElementId
    const elementId = latestElementId || latestTemplateId
    if (!elementId) {
      alert('Please select an element or template first.')
      return
    }

    const override = isElement ? elementOverrides[elementId] : templateOverrides[elementId]
    const channelId = override?.channelId || pgmChannel.id
    const layer = override?.layer || 1

    console.log(`[Take] Action triggered for ${isElement ? 'element' : 'template'}: ${elementId}`)
    console.log('[Take] Field Values:', latestFieldValues)

    try {
      await takeMutation.mutateAsync({
        showId: activeShowId,
        elementId,
        itemType: isElement ? 'element' : 'template',
        channelId,
        layer,
        data: latestFieldValues
      })
    } catch (err) {
      console.error('TAKE action failed:', err)
      alert('Failed to trigger TAKE. Verify engine health.')
    }
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
            onChange={(e) => handleSlugInput(e.target.value)}
            style={{
              backgroundColor: 'rgba(52, 211, 153, 0.05)',
              border: '1px solid var(--glacier-700)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'var(--glacier-100)',
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
          <button
            onClick={handleSave}
            disabled={!selectedElementId || updateElementMutation.isPending}
            style={{
              padding: '4px 12px',
              backgroundColor: 'var(--glacier-700)',
              color: 'var(--glacier-100)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: (!selectedElementId || updateElementMutation.isPending) ? 'not-allowed' : 'pointer',
              opacity: (!selectedElementId || updateElementMutation.isPending) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {updateElementMutation.isPending && <LogoSpinner size={10} />}
            SAVE
          </button>
          <button
            onClick={handleSaveAs}
            disabled={(!selectedElementId && !selectedTemplateId) || createElementMutation.isPending}
            style={{
              padding: '4px 12px',
              backgroundColor: 'var(--glacier-700)',
              color: 'var(--glacier-100)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: ((!selectedElementId && !selectedTemplateId) || createElementMutation.isPending) ? 'not-allowed' : 'pointer',
              opacity: ((!selectedElementId && !selectedTemplateId) || createElementMutation.isPending) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {createElementMutation.isPending && <LogoSpinner size={10} />}
            SAVE AS
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* 3. Playout (Right) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(52, 211, 153, 0.05)',
          border: '1px solid var(--glacier-700)',
          borderRadius: '4px',
          padding: '4px 8px',
          gap: '8px'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--glacier-500)', fontWeight: 700 }}>#</span>
          <input
            type="text"
            value={numericId}
            onChange={(e) => handleNumericInput(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--glacier-100)',
              fontSize: '14px',
              fontWeight: 700,
              width: '45px',
              outline: 'none',
              textAlign: 'center',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleOut}
            disabled={outMutation.isPending || (!selectedElementId && !selectedTemplateId)}
            style={{
              padding: '6px 16px',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: (outMutation.isPending || (!selectedElementId && !selectedTemplateId)) ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)',
              opacity: (outMutation.isPending || (!selectedElementId && !selectedTemplateId)) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {outMutation.isPending && <LogoSpinner size={12} />}
            OUT
          </button>
          <button
            onClick={handleCont}
            disabled={contMutation.isPending || (!selectedElementId && !selectedTemplateId)}
            style={{
              padding: '6px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: (contMutation.isPending || (!selectedElementId && !selectedTemplateId)) ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
              opacity: (contMutation.isPending || (!selectedElementId && !selectedTemplateId)) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {contMutation.isPending && <LogoSpinner size={12} />}
            CONT
          </button>
          <button
            onClick={handleTake}
            disabled={takeMutation.isPending || (!selectedElementId && !selectedTemplateId)}
            style={{
              padding: '6px 16px',
              backgroundColor: 'var(--mint-green)',
              color: 'var(--glacier-950)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: (takeMutation.isPending || (!selectedElementId && !selectedTemplateId)) ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 10px var(--mint-green)',
              opacity: (takeMutation.isPending || (!selectedElementId && !selectedTemplateId)) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {takeMutation.isPending && <LogoSpinner size={12} />}
            TAKE
          </button>
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
