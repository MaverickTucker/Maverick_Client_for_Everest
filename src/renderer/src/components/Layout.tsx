import { Menu } from './Menu'
import { FieldEditorPanel } from './FieldEditorPanel'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { useShowStore } from '../stores/showStore'
import { useSelectionStore } from '../stores/selectionStore'
import { useConfigStore } from '../stores/configStore'
import { Element } from '../hooks/useElements'
import { Box, Layers, Play, SkipForward, Square, Eye, Trash2 } from 'lucide-react'
import { LogoSpinner } from './LogoSpinner'
import { useEffect, useState, useRef } from 'react'
import { StatusBar } from './StatusBar'
import { useTake, useOut, useCont, useRead, useUpdatePlayout } from '../hooks/usePlayout'
import { useDeleteElement } from '../hooks/useElementActions'
import { useDeleteTemplate, Template } from '../hooks/useTemplates'
import { usePlayoutMeta } from '../hooks/usePlayoutMeta'
import { ContextMenu, ContextMenuItem } from './ContextMenu'

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
    setFieldValues,
    templateOverrides,
    elementOverrides,
    updateTemplateOverride,
    updateElementOverride,
    selectionVersion,
    fieldValues
  } = useSelectionStore()

  const { templates, elements, isLoading, getMeta } = usePlayoutMeta(activeShowId)
  const templatesLoading = isLoading
  const elementsLoading = isLoading

  // Hooks
  const takeMutation = useTake()
  const contMutation = useCont()
  const outMutation = useOut()
  const readMutation = useRead()
  const updatePlayoutMutation = useUpdatePlayout()
  const deleteElementMutation = useDeleteElement()
  const deleteTemplateMutation = useDeleteTemplate()

  // State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, items: ContextMenuItem[] } | null>(null)

  // Find the selected template to get its path for the scene-info call
  const selectedTemplate = templates?.find(t => String(t.id) === String(selectedTemplateId))

  // If we have a selectedTemplateId but can't find it in the list (e.g. show changed), clear it
  useEffect(() => {
    if (selectedTemplateId && templates && !selectedTemplate) {
      setSelectedTemplateId(null)
    }
  }, [selectedTemplateId, templates, selectedTemplate, setSelectedTemplateId])

  // Use scene_info from the template directly (already included in the templates response)
  const templateDetails = selectedTemplate?.scene_info

  // Handle template details loading
  const lastInitializedTemplateId = useRef<string | null>(null)

  useEffect(() => {
    if (selectedTemplateId && templateDetails?.tags) {
      // Only initialize if we haven't initialized THIS template for THIS selection session
      // or if a reload was forced (via selectionVersion)
      if (lastInitializedTemplateId.current !== selectedTemplateId + selectionVersion) {
        const initial: Record<string, string> = {}

        // Try to find default values in the schema first
        const schemaTags = selectedTemplate?.schema?.tags || []

        templateDetails.tags.forEach(tag => {
          const key = tag.tag_id
          const schemaTag = schemaTags.find((st: any) => st.tag_id === key)
          initial[key] = schemaTag ? String(schemaTag.value || '') : ''
        })

        console.log(`[Layout] Initializing template field values for ${selectedTemplateId}`)
        setFieldValues(initial)
        lastInitializedTemplateId.current = selectedTemplateId + selectionVersion
      }
    } else if (!selectedTemplateId) {
      lastInitializedTemplateId.current = null
    }
  }, [selectedTemplateId, !!templateDetails, selectionVersion, selectedTemplate?.schema])

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
  }, [selectedElementId, !!elements, selectionVersion]) // Fire when selection changes OR elements first become available OR forced reload

  // Context Menu Handlers
  const handleContextMenu = (
    e: React.MouseEvent,
    type: 'template' | 'element',
    item: Template | Element
  ) => {
    e.preventDefault()
    if (!activeShowId) return

    const override = type === 'template' ? templateOverrides[item.id] : elementOverrides[item.id]
    const channelId = override?.channelId || pgmChannel?.id || ''
    const layer = override?.layer || 1

    const { name, templateId, container } = getMeta(item.id, type)
    const isSelected = item.id === (type === 'element' ? selectedElementId : selectedTemplateId)
    const currentData = isSelected ? fieldValues : (type === 'element' ? (item as Element).data : {})

    const items: ContextMenuItem[] = [
      {
        label: 'Take',
        icon: <Play size={14} />,
        onClick: () => {
          takeMutation.mutate({
            showId: activeShowId,
            elementId: item.id,
            itemType: type,
            channelId,
            layer,
            name,
            templateId,
            container,
            data: currentData
          })
        }
      },
      {
        label: 'Update',
        icon: <SkipForward size={14} />,
        onClick: () => {
          updatePlayoutMutation.mutate({
            showId: activeShowId,
            elementId: item.id,
            itemType: type,
            channelId,
            name,
            templateId,
            container,
            data: currentData
          })
        }
      },
      {
        label: 'Continue',
        icon: <SkipForward size={14} />,
        onClick: () => contMutation.mutate({
          showId: activeShowId,
          elementId: item.id,
          itemType: type,
          channelId
        })
      },
      {
        label: 'Out',
        icon: <Square size={14} />,
        onClick: () => outMutation.mutate({
          showId: activeShowId,
          elementId: item.id,
          itemType: type,
          channelId
        })
      },
      {
        label: 'Read',
        icon: <Eye size={14} />,
        onClick: () => readMutation.mutate({
          showId: activeShowId,
          elementId: item.id,
          itemType: type,
          channelId
        })
      },
      {
        label: 'Delete',
        icon: <Trash2 size={14} />,
        variant: 'danger',
        onClick: () => {
          if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
            if (type === 'template') {
              deleteTemplateMutation.mutate({ showId: activeShowId, templateId: item.id })
              if (selectedTemplateId === item.id) setSelectedTemplateId(null)
            } else {
              deleteElementMutation.mutate({ showId: activeShowId, elementId: item.id })
              if (selectedElementId === item.id) setSelectedElementId(null)
            }
          }
        }
      }
    ]

    setContextMenu({ x: e.clientX, y: e.clientY, items })
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
                              onContextMenu={(e) => handleContextMenu(e, 'template', t)}
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
                              onContextMenu={(evt) => handleContextMenu(evt, 'element', e)}
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
                  <FieldEditorPanel />
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
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
