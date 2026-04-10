import { CollapsiblePanel } from './CollapsiblePanel'

interface PreviewPanelProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function PreviewPanel({ isCollapsed, onToggle }: PreviewPanelProps) {
  return (
    <CollapsiblePanel
      title="Preview"
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="p-4 text-zinc-400 text-sm">
        <p>Preview will appear here</p>
      </div>
    </CollapsiblePanel>
  )
}
