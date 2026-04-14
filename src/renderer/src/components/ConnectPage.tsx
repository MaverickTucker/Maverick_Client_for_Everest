import { useState } from 'react'
import { useConnectionStore } from '../stores/connectionStore'
import logo from '../assets/logo.png'
import { LogoSpinner } from './LogoSpinner'

export function ConnectPage() {
    const { host: initialHost, port: initialPort, connect, isConnecting } = useConnectionStore()

    const [host, setHost] = useState(initialHost || '127.0.0.1')
    const [port, setPort] = useState(initialPort || '8188')

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault()
        await connect(host, port)
    }

    return (
        <div className="bg-glacier-texture" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', backgroundColor: 'var(--glacier-400)', color: 'var(--glacier-50)' }}>
            <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--glacier-800)', padding: '32px', borderRadius: '12px', border: '1px solid var(--glacier-700)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                <img
                    src={logo}
                    alt="Maverick Logo"
                    className="animate-spin animate-mint-glow"
                    style={{ width: '80px', height: '80px', marginBottom: '24px', borderRadius: '8px' }}
                />

                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '0.025em', textAlign: 'center' }}>CONNECT TO MRS</h1>
                <p style={{ color: 'var(--glacier-200)', fontSize: '14px', marginBottom: '32px', textAlign: 'center' }}>
                    Enter the Maverick Relay Server connection details below.
                </p>

                <form onSubmit={handleConnect} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label htmlFor="host" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--glacier-100)' }}>Host / IP</label>
                        <input
                            id="host"
                            type="text"
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            placeholder="e.g. 192.168.1.100"
                            style={{ padding: '10px 14px', backgroundColor: 'var(--glacier-900)', border: '1px solid var(--glacier-700)', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label htmlFor="port" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--glacier-100)' }}>Port</label>
                        <input
                            id="port"
                            type="text"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="8188"
                            style={{ padding: '10px 14px', backgroundColor: 'var(--glacier-900)', border: '1px solid var(--glacier-700)', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isConnecting}
                        style={{
                            marginTop: '16px', padding: '12px', backgroundColor: 'var(--mint-green)', color: 'var(--glacier-950)', border: 'none',
                            borderRadius: '6px', fontSize: '15px', fontWeight: 600, cursor: isConnecting ? 'not-allowed' : 'pointer',
                            opacity: isConnecting ? 0.7 : 1, transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        {isConnecting ? (
                            <>
                                <LogoSpinner size={18} />
                                Connecting...
                            </>
                        ) : 'Connect'}
                    </button>
                </form>
            </div>
        </div>
    )
}
