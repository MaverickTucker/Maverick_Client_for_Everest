import { useState } from 'react'
import { X, Plus, Edit2, Trash2, Check, Download, Upload } from 'lucide-react'
import { LogoSpinner } from './LogoSpinner'
import { useShows, Show } from '../hooks/useShows'
import { useShowStore } from '../stores/showStore'

interface ShowsDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function ShowsDialog({ isOpen, onClose }: ShowsDialogProps) {
    const { shows, isLoading, isError, createShow, updateShow, deleteShow, exportShow, importShow } = useShows()
    const { activeShowId, setActiveShow } = useShowStore()

    const [isCreating, setIsCreating] = useState(false)
    const [newShowName, setNewShowName] = useState('')

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editShowName, setEditShowName] = useState('')

    if (!isOpen) return null

    const handleSelectShow = (show: Show) => {
        setActiveShow(show.id, show.name)
        onClose()
    }

    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    const handleCreate = async () => {
        if (!newShowName.trim()) return
        await createShow.mutateAsync({ name: newShowName })
        setNewShowName('')
        setIsCreating(false)
    }

    const handleSaveEdit = async (show: Show) => {
        if (!editShowName.trim()) return
        await updateShow.mutateAsync({ ...show, name: editShowName })
        setEditingId(null)
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this show?')) {
            await deleteShow.mutateAsync(id)
        }
    }

    const handleExport = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        try {
            await exportShow.mutateAsync(id)
        } catch (err) {
            console.error('Export failed:', err)
            alert('Failed to export show.')
        }
    }

    const handleImportClick = async () => {
        try {
            await importShow.mutateAsync(undefined)
        } catch (err) {
            console.error('Import failed:', err)
            // Error handling is mostly inside the hook/main, but we can alert here
            if (err instanceof Error && err.message !== 'No import data provided') {
                alert('Failed to import show: ' + err.message)
            }
        }
    }

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '400px', backgroundColor: 'var(--glacier-800)', border: '1px solid var(--glacier-700)',
                    borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}
                onClick={handleContentClick}
            >
                {/* Header */}
                <div style={{ backgroundColor: 'var(--glacier-950)', padding: '16px', borderBottom: '1px solid var(--glacier-700)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--glacier-50)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Shows
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => {
                                    setIsCreating(true)
                                    setNewShowName('')
                                }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--mint-green)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--glacier-600)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Add Show"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={handleImportClick}
                                style={{ background: 'transparent', border: 'none', color: 'var(--glacier-300)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--glacier-600)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Import Show (JSON)"
                            >
                                {importShow.isPending ? <LogoSpinner size={18} /> : <Download size={18} />}
                            </button>
                        </div>
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'var(--glacier-300)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--glacier-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--glacier-300)'}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>

                    {isLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0', color: 'var(--mint-green)' }}>
                            <LogoSpinner size={24} />
                        </div>
                    )}

                    {!isLoading && isError && (
                        <div style={{ color: '#ef4444', padding: '16px', fontSize: '13px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            Failed to load shows. <br />
                            <span style={{ fontSize: '11px', opacity: 0.8 }}>Check server connection & API key.</span>
                        </div>
                    )}

                    {isCreating && (
                        <div style={{
                            padding: '8px 12px', backgroundColor: 'var(--glacier-900)', border: '1px solid var(--mint-green)',
                            borderRadius: '6px', color: 'var(--glacier-50)', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <input
                                autoFocus
                                value={newShowName}
                                onChange={(e) => setNewShowName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate()
                                    if (e.key === 'Escape') setIsCreating(false)
                                }}
                                placeholder="Show Name..."
                                style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none' }}
                            />
                            <button
                                onClick={handleCreate}
                                disabled={createShow.isPending}
                                style={{ background: 'transparent', border: 'none', color: 'var(--mint-green)', cursor: 'pointer', padding: '4px' }}
                            >
                                {createShow.isPending ? <LogoSpinner size={16} /> : <Check size={16} />}
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--glacier-300)', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {!isLoading && shows.length === 0 && !isCreating && (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#71717a', fontSize: '14px' }}>
                            No shows available. Click the + icon to add one.
                        </div>
                    )}

                    {!isLoading && shows.map((show) => (
                        <div
                            key={show.id}
                            onClick={() => handleSelectShow(show)}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: activeShowId === show.id ? 'rgba(52, 211, 153, 0.1)' : 'var(--glacier-900)',
                                border: '1px solid',
                                borderColor: activeShowId === show.id ? 'var(--mint-green)' : 'var(--glacier-700)',
                                borderRadius: '6px', color: 'var(--glacier-50)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => { if (activeShowId !== show.id) e.currentTarget.style.borderColor = 'var(--mint-green)' }}
                            onMouseLeave={(e) => { if (activeShowId !== show.id) e.currentTarget.style.borderColor = 'var(--glacier-700)' }}
                        >
                            {editingId === show.id ? (
                                <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                    <input
                                        autoFocus
                                        value={editShowName}
                                        onChange={(e) => setEditShowName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit(show)
                                            if (e.key === 'Escape') setEditingId(null)
                                        }}
                                        style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none' }}
                                    />
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => handleSaveEdit(show)}
                                            disabled={updateShow.isPending}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--mint-green)', cursor: 'pointer', padding: '4px' }}
                                        >
                                            {updateShow.isPending ? <LogoSpinner size={16} /> : <Check size={16} />}
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--glacier-300)', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <span style={{ fontSize: '14px', fontWeight: activeShowId === show.id ? 600 : 400 }}>
                                        {show.name}
                                        {activeShowId === show.id && <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--mint-green)', verticalAlign: 'middle' }}>(ACTIVE)</span>}
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={(e) => handleExport(e, show.id)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--glacier-300)', cursor: 'pointer', padding: '4px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mint-green)'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--glacier-300)'}
                                            title="Export Show (JSON)"
                                        >
                                            {exportShow.isPending && exportShow.variables === show.id ? <LogoSpinner size={14} /> : <Upload size={14} />}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setEditingId(show.id)
                                                setEditShowName(show.name)
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--glacier-300)', cursor: 'pointer', padding: '4px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--glacier-300)'}
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(show.id)
                                            }}
                                            disabled={deleteShow.isPending}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--glacier-300)', cursor: 'pointer', padding: '4px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--glacier-300)'}
                                            title="Delete"
                                        >
                                            {deleteShow.isPending ? <LogoSpinner size={14} /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
