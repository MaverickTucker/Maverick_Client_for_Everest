import { useEffect, useState } from 'react'
import { useConfigStore } from '../stores/configStore'
import { User, Tv, HardDrive, Circle } from 'lucide-react'

export function StatusBar() {
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
        initializeEngineWS,
        isServerConnected
    } = useConfigStore()

    const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null)

    useEffect(() => {
        fetchProfiles()
        fetchEngines()
        initializeEngineWS()
    }, [])

    useEffect(() => {
        if (selectedProfileId) {
            fetchChannels(selectedProfileId)
        }
    }, [selectedProfileId])

    const renderGradient = (colors: string[]) => {
        if (colors.length === 0) return 'var(--glacier-700)'
        if (colors.length === 1) return colors[0]
        const segments = colors.map((c, i) => `${c} ${(i / colors.length) * 100}% ${((i + 1) / colors.length) * 100}%`).join(', ')
        return `conic-gradient(${segments})`
    }

    const getBaseName = (path: string) => {
        if (!path) return ''
        return path.split(/[\\/]/).pop()?.replace('.sum', '') || ''
    }

    return (
        <div style={{
            height: '32px',
            backgroundColor: 'var(--glacier-950)',
            borderTop: '1px solid var(--glacier-700)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '24px',
            fontSize: '12px',
            color: 'var(--glacier-300)',
            zIndex: 100,
            position: 'relative',
            overflow: 'visible'
        }}>
            {/* Profile Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} className="text-mint-green" />
                <select
                    value={selectedProfileId || ''}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--glacier-50)',
                        fontSize: '12px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    {profiles.length === 0 && <option value="" disabled>No Profiles</option>}
                    {profiles.map(p => (
                        <option key={p.id} value={p.id} style={{ backgroundColor: 'var(--glacier-800)', color: '#fff' }}>
                            {p.name.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--glacier-700)' }} />

            {/* Channels List */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, overflow: 'visible' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tv size={14} />
                    <span style={{ fontWeight: 600, color: 'var(--glacier-400)' }}>CHANNELS:</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', overflow: 'visible', paddingBottom: '2px', alignItems: 'center' }}>
                    {channels.length === 0 ? (
                        <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No channels in this profile</span>
                    ) : (
                        channels
                            .sort((a, b) => {
                                const rolePriority: Record<string, number> = { 'PGM': 0, 'PVW': 1, 'NONE': 2 }
                                const pA = rolePriority[a.role] ?? 99
                                const pB = rolePriority[b.role] ?? 99
                                if (pA !== pB) return pA - pB
                                return a.name.localeCompare(b.name)
                            })
                            .map(ch => {
                                const mappedIds = mappings[ch.id] || []
                                const mappedEngines = mappedIds.map(id => (engines || []).find(e => e.id === id)).filter(Boolean)
                                const colors = mappedEngines.length > 0
                                    ? mappedEngines.map(eng => {
                                        return eng?.status === 'ONLINE' ? '#22c55e' : (eng?.status === 'OFFLINE' ? '#ef4444' : 'var(--glacier-700)')
                                    })
                                    : ['var(--glacier-700)']

                                const gradient = renderGradient(colors)

                                return (
                                    <div
                                        key={ch.id}
                                        onMouseEnter={() => setHoveredChannelId(ch.id)}
                                        onMouseLeave={() => setHoveredChannelId(null)}
                                        style={{
                                            padding: '1.5px',
                                            background: gradient,
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'help',
                                            transition: 'transform 0.1s ease',
                                            transform: hoveredChannelId === ch.id ? 'translateY(-1px)' : 'none',
                                            position: 'relative'
                                        }}
                                    >
                                        <div
                                            style={{
                                                backgroundColor: 'var(--glacier-950)',
                                                padding: '1px 10px',
                                                borderRadius: '11px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <span style={{ color: 'var(--glacier-100)', fontWeight: 600, fontSize: '10px', letterSpacing: '0.02em' }}>{ch.name}</span>
                                        </div>

                                        {/* Status Tooltip */}
                                        {hoveredChannelId === ch.id && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 'calc(100% + 12px)',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                backgroundColor: 'var(--glacier-900)',
                                                border: '1px solid var(--glacier-700)',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                minWidth: '240px',
                                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 0 15px var(--glacier-950)',
                                                zIndex: 1000,
                                                pointerEvents: 'none',
                                                animation: 'fadeIn 0.2s ease'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', borderBottom: '1px solid var(--glacier-700)', paddingBottom: '8px' }}>
                                                    <Tv size={14} className="text-mint-green" />
                                                    <span style={{ fontWeight: 800, color: 'var(--glacier-50)', fontSize: '11px', letterSpacing: '0.05em' }}>{ch.name} ENGINE STATUS</span>
                                                </div>

                                                <style>{`
                                                    @keyframes fadeIn {
                                                        from { opacity: 0; transform: translateX(-50%) translateY(5px); }
                                                        to { opacity: 1; transform: translateX(-50%) translateY(0); }
                                                    }
                                                `}</style>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {mappedEngines.length === 0 ? (
                                                        <div style={{ fontSize: '10px', color: 'var(--glacier-500)', fontStyle: 'italic' }}>No engines mapped</div>
                                                    ) : (
                                                        mappedEngines.map((eng: any) => (
                                                            <div key={eng?.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <HardDrive size={12} color={eng?.status === 'ONLINE' ? 'var(--mint-green)' : 'var(--glacier-500)'} />
                                                                        <span style={{ fontWeight: 700, color: 'var(--glacier-100)', fontSize: '11px' }}>{eng?.name || eng?.host}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <Circle size={6} fill={eng?.status === 'ONLINE' ? 'var(--mint-green)' : '#ef4444'} color="transparent" />
                                                                        <span style={{ fontSize: '9px', fontWeight: 800, color: eng?.status === 'ONLINE' ? 'var(--mint-green)' : '#ef4444' }}>{eng?.status}</span>
                                                                    </div>
                                                                </div>

                                                                {eng?.status === 'ONLINE' && eng.current_scene?.scene?.layers && (
                                                                    <div style={{ marginLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid var(--glacier-800)', paddingLeft: '8px', marginTop: '2px' }}>
                                                                        {eng.current_scene.scene.layers.map((layer: any, idx: number) => (
                                                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                                                                                <span style={{ color: 'var(--glacier-500)', fontWeight: 700, minWidth: '40px' }}>L{idx + 1}</span>
                                                                                <span style={{ color: layer.path ? 'var(--mint-green)' : 'var(--glacier-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                                                                    {layer.path ? getBaseName(layer.path) : 'EMPTY'}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '-6px',
                                                    left: '50%',
                                                    transform: 'translateX(-50%) rotate(45deg)',
                                                    width: '12px',
                                                    height: '12px',
                                                    backgroundColor: 'var(--glacier-900)',
                                                    borderRight: '1px solid var(--glacier-700)',
                                                    borderBottom: '1px solid var(--glacier-700)',
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                    )}
                </div>
            </div>

            {/* Connection Status Indicator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: isServerConnected ? 'var(--mint-green)' : '#ef4444',
                opacity: 0.9,
                fontWeight: 700,
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease'
            }}>
                <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isServerConnected ? 'var(--mint-green)' : '#ef4444',
                    boxShadow: isServerConnected ? '0 0 8px var(--mint-green)' : '0 0 8px #ef4444'
                }} />
                <span>MRS: {isServerConnected ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
        </div>
    )
}
