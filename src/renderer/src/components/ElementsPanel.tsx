import { CollapsiblePanel } from './CollapsiblePanel'

interface ElementsPanelProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function ElementsPanel({ isCollapsed, onToggle }: ElementsPanelProps) {
  return (
    <CollapsiblePanel
      title="Elements"
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="p-4 text-glacier-300 text-sm">
        <p>Elements list will appear here</p>
      </div>
    </CollapsiblePanel>
  )
}
