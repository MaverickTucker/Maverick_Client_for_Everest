import { io } from 'socket.io-client'
import { useChannelStore } from '../stores/channelStore'

export const socket = io('http://localhost:8188', {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
})

export const subscribeToChannel = (channelId: string) => {
    socket.emit('subscribe', `channel:${channelId}`)

    socket.on(`channel:${channelId}:events`, (event) => {
        useChannelStore.getState().handleEvent(event)
    })
}
