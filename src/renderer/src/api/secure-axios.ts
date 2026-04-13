import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useConnectionStore } from '../stores/connectionStore'

// Client secret should be loaded from secure storage in production
// const CLIENT_SECRET = import.meta.env?.VITE_CLIENT_SECRET || 'dev-secret-key'
const API_KEY = import.meta.env?.VITE_MRS_API_KEY || ''

/*
async function generateHmacSha256(secret: string, payload: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload))
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}
*/

export const secureAxios: AxiosInstance = axios.create({
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor to sign all API calls
secureAxios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    /*
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = crypto.randomUUID()
    const body = config.data ? JSON.stringify(config.data) : ''
    */
    const method = config.method?.toUpperCase() || 'GET'
    const path = config.url || '/'

    // Create HMAC-SHA256 signature
    // const signaturePayload = `${method}:${path}:${timestamp}:${nonce}:${body}`

    // Dynamically set baseURL from connectionStore
    const { host, port } = useConnectionStore.getState()
    const normalizedHost = host.toLowerCase()
    const url = `http://${normalizedHost}:${port}`
    config.baseURL = url

    const paramsStr = config.params ? `?${new URLSearchParams(config.params).toString()}` : ''
    console.log(`[API Request] ${method} ${url}${path}${paramsStr}`)

    /* 
       Disabling signatures temporarily to match user's curl guide.
       If signatures are required, they need to include the query params in the payload.
    */
    // config.headers['X-Maverick-Signature'] = `sha256=${signature}`
    // config.headers['X-Maverick-Timestamp'] = timestamp
    // config.headers['X-Maverick-Nonce'] = nonce

    // Include the API key
    if (API_KEY) {
        config.headers['X-API-Key'] = API_KEY
    } else {
        console.warn('[API Warning] No API Key found in environment!')
    }

    return config
}, (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
})

// Response interceptor for error handling
secureAxios.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} from ${response.config.url}`)
        return response
    },
    (error) => {
        console.error('[API Response Error]:', error.response?.status, error.response?.data || error.message)
        return Promise.reject(error)
    }
)

export default secureAxios
