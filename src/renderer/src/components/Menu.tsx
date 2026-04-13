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
  const [isOpen, setIsOpen] = useState<string | null>(null)
  const [isShowsDialogOpen, setIsShowsDialogOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importItems, setImportItems] = useState<ImportItem[]>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        handleDocumentation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSettings = () => {
    setIsConfigModalOpen(true)
    setIsOpen(null)
  }
  // ... existing code ...

  const handleExit = () => {
    window.close()
  }

  const handleDocumentation = () => {
    console.log('Open Documentation')
    setIsOpen(null)
  }

  const handleAbout = () => {
    console.log('Open About')
    setIsOpen(null)
  }

  const handleImportScene = async () => {
    setIsOpen(null)
    const activeShowId = useShowStore.getState().activeShowId

    if (!activeShowId) {
      console.error('No active show selected')
      // Optional: alert('Please select a show first')
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
            // Bypass Axios entirely to match working Postman/Python requests exactly.
            // This avoids any potential issues with Axios interceptors or hidden behavior.
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

        // After loop finishes
        if (!hasErrorInBatch) {
          // Success! Refresh templates and close after a delay
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

      {/* File Menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(isOpen === 'file' ? null : 'file')}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            color: '#d4d4d8',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--glacier-600)'
              ; (e.target as HTMLElement).style.color = 'var(--glacier-50)'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent'
              ; (e.target as HTMLElement).style.color = 'var(--glacier-200)'
          }}
        >
          File
        </button>
        {isOpen === 'file' && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: 'var(--glacier-800)',
            border: '1px solid var(--glacier-700)',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            zIndex: 50,
            minWidth: '200px'
          }}>
            <button
              onClick={handleSettings}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                fontSize: '14px',
                color: '#d4d4d8',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'var(--glacier-600)'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-50)'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-200)'
              }}
            >
              Settings
            </button>
            <button
              onClick={handleImportScene}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                fontSize: '14px',
                color: '#d4d4d8',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'var(--glacier-600)'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-50)'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-200)'
              }}
            >
              Import Scenes...
              <span style={{ fontSize: '12px', color: '#71717a' }}>*.sum</span>
            </button>
            <div style={{ borderTop: '1px solid #3f3f46', margin: '4px 0' }} />
            <button
              onClick={handleExit}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                fontSize: '14px',
                color: '#d4d4d8',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'var(--glacier-600)'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-50)'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-200)'
              }}
            >
              Exit
              <span style={{ fontSize: '12px', color: '#71717a' }}>Alt+F4</span>
            </button>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['shows'] })
            setIsShowsDialogOpen(true)
          }}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            color: '#d4d4d8',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--glacier-600)'
              ; (e.target as HTMLElement).style.color = 'var(--glacier-50)'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent'
              ; (e.target as HTMLElement).style.color = 'var(--glacier-200)'
          }}
        >
          Shows
        </button>
      </div>

      {/* Help Menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(isOpen === 'help' ? null : 'help')}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            color: '#d4d4d8',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--glacier-600)'
              ; (e.target as HTMLElement).style.color = 'var(--glacier-50)'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent'
              ; (e.target as HTMLElement).style.color = 'var(--glacier-200)'
          }}
        >
          Help
        </button>
        {isOpen === 'help' && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: 'var(--glacier-800)',
            border: '1px solid var(--glacier-700)',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            zIndex: 50,
            minWidth: '200px'
          }}>
            <button
              onClick={handleDocumentation}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                fontSize: '14px',
                color: '#d4d4d8',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'var(--glacier-600)'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-50)'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-200)'
              }}
            >
              Documentation
              <span style={{ fontSize: '12px', color: '#71717a' }}>F1</span>
            </button>
            <div style={{ borderTop: '1px solid #3f3f46', margin: '4px 0' }} />
            <button
              onClick={handleAbout}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                fontSize: '14px',
                color: '#d4d4d8',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'var(--glacier-600)'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-50)'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  ; (e.target as HTMLElement).style.color = 'var(--glacier-200)'
              }}
            >
              About
            </button>
          </div>
        )}
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
