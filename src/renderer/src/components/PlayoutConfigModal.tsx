import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Monitor, Tv, User, Check } from 'lucide-react'
import { useConfigStore } from '../stores/configStore'
import { secureAxios } from '../api/secure-axios'

interface PlayoutConfigModalProps {
    isOpen: boolean
    onClose: () => void
}

export function PlayoutConfigModal({ isOpen, onClose }: PlayoutConfigModalProps) {
    const {
        profiles,
        channels,
        engines,
        mappings,
        selectedProfileId,
        setSelectedProfileId,
        fetchProfiles,
        fetchChannels,
        fetchEngines,
        fetchMappings,
        updateProfile,
    } = useConfigStore()

    const [activeTab, setActiveTab] = useState('playout-config')

    // Inline editing states
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
    const [editingProfileName, setEditingProfileName] = useState('')
    const [isAddingProfile, setIsAddingProfile] = useState(false)

    const [isAddingChannel, setIsAddingChannel] = useState(false)
    const [newChannelName, setNewChannelName] = useState('')

    const [isAddingEngine, setIsAddingEngine] = useState(false)
    const [newEngineHost, setNewEngineHost] = useState('')
    const [newEnginePort, setNewEnginePort] = useState(1980)

    useEffect(() => {
        if (selectedProfileId) {
            fetchChannels(selectedProfileId)
        }
    }, [selectedProfileId])

    useEffect(() => {
        if (profiles.length > 0 && !selectedProfileId) {
            setSelectedProfileId(profiles[0].id)
        }
    }, [profiles])

    // Profiles Logic
    const handleAddProfile = async () => {
        if (!editingProfileName.trim()) {
            setIsAddingProfile(false)
            return
        }
        try {
            await secureAxios.post('/api/profiles', { name: editingProfileName })
            setEditingProfileName('')
            setIsAddingProfile(false)
            fetchProfiles()
        } catch (e) {
            console.error(e)
        }
    }

    const handleUpdateProfile = async (id: string) => {
        if (!editingProfileName.trim()) {
            setEditingProfileId(null)
            return
        }
        await updateProfile(id, { name: editingProfileName })
        setEditingProfileId(null)
    }

    const handleDeleteProfile = async (id: string) => {
        if (!window.confirm('Delete this profile?')) return
        try {
            await secureAxios.delete(`/api/profiles/${id}`)
            fetchProfiles()
        } catch (e) {
            console.error(e)
        }
    }

    // Channels Logic
    const handleAddChannel = async () => {
        if (!newChannelName.trim() || !selectedProfileId) {
            setIsAddingChannel(false)
            return
        }
        const name = newChannelName
        setNewChannelName('')
        setIsAddingChannel(false)
        try {
            await secureAxios.post('/api/channels', {
                name: name,
                profile_id: selectedProfileId,
                role: 'NONE'
            }, {
                params: { profile_id: selectedProfileId }
            })

            fetchChannels(selectedProfileId)
            fetchEngines()
        } catch (e) {
            console.error('Failed to add channel:', e)
        }
    }

    const handleDeleteChannel = async (id: string) => {
        if (!window.confirm('Delete this channel?')) return
        try {
            await secureAxios.delete(`/api/channels/${id}`)
            if (selectedProfileId) fetchChannels(selectedProfileId)
        } catch (e) {
            console.error(e)
        }
    }


    // Engines Logic
    const handleAddEngine = async () => {
        if (!newEngineHost.trim()) {
            setIsAddingEngine(false)
            return
        }
        const host = newEngineHost
        const port = newEnginePort
        setNewEngineHost('')
        setNewEnginePort(1980)
        setIsAddingEngine(false)
        try {
            await secureAxios.post('/api/engines', {
                name: host,
                host: host,
                port: port
            })

            fetchEngines()
            setTimeout(() => fetchEngines(), 1500)
        } catch (e) {
            console.error('Failed to add engine:', e)
        }
    }

    const handleDeleteEngine = async (id: string) => {
        if (!window.confirm('Delete this engine?')) return
        try {
            await secureAxios.delete(`/api/engines/${id}`)
            fetchEngines()
        } catch (e) {
            console.error(e)
        }
    }

    const handleMapEngine = async (channelId: string, engineId: string) => {
        try {
            const isMapped = mappings[channelId]?.includes(engineId)
            if (isMapped) {
                await secureAxios.delete(`/api/channels/${channelId}/engines/${engineId}`)
            } else {
                await secureAxios.post(`/api/channels/${channelId}/engines/${engineId}`)
            }
            await fetchMappings()
        } catch (e) {
            console.error(e)
        }
    }

    const setChannelRole = async (channelId: string, role: 'pgm' | 'pvw') => {
        if (!selectedProfileId) return
        const roleUpper = role.toUpperCase() as 'PGM' | 'PVW' | 'NONE'
        const targetChannel = channels.find(c => c.id === channelId)
        if (!targetChannel) return

        try {
            if (targetChannel.role === roleUpper) {
                // Toggle OFF
                await secureAxios.patch(`/api/channels/${channelId}/role`, null, {
                    params: { role: 'NONE' }
                })
            } else {
                // Unset previous
                const prevChannel = channels.find(c => c.role === roleUpper)
                if (prevChannel && prevChannel.id !== channelId) {
                    await secureAxios.patch(`/api/channels/${prevChannel.id}/role`, null, {
                        params: { role: 'NONE' }
                    })
                }
                // Set New
                await secureAxios.patch(`/api/channels/${channelId}/role`, null, {
                    params: { role: roleUpper }
                })
            }
            fetchChannels(selectedProfileId)
        } catch (e) {
            console.error(e)
        }
    }

    const renderGradient = (colors: string[]) => {
        if (colors.length === 0) return 'var(--glacier-700)'
        if (colors.length === 1) return colors[0]
        const segments = colors.map((c, i) => `${c} ${(i / colors.length) * 100}% ${((i + 1) / colors.length) * 100}%`).join(', ')
        return `conic-gradient(${segments})`
    }


    if (!isOpen) return null

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '90vw', maxWidth: '1200px', height: '80vh',
                    backgroundColor: 'var(--glacier-800)', border: '1px solid var(--glacier-700)',
                    borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '20px 24px', backgroundColor: 'var(--glacier-950)', borderBottom: '1px solid var(--glacier-700)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--glacier-50)' }}>Settings</h2>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => setActiveTab('playout-config')}
                                style={{
                                    padding: '6px 16px', borderRadius: '4px', border: 'none', fontSize: '13px', fontWeight: 600,
                                    backgroundColor: activeTab === 'playout-config' ? 'var(--glacier-700)' : 'transparent',
                                    color: activeTab === 'playout-config' ? 'var(--mint-green)' : 'var(--glacier-400)',
                                    cursor: 'pointer'
                                }}
                            >
                                Playout Config
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--glacier-400)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Dynamic Content Space */}
                <div style={{ flex: 1, display: 'flex', padding: '24px', gap: '24px', overflow: 'hidden' }}>

                    {/* Profiles Panel */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--glacier-900)', borderRadius: '8px', border: '1px solid var(--glacier-700)', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--glacier-300)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={14} /> Profiles
                            </h3>
                            <button
                                onClick={() => { setIsAddingProfile(true); setEditingProfileName('New Profile'); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--mint-green)', cursor: 'pointer' }}
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {isAddingProfile && (
                                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid var(--mint-green)', borderRadius: '4px' }}>
                                    <input
                                        autoFocus
                                        value={editingProfileName}
                                        onChange={(e) => setEditingProfileName(e.target.value)}
                                        onBlur={handleAddProfile}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
                                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                            )}
                            {profiles.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedProfileId(p.id)}
                                    onDoubleClick={() => { setEditingProfileId(p.id); setEditingProfileName(p.name); }}
                                    style={{
                                        padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        backgroundColor: selectedProfileId === p.id ? 'rgba(52, 211, 153, 0.1)' : 'transparent',
                                        border: '1px solid', borderColor: selectedProfileId === p.id ? 'var(--mint-green)' : 'transparent'
                                    }}
                                >
                                    {editingProfileId === p.id ? (
                                        <input
                                            autoFocus
                                            value={editingProfileName}
                                            onChange={(e) => setEditingProfileName(e.target.value)}
                                            onBlur={() => handleUpdateProfile(p.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile(p.id)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--mint-green)', fontSize: '13px', outline: 'none' }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '13px', color: selectedProfileId === p.id ? 'var(--mint-green)' : 'var(--glacier-100)' }}>{p.name}</span>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--glacier-500)', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Channels Panel */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--glacier-900)', borderRadius: '8px', border: '1px solid var(--glacier-700)', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--glacier-300)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Tv size={14} /> Channels
                            </h3>
                            <button
                                onClick={() => setIsAddingChannel(true)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--mint-green)', cursor: 'pointer' }}
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {isAddingChannel && (
                                <div style={{ padding: '10px', backgroundColor: 'var(--glacier-950)', border: '1px solid var(--mint-green)', borderRadius: '6px' }}>
                                    <input
                                        autoFocus
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        onBlur={handleAddChannel}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                                        placeholder="Channel Name..."
                                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                            )}
                            {[...channels].sort((a, b) => a.name.localeCompare(b.name)).map(ch => {
                                const mappedIds = mappings[ch.id] || []
                                const colors = mappedIds.length > 0
                                    ? mappedIds.map(id => {
                                        const eng = engines.find(e => e.id === id)
                                        return eng?.status === 'ONLINE' ? '#22c55e' : (eng?.status === 'OFFLINE' ? '#ef4444' : 'var(--glacier-700)')
                                    })
                                    : ['var(--glacier-700)']
                                const gradient = renderGradient(colors)

                                return (
                                    <div
                                        key={ch.id}
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            e.currentTarget.style.transform = 'scale(1.02)'
                                        }}
                                        onDragLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)'
                                        }}
                                        onDrop={async (e) => {
                                            e.preventDefault()
                                            e.currentTarget.style.transform = 'scale(1)'
                                            const engineId = e.dataTransfer.getData('engineId')
                                            if (engineId && !mappings[ch.id]?.includes(engineId)) {
                                                handleMapEngine(ch.id, engineId)
                                            }
                                        }}
                                        style={{
                                            padding: '2px',
                                            background: gradient,
                                            borderRadius: '8px',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    >
                                        <div style={{ backgroundColor: 'var(--glacier-950)', borderRadius: '6px', padding: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--glacier-50)' }}>{ch.name}</span>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--glacier-400)', cursor: 'pointer' }}>
                                                        <input
                                                            type="radio"
                                                            checked={ch.role === 'PGM'}
                                                            onClick={(e) => { e.preventDefault(); setChannelRole(ch.id, 'pgm'); }}
                                                            readOnly
                                                            style={{ accentColor: 'var(--mint-green)' }}
                                                        /> PGM
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--glacier-400)', cursor: 'pointer' }}>
                                                        <input
                                                            type="radio"
                                                            checked={ch.role === 'PVW'}
                                                            onClick={(e) => { e.preventDefault(); setChannelRole(ch.id, 'pvw'); }}
                                                            readOnly
                                                            style={{ accentColor: 'var(--mint-green)' }}
                                                        /> PVW
                                                    </label>
                                                    <button onClick={() => handleDeleteChannel(ch.id)} style={{ background: 'transparent', border: 'none', color: 'var(--glacier-500)', cursor: 'pointer', marginLeft: '8px' }}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '11px', color: 'var(--glacier-500)', marginBottom: '6px' }}>Engines:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {mappedIds.map(engineId => {
                                                    const eng = engines.find(e => e.id === engineId)
                                                    if (!eng) return null
                                                    const isOnline = eng.status === 'ONLINE'
                                                    const statusColor = isOnline ? '#22c55e' : '#ef4444'
                                                    const statusBg = isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'

                                                    return (
                                                        <div
                                                            key={eng.id}
                                                            style={{
                                                                padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: `1px solid ${statusColor}`,
                                                                backgroundColor: statusBg, color: statusColor,
                                                                display: 'flex', alignItems: 'center', gap: '6px'
                                                            }}
                                                        >
                                                            {eng.host}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleMapEngine(ch.id, eng.id); }}
                                                                style={{ background: 'transparent', border: 'none', color: statusColor, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                                {mappedIds.length === 0 && (
                                                    <div style={{ fontSize: '10px', color: 'var(--glacier-600)', fontStyle: 'italic', padding: '4px 0' }}>
                                                        Drop engine here...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Engines Panel */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--glacier-900)', borderRadius: '8px', border: '1px solid var(--glacier-700)', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--glacier-300)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Monitor size={14} /> Engines
                            </h3>
                            <button
                                onClick={() => setIsAddingEngine(true)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--mint-green)', cursor: 'pointer' }}
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {isAddingEngine && (
                                <div style={{ padding: '12px', backgroundColor: 'var(--glacier-950)', border: '1px solid var(--mint-green)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                        autoFocus
                                        value={newEngineHost}
                                        onChange={(e) => setNewEngineHost(e.target.value)}
                                        placeholder="Hostname / IP"
                                        style={{ backgroundColor: 'var(--glacier-900)', border: '1px solid var(--glacier-700)', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="number"
                                            value={newEnginePort || ''}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value)
                                                setNewEnginePort(isNaN(val) ? 0 : val)
                                            }}
                                            placeholder="Port"
                                            style={{ flex: 1, backgroundColor: 'var(--glacier-900)', border: '1px solid var(--glacier-700)', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}
                                        />
                                        <button onClick={handleAddEngine} style={{ backgroundColor: 'var(--mint-green)', color: 'var(--glacier-950)', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                            <Check size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {engines.map(e => {
                                const isOnline = e.status === 'ONLINE'
                                const isOffline = e.status === 'OFFLINE'
                                const statusColor = isOnline ? '#22c55e' : (isOffline ? '#ef4444' : 'var(--glacier-700)')
                                return (
                                    <div
                                        key={e.id}
                                        draggable
                                        onDragStart={(evt) => {
                                            evt.dataTransfer.setData('engineId', e.id)
                                            evt.dataTransfer.effectAllowed = 'copy'
                                        }}
                                        style={{
                                            padding: '10px 12px',
                                            backgroundColor: 'var(--glacier-950)',
                                            border: `1px solid ${statusColor}`,
                                            borderRadius: '4px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'grab',
                                            opacity: isOnline ? 1 : 0.8
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '13px', color: statusColor, fontWeight: 600 }}>{e.host}</span>
                                            {isOffline && <span style={{ fontSize: '10px', color: '#ef4444', opacity: 0.7 }}>OFFLINE</span>}
                                            {(!isOnline && !isOffline) && <span style={{ fontSize: '10px', color: 'var(--glacier-500)', opacity: 0.7 }}>QUERYING...</span>}
                                        </div>
                                        <button onClick={() => handleDeleteEngine(e.id)} style={{ background: 'transparent', border: 'none', color: 'var(--glacier-500)', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', backgroundColor: 'var(--glacier-950)', borderTop: '1px solid var(--glacier-700)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '8px 20px', borderRadius: '6px', border: '1px solid var(--glacier-600)', backgroundColor: 'transparent', color: 'var(--glacier-100)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
