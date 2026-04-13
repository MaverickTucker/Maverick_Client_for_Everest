import { CollapsiblePanel } from './CollapsiblePanel'

interface TemplatesPanelProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function TemplatesPanel({ isCollapsed, onToggle }: TemplatesPanelProps) {
  return (
    <CollapsiblePanel
      title="Templates"
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="p-4 text-glacier-300 text-sm">
        <p>Templates list will appear here</p>
      </div>
    </CollapsiblePanel>
  )
}
