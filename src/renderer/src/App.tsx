import { Toaster } from 'sonner'
import { Layout } from './components/Layout'
import { ConnectPage } from './components/ConnectPage'
import { useConnectionStore } from './stores/connectionStore'

function App() {
    const { isConnected } = useConnectionStore()

    return (
        <>
            {isConnected ? <Layout /> : <ConnectPage />}
            <Toaster position="bottom-right" theme="dark" />
        </>
    )
}

export default App
