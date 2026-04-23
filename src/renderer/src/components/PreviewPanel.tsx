import { useNDIStore } from '../stores/ndiStore'
import { Play } from 'lucide-react'

export function PreviewPanel() {
  const {
    sources,
    selectedSource,
    setSelectedSource,
    previewFrame,
    isConnected,
    isConnecting
  } = useNDIStore()

  return (
    <div style={{ height: 'calc(100% - 8px)', overflow: 'hidden', backgroundColor: 'rgba(49, 72, 89, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid var(--glacier-700)', margin: '4px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: 'var(--glacier-950)', padding: '8px 16px', borderBottom: '1px solid var(--glacier-700)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Play size={14} className="text-mint-green" />
          Preview
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={selectedSource || ''}
            onChange={(e) => setSelectedSource(e.target.value)}
            style={{
              backgroundColor: 'var(--glacier-900)',
              border: '1px solid var(--glacier-700)',
              color: 'var(--glacier-50)',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              outline: 'none'
            }}
          >
            <option value="" disabled>Select NDI Source</option>
            {sources.map(src => (
              <option key={src.name} value={src.name}>{src.name}</option>
            ))}
          </select>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? 'var(--mint-green)' : isConnecting ? '#fbbf24' : '#ef4444'
          }} />
        </div>
      </div>
      <div style={{
        flex: 1,
        backgroundColor: '#000',
        margin: '12px',
        borderRadius: '4px',
        border: '1px solid var(--glacier-700)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {previewFrame ? (
          <img
            src={previewFrame}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            alt="NDI Preview"
          />
        ) : (
          <div style={{ color: 'var(--glacier-600)', fontSize: '12px', textAlign: 'center' }}>
            {isConnected ? 'EMPTY STREAM' : isConnecting ? 'CONNECTING TO BRIDGE...' : 'NDI BRIDGE OFFLINE'}
          </div>
        )}
      </div>
    </div>
  )
}
