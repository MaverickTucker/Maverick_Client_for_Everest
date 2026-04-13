import { X, CheckCircle2, AlertCircle } from 'lucide-react'

// Using public path for the icon
const loadingIcon = '/Loading icon.ico'

export interface ImportItem {
    id: string
    name: string
    path: string
    status: 'pending' | 'importing' | 'success' | 'error'
    error?: string
}

interface ImportStatusModalProps {
    isOpen: boolean
    items: ImportItem[]
    onClose: () => void
}

export function ImportStatusModal({ isOpen, items, onClose }: ImportStatusModalProps) {
    if (!isOpen) return null

    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    const isFinished = items.every(item => item.status === 'success' || item.status === 'error')
    const hasError = items.some(item => item.status === 'error')

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                zIndex: 9999, // Ensure it's on top of everything
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                padding: '20px'
            }}
            onClick={isFinished && hasError ? onClose : undefined}
        >
            <style>
                {`
                @keyframes rotate-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-rotate-slow {
                    animation: rotate-slow 2s linear infinite;
                }
                .animate-pulse-custom {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                `}
            </style>

            <div
                style={{
                    width: '100%', maxWidth: '450px',
                    backgroundColor: 'var(--glacier-800)',
                    border: '1px solid var(--glacier-700)',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}
                onClick={handleContentClick}
            >
                {/* Header */}
                <div style={{ backgroundColor: 'var(--glacier-950)', padding: '16px', borderBottom: '1px solid var(--glacier-700)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: 'var(--glacier-50)', fontSize: '16px', fontWeight: 600 }}>
                        Import Status
                    </h2>
                    {hasError && (
                        <button
                            onClick={onClose}
                            style={{ background: 'transparent', border: 'none', color: 'var(--glacier-400)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--glacier-50)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--glacier-400)'}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* List */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                backgroundColor: 'rgba(24, 24, 27, 0.4)',
                                border: '1px solid rgba(63, 63, 70, 0.5)',
                                padding: '12px', borderRadius: '8px',
                                display: 'flex', flexDirection: 'column', gap: '8px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flex: 1 }}>
                                    {item.status === 'importing' && (
                                        <img
                                            src={loadingIcon}
                                            className="animate-rotate-slow"
                                            style={{ width: '20px', height: '20px', flexShrink: 0, filter: 'drop-shadow(0 0 5px var(--mint-green))' }}
                                            alt="Loading"
                                        />
                                    )}
                                    {item.status === 'pending' && (
                                        <div
                                            style={{
                                                width: '20px', height: '20px', border: '2px solid var(--glacier-600)',
                                                borderTopColor: 'transparent', borderRadius: '50%', flexShrink: 0,
                                                filter: 'drop-shadow(0 0 3px var(--mint-green))'
                                            }}
                                        />
                                    )}
                                    {item.status === 'success' && (
                                        <CheckCircle2 size={20} style={{ color: 'var(--mint-green)', flexShrink: 0, filter: 'drop-shadow(0 0 8px var(--mint-green))' }} />
                                    )}
                                    {item.status === 'error' && (
                                        <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0, filter: 'drop-shadow(0 0 8px #f59e0b)' }} />
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                        <span style={{ color: 'var(--glacier-50)', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.name}
                                        </span>
                                        <span style={{ color: 'var(--glacier-400)', fontSize: '10px', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.path}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {item.status === 'importing' && <span className="animate-pulse-custom" style={{ color: 'var(--mint-green)' }}>Importing</span>}
                                    {item.status === 'success' && <span style={{ color: 'var(--mint-green)' }}>Success</span>}
                                    {item.status === 'error' && <span style={{ color: '#f59e0b' }}>Error</span>}
                                    {item.status === 'pending' && <span style={{ color: 'var(--glacier-500)' }}>Queued</span>}
                                </div>
                            </div>

                            {item.status === 'error' && item.error && (
                                <div style={{ marginTop: '4px', padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', fontSize: '11px', color: '#f87171' }}>
                                    {item.error.includes('503') ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontWeight: 'bold' }}>Engine Reachability Error</span>
                                            <span>The Maverick Engine (Everest) at Localhost:1980 is not reachable by the Relay Server.</span>
                                        </div>
                                    ) : item.error.includes('504') || item.error.toLowerCase().includes('timeout') ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontWeight: 'bold' }}>Engine Timeout</span>
                                            <span>The scene was sent, but the Everest Engine did not confirm load in time. The scene may still have imported — check your template list before retrying.</span>
                                        </div>
                                    ) : (
                                        item.error
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px', backgroundColor: 'rgba(9, 9, 11, 0.3)', borderTop: '1px solid var(--glacier-700)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--glacier-400)' }}>
                        {isFinished ? 'Import session complete' : 'Importing scenes, please wait...'}
                    </div>
                    {hasError && (
                        <button
                            onClick={onClose}
                            style={{
                                backgroundColor: 'var(--glacier-700)', border: 'none', color: 'var(--glacier-50)',
                                padding: '6px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--glacier-600)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--glacier-700)'}
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
