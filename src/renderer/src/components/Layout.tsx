import { Menu } from './Menu'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { useShowStore } from '../stores/showStore'
import { useSelectionStore } from '../stores/selectionStore'
import { useTemplates } from '../hooks/useTemplates'
import { useConfigStore } from '../stores/configStore'
import { useElements } from '../hooks/useElements'
import { useTemplateDetails } from '../hooks/useTemplateDetails'
import { Box, Layers } from 'lucide-react'
import { LogoSpinner } from './LogoSpinner'
import { useEffect } from 'react'
import { StatusBar } from './StatusBar'

function ResizeHandle() {
  return (
    <PanelResizeHandle className="hover:bg-mint-green transition-colors duration-200" />
  )
}

export function Layout() {
  const { activeShowId } = useShowStore()
  const channels = useConfigStore(state => state.channels)
  const pgmChannel = channels.find(c => c.role === 'PGM') || channels[0]
  const {
    selectedTemplateId,
    setSelectedTemplateId,
    selectedElementId,
    setSelectedElementId,
    focusedTemplateId,
    setFocusedTemplateId,
    focusedElementId,
    setFocusedElementId,
    fieldValues,
    setFieldValues,
    templateOverrides,
    elementOverrides,
    updateTemplateOverride,
    updateElementOverride,
    updateField
  } = useSelectionStore()

  const { data: templates, isLoading: templatesLoading } = useTemplates(activeShowId)
  const { data: elements, isLoading: elementsLoading } = useElements(activeShowId)

  // Find the selected template to get its path for the scene-info call
  const selectedTemplate = templates?.find(t => String(t.id) === String(selectedTemplateId))

  // If we have a selectedTemplateId but can't find it in the list (e.g. show changed), clear it
  useEffect(() => {
    if (selectedTemplateId && templates && !selectedTemplate) {
      setSelectedTemplateId(null)
    }
  }, [selectedTemplateId, templates, selectedTemplate, setSelectedTemplateId])

  const { data: templateDetails, isLoading: detailsLoading } = useTemplateDetails(
    activeShowId,
    selectedTemplateId
  )

  // Handle template details loading
  useEffect(() => {
    if (selectedTemplateId && templateDetails?.tags) {
      const initial: Record<string, string> = {}
      templateDetails.tags.forEach(tag => {
        const key = tag.tag || tag.tag_id
        initial[key] = tag.default || ''
      })
      setFieldValues(initial)
    }
  }, [selectedTemplateId, templateDetails, setFieldValues])

  // Handle element selection - load saved data
  useEffect(() => {
    if (selectedElementId) {
      const element = elements?.find(e => e.id === selectedElementId)
      if (element && element.data) {
        // Ensure all values are strings for the inputs
        const currentData: Record<string, string> = {}
        Object.keys(element.data).forEach(key => {
          currentData[key] = String((element.data as Record<string, any>)[key])
        })
        setFieldValues(currentData)
      }
    }
  }, [selectedElementId, elements, setFieldValues])

  const handleFieldChange = (tag: string, value: string) => {
    updateField(tag, value)
  }


  return (
    <div className="bg-glacier-texture" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--glacier-400)', color: 'var(--glacier-50)' }}>
      <Menu />

      {!activeShowId ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--glacier-950)', color: 'var(--glacier-300)' }}>
          <Box size={48} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h2 style={{ fontSize: '18px', fontWeight: 500, margin: '0 0 8px 0', color: 'var(--glacier-200)' }}>Ready to Broadcast</h2>
          <p style={{ margin: 0, fontSize: '14px' }}>Please select a show from the <b>Shows</b> menu to begin.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <PanelGroup orientation="horizontal">

            {/* Left Column */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup orientation="vertical">

                {/* Templates */}
                <Panel defaultSize={50} minSize={20}>
                  <div style={{ height: 'calc(100% - 8px)', overflow: 'hidden', backgroundColor: 'rgba(49, 72, 89, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid var(--glacier-700)', margin: '4px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ backgroundColor: 'var(--glacier-950)', padding: '6px 16px', borderBottom: '1px solid var(--glacier-700)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <Layers size={14} className="text-mint-green" />
                        Templates
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--glacier-400)', fontWeight: 700 }}>
                        <span style={{ width: '80px', textAlign: 'center' }}>CHANNEL</span>
                        <span style={{ width: '60px', textAlign: 'center' }}>LAYER</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {templatesLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><LogoSpinner size={20} /></div>
                      ) : (
                        templates?.map(t => {
                          const isFocused = focusedTemplateId === t.id
                          const isSelected = selectedTemplateId === t.id
                          const isHighlighted = isFocused || isSelected
                          const override = templateOverrides[t.id]
                          const currentChannelId = override?.channelId || pgmChannel?.id || ''
                          const currentLayer = override?.layer || 1

                          return (
                            <div
                              key={t.id}
                              onClick={() => setFocusedTemplateId(t.id)}
                              onDoubleClick={() => setSelectedTemplateId(t.id)}
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
                                <Layers size={14} style={{ color: isSelected ? 'var(--mint-green)' : isFocused ? 'var(--glacier-200)' : 'var(--glacier-300)', flexShrink: 0 }} />
                                <span style={{
                                  fontWeight: isSelected ? 700 : isFocused ? 500 : 400,
                                  color: isSelected ? '#fff' : isFocused ? 'var(--glacier-50)' : 'var(--glacier-100)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>{t.name}</span>
                              </div>

                              <select
                                value={currentChannelId}
                                onClick={(evt) => evt.stopPropagation()}
                                onChange={(evt) => updateTemplateOverride(t.id, evt.target.value, currentLayer)}
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
                                onChange={(evt) => updateTemplateOverride(t.id, currentChannelId, parseInt(evt.target.value))}
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
                  </div>
                </Panel>

                <ResizeHandle />

                {/* Elements */}
                <Panel defaultSize={50} minSize={20}>
                  <div style={{ height: 'calc(100% - 8px)', overflow: 'hidden', backgroundColor: 'rgba(49, 72, 89, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid var(--glacier-700)', margin: '4px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ backgroundColor: 'var(--glacier-950)', padding: '6px 16px', borderBottom: '1px solid var(--glacier-700)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, flex: 1 }}>Elements</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--glacier-400)', fontWeight: 700 }}>
                        <span style={{ width: '80px', textAlign: 'center' }}>CHANNEL</span>
                        <span style={{ width: '60px', textAlign: 'center' }}>LAYER</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {elementsLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><LogoSpinner size={20} /></div>
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
                  </div>
                </Panel>

              </PanelGroup>
            </Panel>

            <ResizeHandle />

            {/* Right Column */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup orientation="vertical">

                {/* Field Editor */}
                <Panel defaultSize={50} minSize={20}>
                  <div style={{ height: 'calc(100% - 8px)', overflow: 'hidden', backgroundColor: 'rgba(49, 72, 89, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid var(--glacier-700)', margin: '4px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ backgroundColor: 'var(--glacier-950)', padding: '8px 16px', borderBottom: '1px solid var(--glacier-700)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Field Editor</h3>
                      {(selectedTemplateId || selectedElementId) && (
                        <button
                          onClick={() => {
                            setSelectedTemplateId(null)
                            setSelectedElementId(null)
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--glacier-300)', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(!selectedTemplateId && !selectedElementId) ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                          Double-click a template or element to edit its fields
                        </div>
                      ) : detailsLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px' }}>
                          <LogoSpinner size={24} />
                          <span style={{ fontSize: '12px', color: 'var(--glacier-200)' }}>Loading fields...</span>
                        </div>
                      ) : Object.keys(fieldValues).length > 0 ? (
                        Object.keys(fieldValues).map(tag => (
                          <div key={tag} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--glacier-200)', textTransform: 'uppercase' }}>{tag}</label>
                            <input
                              type="text"
                              value={fieldValues[tag] || ''}
                              onChange={(e) => handleFieldChange(tag, e.target.value)}
                              style={{ backgroundColor: 'var(--glacier-900)', border: '1px solid var(--glacier-700)', borderRadius: '4px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                              onFocus={(e) => e.target.style.borderColor = 'var(--mint-green)'}
                              onBlur={(e) => e.target.style.borderColor = 'var(--glacier-700)'}
                            />
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '13px', color: '#71717a', textAlign: 'center', padding: '20px' }}>No editable fields found.</div>
                      )}
                    </div>
                  </div>
                </Panel>

                <ResizeHandle />

                {/* Preview */}
                <Panel defaultSize={50} minSize={20}>
                  <div style={{ height: 'calc(100% - 8px)', overflow: 'hidden', backgroundColor: 'rgba(49, 72, 89, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid var(--glacier-700)', margin: '4px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ backgroundColor: 'var(--glacier-950)', padding: '8px 16px', borderBottom: '1px solid var(--glacier-700)', flexShrink: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Preview</h3>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#000', margin: '12px', borderRadius: '4px', border: '1px solid var(--glacier-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--glacier-600)', fontSize: '12px' }}>
                      PREVIEW RENDER
                    </div>
                  </div>
                </Panel>

              </PanelGroup>
            </Panel>

          </PanelGroup>
        </div>
      )}
      <StatusBar />
    </div>
  )
}
