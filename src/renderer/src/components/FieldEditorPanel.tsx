import { CollapsiblePanel } from './CollapsiblePanel'

interface FieldEditorPanelProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function FieldEditorPanel({ isCollapsed, onToggle }: FieldEditorPanelProps) {
  return (
    <CollapsiblePanel
      title="Field Editor"
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="p-4 text-zinc-400 text-sm">
        <p>Field editor will appear here</p>
      </div>
    </CollapsiblePanel>
  )
}
