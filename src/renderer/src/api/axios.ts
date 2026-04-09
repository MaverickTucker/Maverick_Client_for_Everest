import axios from 'axios'

// In a real app, this would be fetched from SecureStorage via IPC
const CLIENT_SECRET = 'maverick-secret-key'

export const mrsApi = axios.create({
    baseURL: 'http://localhost:8188',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
})

mrsApi.interceptors.request.use(async (config) => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = Math.random().toString(36).substring(7)
    const method = config.method?.toUpperCase() || 'GET'
    const path = config.url || '/'
    const body = config.data ? JSON.stringify(config.data) : ''

    const signaturePayload = `${method}:${path}:${timestamp}:${nonce}:${body}`

    // Simulating HMAC-SHA256 signature using the secret and payload
    const signature = `sha256=${CLIENT_SECRET}:${signaturePayload}`

    config.headers['X-Maverick-Signature'] = signature
    config.headers['X-Maverick-Timestamp'] = timestamp
    config.headers['X-Maverick-Nonce'] = nonce

    return config
})

mrsApi.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('MRS API Error:', error)
        return Promise.reject(error)
    }
)
