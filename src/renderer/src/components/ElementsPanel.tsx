import { CollapsiblePanel } from './CollapsiblePanel'
import { useSelectionStore } from '../stores/selectionStore'
import { useConfigStore } from '../stores/configStore'
import { usePlayoutMeta } from '../hooks/usePlayoutMeta'
import { useShowStore } from '../stores/showStore'
import { Box } from 'lucide-react'
import { LogoSpinner } from './LogoSpinner'
import { Element } from '../hooks/useElements'

interface ElementsPanelProps {
  onContextMenu: (e: React.MouseEvent, type: 'template' | 'element', item: Element) => void
}

export function ElementsPanel({ onContextMenu }: ElementsPanelProps) {
  const { activeShowId } = useShowStore()
  const channels = useConfigStore(state => state.channels)
  const pgmChannel = channels.find(c => c.role === 'PGM') || channels[0]

  const {
    selectedElementId,
    setSelectedElementId,
    focusedElementId,
    setFocusedElementId,
    elementOverrides,
    updateElementOverride
  } = useSelectionStore()

  const { elements, isLoading } = usePlayoutMeta(activeShowId)

  return (
    <CollapsiblePanel
      title="Elements"
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--glacier-400)', fontWeight: 700, marginRight: '8px' }}>
          <span style={{ width: '80px', textAlign: 'center' }}>CHANNEL</span>
          <span style={{ width: '60px', textAlign: 'center' }}>LAYER</span>
        </div>
      }
    >

      <div className="flex-1 overflow-auto p-3 flex flex-col gap-1">
        {isLoading ? (
          <div className="flex justify-center p-5"><LogoSpinner size={20} /></div>
        ) : (
          elements?.map(e => {
            const isFocused = focusedElementId === e.id
            const isSelected = selectedElementId === e.id
            const isHighlighted = isFocused || isSelected
            const override = elementOverrides[e.id]
            const currentChannelId = override?.channelId || pgmChannel?.id || ''
            const currentLayer = override?.layer || 1

            return (
              <div
                key={e.id}
                onClick={() => setFocusedElementId(e.id)}
                onDoubleClick={() => setSelectedElementId(e.id)}
                onContextMenu={(evt) => onContextMenu(evt, 'element', e)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: isSelected
                    ? 'rgba(52, 211, 153, 0.15)'
                    : isFocused
                      ? 'rgba(145, 188, 207, 0.15)'
                      : 'var(--glacier-900)',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: isSelected
                    ? 'var(--mint-green)'
                    : isFocused
                      ? 'var(--glacier-400)'
                      : 'var(--glacier-700)',
                  opacity: isSelected ? 1 : 0.9,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  userSelect: 'none',
                  transition: 'all 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isHighlighted) e.currentTarget.style.borderColor = 'var(--glacier-600)'
                }}
                onMouseLeave={(e) => {
                  if (!isHighlighted) e.currentTarget.style.borderColor = 'var(--glacier-700)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <Box size={14} style={{ color: isSelected ? 'var(--mint-green)' : isFocused ? 'var(--glacier-200)' : 'var(--glacier-300)', flexShrink: 0 }} />
                  <span style={{
                    fontWeight: isSelected ? 700 : isFocused ? 500 : 400,
                    color: isSelected ? '#fff' : isFocused ? 'var(--glacier-50)' : 'var(--glacier-100)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{e.name}</span>
                </div>

                <select
                  value={currentChannelId}
                  onClick={(evt) => evt.stopPropagation()}
                  onChange={(evt) => updateElementOverride(e.id, evt.target.value, currentLayer)}
                  style={{ width: '80px', fontSize: '11px', backgroundColor: 'var(--glacier-950)', border: '1px solid var(--glacier-700)', color: 'var(--glacier-50)', borderRadius: '2px', outline: 'none' }}
                >
                  {channels.map((ch: any) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}{ch.role === 'PGM' ? ' (PGM)' : ch.role === 'PVW' ? ' (PVW)' : ''}
                    </option>
                  ))}
                </select>

                <select
                  value={currentLayer}
                  onClick={(evt) => evt.stopPropagation()}
                  onChange={(evt) => updateElementOverride(e.id, currentChannelId, parseInt(evt.target.value))}
                  style={{ width: '60px', fontSize: '11px', backgroundColor: 'var(--glacier-950)', border: '1px solid var(--glacier-700)', color: 'var(--glacier-50)', borderRadius: '2px', outline: 'none', textAlign: 'center' }}
                >
                  {[1, 2, 3, 4, 5, 6].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )
          })
        )}
      </div>
    </CollapsiblePanel>

  )
}

