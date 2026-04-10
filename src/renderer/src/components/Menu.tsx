import { useEffect, useState } from 'react'
import logo from '../assets/logo.png'
import { ShowsDialog } from './ShowsDialog'

export function Menu() {
  const [isOpen, setIsOpen] = useState<string | null>(null)
  const [isShowsDialogOpen, setIsShowsDialogOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        handleSettings()
      }
      if (e.key === 'F1') {
        e.preventDefault()
        handleDocumentation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSettings = () => {
    console.log('Open Settings')
    setIsOpen(null)
  }

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

  return (
    <div style={{ backgroundColor: '#09090b', borderBottom: '1px solid #3f3f46', display: 'flex', alignItems: 'center', height: '48px', paddingLeft: '16px', paddingRight: '16px', gap: '24px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '18px', color: '#fafafa', flexShrink: 0 }}>
        <img
          src={logo}
          alt="Maverick Logo"
          style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px #10b981)' }}
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
            (e.target as HTMLElement).style.backgroundColor = '#27272a'
              ; (e.target as HTMLElement).style.color = '#fafafa'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent'
              ; (e.target as HTMLElement).style.color = '#d4d4d8'
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
            backgroundColor: '#27272a',
            border: '1px solid #3f3f46',
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
                (e.target as HTMLElement).style.backgroundColor = '#3f3f46'
                  ; (e.target as HTMLElement).style.color = '#fafafa'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  ; (e.target as HTMLElement).style.color = '#d4d4d8'
              }}
            >
              Settings
              <span style={{ fontSize: '12px', color: '#71717a' }}>Ctrl+,</span>
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
                (e.target as HTMLElement).style.backgroundColor = '#3f3f46'
                  ; (e.target as HTMLElement).style.color = '#fafafa'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  ; (e.target as HTMLElement).style.color = '#d4d4d8'
              }}
            >
              Exit
              <span style={{ fontSize: '12px', color: '#71717a' }}>Alt+F4</span>
            </button>
          </div>
        )}
      </div>

      {/* Shows Menu Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsShowsDialogOpen(true)}
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
            (e.target as HTMLElement).style.backgroundColor = '#27272a'
              ; (e.target as HTMLElement).style.color = '#fafafa'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent'
              ; (e.target as HTMLElement).style.color = '#d4d4d8'
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
            (e.target as HTMLElement).style.backgroundColor = '#27272a'
              ; (e.target as HTMLElement).style.color = '#fafafa'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent'
              ; (e.target as HTMLElement).style.color = '#d4d4d8'
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
            backgroundColor: '#27272a',
            border: '1px solid #3f3f46',
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
                (e.target as HTMLElement).style.backgroundColor = '#3f3f46'
                  ; (e.target as HTMLElement).style.color = '#fafafa'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  ; (e.target as HTMLElement).style.color = '#d4d4d8'
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
                (e.target as HTMLElement).style.backgroundColor = '#3f3f46'
                  ; (e.target as HTMLElement).style.color = '#fafafa'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  ; (e.target as HTMLElement).style.color = '#d4d4d8'
              }}
            >
              About
            </button>
          </div>
        )}
      </div>

      <ShowsDialog isOpen={isShowsDialogOpen} onClose={() => setIsShowsDialogOpen(false)} />
    </div>
  )
}
