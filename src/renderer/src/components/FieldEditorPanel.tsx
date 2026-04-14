import { useSelectionStore } from '../stores/selectionStore'
import { useShowStore } from '../stores/showStore'
import { useTemplateDetails } from '../hooks/useTemplateDetails'
import { LogoSpinner } from './LogoSpinner'

export function FieldEditorPanel() {
  const activeShowId = useShowStore((state) => state.activeShowId)
  const {
    selectedTemplateId,
    setSelectedTemplateId,
    selectedElementId,
    setSelectedElementId,
    fieldValues,
    updateField
  } = useSelectionStore()

  const { isLoading: detailsLoading } = useTemplateDetails(
    activeShowId,
    selectedTemplateId
  )

  const handleFieldChange = (tag: string, value: string) => {
    updateField(tag, value)
  }

  const handleClear = () => {
    setSelectedTemplateId(null)
    setSelectedElementId(null)
  }

  return (
    <div style={{ height: 'calc(100% - 8px)', overflow: 'hidden', backgroundColor: 'rgba(49, 72, 89, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid var(--glacier-700)', margin: '4px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: 'var(--glacier-950)', padding: '8px 16px', borderBottom: '1px solid var(--glacier-700)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Field Editor</h3>
        {(selectedTemplateId || selectedElementId) && (
          <button
            onClick={handleClear}
            style={{ background: 'transparent', border: 'none', color: 'var(--glacier-300)', cursor: 'pointer', fontSize: '11px' }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        {(!selectedTemplateId && !selectedElementId) ? (
          <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
            Double-click a template or element to edit its fields
          </div>
        ) : (selectedTemplateId && detailsLoading) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px' }}>
            <LogoSpinner size={24} />
            <span style={{ fontSize: '12px', color: 'var(--glacier-200)' }}>Loading fields...</span>
          </div>
        ) : Object.keys(fieldValues).length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--glacier-900)', zIndex: 1, borderBottom: '1px solid var(--glacier-700)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 16px', color: 'var(--glacier-400)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', width: '35%' }}>Field</th>
                <th style={{ textAlign: 'left', padding: '8px 16px', color: 'var(--glacier-400)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(fieldValues).map((tag, idx) => (
                <tr key={tag} style={{ borderBottom: '1px solid var(--glacier-800)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '6px 16px', color: 'var(--glacier-200)', fontWeight: 500, verticalAlign: 'middle' }}>{tag}</td>
                  <td style={{ padding: '4px 12px' }}>
                    <input
                      type="text"
                      value={fieldValues[tag] || ''}
                      onChange={(e) => handleFieldChange(tag, e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glacier-700)',
                        borderRadius: '3px',
                        padding: '4px 8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.1s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--mint-green)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--glacier-700)'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ fontSize: '13px', color: '#71717a', textAlign: 'center', padding: '20px' }}>No editable fields found.</div>
        )}
      </div>
    </div>
  )
}
