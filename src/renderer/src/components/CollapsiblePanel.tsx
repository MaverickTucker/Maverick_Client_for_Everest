import { ReactNode } from 'react'



interface CollapsiblePanelProps {
  title: string
  children: ReactNode
  className?: string
  headerRight?: ReactNode
}

export function CollapsiblePanel({
  title,
  children,
  className = '',
  headerRight
}: CollapsiblePanelProps) {



  return (
    <div
      className={className}
      style={{
        height: 'calc(100% - 8px)',
        overflow: 'hidden',
        backgroundColor: 'rgba(49, 72, 89, 0.85)',
        backdropFilter: 'blur(4px)',
        border: '1px solid var(--glacier-700)',
        margin: '4px',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ backgroundColor: 'var(--glacier-950)', padding: '6px 16px', borderBottom: '1px solid var(--glacier-700)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--glacier-50)' }}>{title}</h3>
        <div className="flex items-center gap-2">
          {headerRight}
        </div>
      </div>


      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
