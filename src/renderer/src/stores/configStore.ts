import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { secureAxios } from '../api/secure-axios'
import { useConnectionStore } from './connectionStore'

export interface Profile {
    id: string
    name: string
    description?: string
    default_pgm_channel_id?: string
    default_pvw_channel_id?: string
}

export interface Channel {
    id: string
    name: string
    profile_id: string
    role: 'PGM' | 'PVW' | 'NONE'
}

export interface Engine {
    id: string
    host: string
    port: number
    status?: string
}

interface ConfigState {
    profiles: Profile[]
    channels: Channel[]
    engines: Engine[]
    mappings: Record<string, string[]> // channelId -> engineIds
    selectedProfileId: string | null

    setProfiles: (profiles: Profile[]) => void
    setChannels: (channels: Channel[]) => void
    setEngines: (engines: Engine[]) => void
    setMappings: (mappings: Record<string, string[]>) => void
    setSelectedProfileId: (id: string | null) => void

    fetchProfiles: () => Promise<void>
    fetchChannels: (profileId?: string) => Promise<void>
    fetchEngines: () => Promise<void>
    fetchMappings: () => Promise<void>
    updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>
    initializeEngineWS: () => void
    engineSocket: WebSocket | null
    isServerConnected: boolean
}

export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => ({
            profiles: [],
            channels: [],
            engines: [],
            mappings: {},
            selectedProfileId: null,

            setProfiles: (profiles) => set({ profiles }),
            setChannels: (channels) => set({ channels }),
            setEngines: (engines) => set({ engines }),
            setMappings: (mappings) => set({ mappings }),
            setSelectedProfileId: (id) => set({ selectedProfileId: id }),

            fetchProfiles: async () => {
                try {
                    const response = await secureAxios.get<Profile[]>('/api/profiles')
                    set({ profiles: response.data })
                    if (response.data.length > 0 && !get().selectedProfileId) {
                        set({ selectedProfileId: response.data[0].id })
                    }
                } catch (error) {
                    console.error('Failed to fetch profiles:', error)
                }
            },

            fetchChannels: async (profileId) => {
                try {
                    const pid = profileId || get().selectedProfileId
                    if (!pid) return
                    const response = await secureAxios.get<Channel[]>(`/api/channels`, {
                        params: { profile_id: pid }
                    })
                    set({ channels: response.data })
                    await get().fetchMappings()
                } catch (error) {
                    console.error('Failed to fetch channels:', error)
                }
            },

            fetchEngines: async () => {
                try {
                    const response = await secureAxios.get<Engine[]>('/api/engines')
                    const normalized = (response.data || []).map(e => ({
                        ...e,
                        status: e.status ? e.status.toUpperCase() : undefined
                    }))
                    set({ engines: normalized })
                } catch (error) {
                    console.error('Failed to fetch engines:', error)
                }
            },

            fetchMappings: async () => {
                const channels = get().channels
                const newMappings: Record<string, string[]> = {}
                await Promise.all(channels.map(async (ch) => {
                    try {
                        const res = await secureAxios.get(`/api/channels/${ch.id}/engines`)
                        newMappings[ch.id] = res.data.map((e: any) => e.id)
                    } catch (e) {
                        newMappings[ch.id] = []
                    }
                }))
                set({ mappings: newMappings })
            },

            updateProfile: async (id, updates) => {
                try {
                    await secureAxios.put(`/api/profiles/${id}`, updates)
                    await get().fetchProfiles()
                } catch (error) {
                    console.error('Failed to update profile:', error)
                }
            },

            engineSocket: null,
            isServerConnected: false,

            initializeEngineWS: () => {
                if (get().engineSocket) return

                const { host, port } = useConnectionStore.getState()
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
                const API_KEY = import.meta.env?.VITE_MRS_API_KEY || ''
                const wsUrl = `${protocol}//${host}:${port}/api/ws/engines?api_key=${API_KEY}`

                const socket = new WebSocket(wsUrl)

                socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data)
                        if (message.type === 'INITIAL_STATE') {
                            console.log('[WS Engines] Initial state received:', message.engines)
                            const normalized = (message.engines || []).map((e: Engine) => ({
                                ...e,
                                status: e.status ? e.status.toUpperCase() : undefined
                            }))
                            set({ engines: normalized })
                        } else if (message.event === 'engine_state_change') {
                            console.log('[WS Engines] Status change:', message)
                            const newStatus = message.state ? String(message.state).toUpperCase() : undefined
                            set((state) => ({
                                engines: (state.engines || []).map(e =>
                                    e.id === message.engine_id ? { ...e, status: newStatus } : e
                                )
                            }))
                        }
                    } catch (e) {
                        console.error('[WS Engines] Failed to parse message:', e)
                    }
                }

                socket.onopen = () => {
                    console.log('[WS Engines] Connected')
                    set({ isServerConnected: true })
                }
                socket.onclose = () => {
                    console.log('[WS Engines] Disconnected')
                    set({ engineSocket: null, isServerConnected: false })
                    // Reconnect after 3s
                    setTimeout(() => get().initializeEngineWS(), 3000)
                }
                socket.onerror = (err) => {
                    console.error('[WS Engines] Error:', err)
                    set({ isServerConnected: false })
                }

                set({ engineSocket: socket as any })
            }
        }),
        {
            name: 'maverick-config-storage',
            partialize: (state) => ({ selectedProfileId: state.selectedProfileId }),
        }
    )
)
