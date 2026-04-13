import { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsiblePanelProps {
  title: string
  isCollapsed: boolean
  onToggle: () => void
  children: ReactNode
  className?: string
}

export function CollapsiblePanel({
  title,
  isCollapsed,
  onToggle,
  children,
  className = ''
}: CollapsiblePanelProps) {
  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-8 h-full bg-glacier-800 border-r border-glacier-700 flex items-center justify-center hover:bg-glacier-700 transition-colors group flex-shrink-0"
        title={title}
      >
        <span className="text-xs text-glacier-300 group-hover:text-glacier-100 transition-colors" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          {title}
        </span>
      </button>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-glacier-800 border border-glacier-700 rounded overflow-hidden ${className}`}>
      <div className="flex items-center justify-between bg-glacier-950 px-4 py-2 border-b border-glacier-700 flex-shrink-0">
        <h3 className="text-sm font-semibold text-glacier-50 truncate">{title}</h3>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-glacier-800 rounded transition-colors flex-shrink-0 ml-2"
          title={`Collapse ${title}`}
        >
          <ChevronDown className="w-4 h-4 text-glacier-300 hover:text-glacier-100" />
        </button>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
