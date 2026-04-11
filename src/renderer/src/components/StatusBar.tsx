import { useEffect } from 'react'
import { useConfigStore } from '../stores/configStore'
import { User, Tv, Radio } from 'lucide-react'

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
        fetchMappings,
        initializeEngineWS
    } = useConfigStore()

    useEffect(() => {
        fetchProfiles()
        initializeEngineWS()
        const interval = setInterval(() => {
            fetchMappings()
        }, 5000)
        return () => clearInterval(interval)
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
            zIndex: 10
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tv size={14} />
                    <span style={{ fontWeight: 600, color: 'var(--glacier-400)' }}>CHANNELS:</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '2px', alignItems: 'center' }}>
                    {channels.length === 0 ? (
                        <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No channels in this profile</span>
                    ) : (
                        [...channels]
                            .sort((a, b) => {
                                const rolePriority = { 'PGM': 0, 'PVW': 1, 'NONE': 2 }
                                const pA = rolePriority[a.role] ?? 99
                                const pB = rolePriority[b.role] ?? 99
                                if (pA !== pB) return pA - pB
                                return a.name.localeCompare(b.name)
                            })
                            .map(ch => {
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
                                        style={{
                                            padding: '1.5px',
                                            background: gradient,
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
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
                                    </div>
                                )
                            })
                    )}
                </div>
            </div>

            {/* Connection Mode Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mint-green)', opacity: 0.8 }}>
                <Radio size={14} />
                <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>LIVE BROADCAST</span>
            </div>
        </div>
    )
}
