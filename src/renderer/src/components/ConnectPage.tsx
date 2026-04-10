import { useState } from 'react'
import { useConnectionStore } from '../stores/connectionStore'
import logo from '../assets/logo.png'

export function ConnectPage() {
    const { host: initialHost, port: initialPort, connect, isConnecting } = useConnectionStore()

    const [host, setHost] = useState(initialHost || '127.0.0.1')
    const [port, setPort] = useState(initialPort || '8188')

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault()
        await connect(host, port)
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', backgroundColor: '#09090b', color: '#fafafa' }}>
            <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#18181b', padding: '32px', borderRadius: '12px', border: '1px solid #3f3f46', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                <img src={logo} alt="Maverick Logo" style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 0 16px #10b981)', marginBottom: '24px', borderRadius: '8px' }} />

                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '0.025em' }}>Connect to Maverick</h1>
                <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '32px', textAlign: 'center' }}>
                    Enter the Maverick Relay Server connection details below.
                </p>

                <form onSubmit={handleConnect} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label htmlFor="host" style={{ fontSize: '14px', fontWeight: 500, color: '#e4e4e7' }}>Host / IP</label>
                        <input
                            id="host"
                            type="text"
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            placeholder="e.g. 192.168.1.100"
                            style={{ padding: '10px 14px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label htmlFor="port" style={{ fontSize: '14px', fontWeight: 500, color: '#e4e4e7' }}>Port</label>
                        <input
                            id="port"
                            type="text"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="8188"
                            style={{ padding: '10px 14px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isConnecting}
                        style={{
                            marginTop: '16px', padding: '12px', backgroundColor: '#10b981', color: '#042f2e', border: 'none',
                            borderRadius: '6px', fontSize: '15px', fontWeight: 600, cursor: isConnecting ? 'not-allowed' : 'pointer',
                            opacity: isConnecting ? 0.7 : 1, transition: 'all 0.2s'
                        }}
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                </form>
            </div>
        </div>
    )
}
