import { Menu } from './Menu'
import { FieldEditorPanel } from './FieldEditorPanel'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { useShowStore } from '../stores/showStore'
import { useSelectionStore } from '../stores/selectionStore'
import { useConfigStore } from '../stores/configStore'
import { Box, Play, SkipForward, Square, Eye, Trash2 } from 'lucide-react'

import { useEffect, useState, useRef } from 'react'
import { StatusBar } from './StatusBar'
import { useTake, useOut, useCont, useUpdatePlayout } from '../hooks/usePlayout'
import { usePlayoutActions } from '../hooks/usePlayoutActions'
import { useDeleteElement } from '../hooks/useElementActions'
import { useDeleteTemplate, Template } from '../hooks/useTemplates'
import { usePlayoutMeta } from '../hooks/usePlayoutMeta'
import { ContextMenu, ContextMenuItem } from './ContextMenu'
import { TemplatesPanel } from './TemplatesPanel'
import { ElementsPanel } from './ElementsPanel'
import { PreviewPanel } from './PreviewPanel'
import { useLayoutStore } from '../stores/layoutStore'
import { Element } from '../hooks/useElements'
import { useNumpad } from '../hooks/useNumpad'






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
    setFieldValues,
    templateOverrides,
    elementOverrides,
    selectionVersion,
    fieldValues

  } = useSelectionStore()

  const { templates, elements, getMeta } = usePlayoutMeta(activeShowId)


  // Hooks — mutations used directly by the right-click context menu
  const takeMutation = useTake()
  const contMutation = useCont()
  const outMutation = useOut()
  const updatePlayoutMutation = useUpdatePlayout()
  const deleteElementMutation = useDeleteElement()
  const deleteTemplateMutation = useDeleteTemplate()
  // Shared playout actions (used by Numpad)
  const { handleTake, handleOut, handleCont } = usePlayoutActions()


  // Layout Store
  const { panelSizes, setPanelSize, setCallup } = useLayoutStore()

  // Sync callup buffer with selected element/template name
  useEffect(() => {
    const selectedId = selectedElementId || selectedTemplateId
    if (selectedId) {
      const item = elements?.find(e => e.id === selectedId) || templates?.find(t => t.id === selectedId)
      if (item && item.name) {
        setCallup(item.name)
      }
    }
  }, [selectedElementId, selectedTemplateId, selectionVersion, !!elements, !!templates, setCallup])

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
        onClick: () => {
          console.log(`[DEBUG] Context Menu Read clicked for ${type}: ${item.id}`)
          const store = useSelectionStore.getState()
          if (type === 'template') {
            store.setSelectedTemplateId(item.id)
          } else {
            store.setSelectedElementId(item.id)
          }
        }
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
  // Numpad Actions
  const handleRead = () => {
    const query = useLayoutStore.getState().callupBuffer.trim()
    if (!query) return

    const currentElements = elements
    const currentTemplates = templates
    const elementMatch = currentElements?.find(e => e.name.trim().toLowerCase() === query.toLowerCase())
    if (elementMatch) {
      useSelectionStore.getState().setSelectedElementId(elementMatch.id)
      return
    }

    const templateMatch = currentTemplates?.find(t => t.name.trim().toLowerCase() === query.toLowerCase())
    if (templateMatch) {
      useSelectionStore.getState().setSelectedTemplateId(templateMatch.id)
      return
    }
  }

  useNumpad({
    onRead: handleRead,
    onTake: handleTake,
    onContinue: handleCont,
    onTakeOut: handleOut
  })


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
          <PanelGroup
            orientation="horizontal"
            onLayoutChanged={(layout: any) => {
              const sizes = Array.isArray(layout) ? layout : Object.values(layout) as number[]
              setPanelSize('leftColumn', sizes[0])
              setPanelSize('rightColumn', sizes[1])
            }}

          >

            {/* Left Column */}
            <Panel
              defaultSize={panelSizes.leftColumn}
              minSize={20}
            >
              <PanelGroup
                orientation="vertical"
                onLayoutChanged={(layout: any) => {
                  const sizes = Array.isArray(layout) ? layout : Object.values(layout) as number[]
                  setPanelSize('leftVerticalSplit', sizes[0])
                }}

              >

                {/* Templates */}
                <Panel
                  defaultSize={panelSizes.leftVerticalSplit}
                  minSize={10}
                >
                  <TemplatesPanel
                    onContextMenu={handleContextMenu}
                  />
                </Panel>


                <ResizeHandle />

                {/* Elements */}
                <Panel
                  defaultSize={100 - panelSizes.leftVerticalSplit}
                  minSize={10}
                >
                  <ElementsPanel
                    onContextMenu={handleContextMenu}
                  />
                </Panel>


              </PanelGroup>
            </Panel>


            <ResizeHandle />

            {/* Right Column */}
            <Panel
              defaultSize={panelSizes.rightColumn}
              minSize={20}
            >
              <PanelGroup
                orientation="vertical"
                onLayoutChanged={(layout: any) => {
                  const sizes = Array.isArray(layout) ? layout : Object.values(layout) as number[]
                  setPanelSize('rightVerticalSplit', sizes[0])
                }}

              >

                {/* Field Editor */}
                <Panel
                  defaultSize={panelSizes.rightVerticalSplit}
                  minSize={10}
                >
                  <FieldEditorPanel />
                </Panel>


                <ResizeHandle />

                {/* Preview */}
                <Panel
                  defaultSize={100 - panelSizes.rightVerticalSplit}
                  minSize={10}
                >
                  <PreviewPanel />
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
