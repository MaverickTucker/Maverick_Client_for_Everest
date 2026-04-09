import { Toaster } from 'sonner'

function App(): JSX.Element {
    return (
        <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                    Maverick Client <span className="text-zinc-500 font-light">| Everest</span>
                </h1>
                <p className="text-zinc-400">Broadcast Playout Controller</p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-zinc-800/50 border border-zinc-700/50 p-6 rounded-xl backdrop-blur-sm">
                    <h2 className="text-xl font-semibold mb-4 text-zinc-200">System Status</h2>
                    <div className="flex items-center gap-2 text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        Maverick Relay Server: Connected
                    </div>
                </div>

                <div className="bg-zinc-800/50 border border-zinc-700/50 p-6 rounded-xl backdrop-blur-sm">
                    <h2 className="text-xl font-semibold mb-4 text-zinc-200">Playout</h2>
                    <div className="space-y-4">
                        <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                            PVW: EMPTY
                        </button>
                        <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg active:scale-[0.98]">
                            TAKE
                        </button>
                    </div>
                </div>
            </main>

            <Toaster position="bottom-right" theme="dark" />
        </div>
    )
}

export default App
