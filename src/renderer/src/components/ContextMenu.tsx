import { useEffect, useRef } from 'react'

export interface ContextMenuItem {
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'danger'
}

interface ContextMenuProps {
    x: number
    y: number
    items: ContextMenuItem[]
    onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [onClose])

    // Adjust position if menu goes off screen
    const menuStyle: React.CSSProperties = {
        position: 'fixed' as const,
        top: y,
        left: x,
        zIndex: 1000,
        minWidth: '160px',
        backgroundColor: 'var(--glacier-900)',
        border: '1px solid var(--glacier-700)',
        borderRadius: '4px',
        padding: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px'
    }

    return (
        <div ref={menuRef} style={menuStyle}>
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={(e) => {
                        e.stopPropagation()
                        item.onClick()
                        onClose()
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        borderRadius: '2px',
                        backgroundColor: 'transparent',
                        color: item.variant === 'danger' ? '#ef4444' : 'var(--glacier-100)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = item.variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                >
                    {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
                    {item.label}
                </button>
            ))}
        </div>
    )
}
