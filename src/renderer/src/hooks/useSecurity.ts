import { useEffect, useState } from 'react'


export interface SecurityContext {
    isSecure: boolean
    apiKey: string | null
    jwtToken: string | null
    loadSecurityConfig: () => Promise<void>
    saveSecurityConfig: (key: string, value: string) => Promise<void>
}

// Client-side secure storage wrapper
export const LocalSecureStorage = {
    getItem: (key: string): string | null => {
        try {
            const encrypted = localStorage.getItem(`secure_${key}`)
            if (!encrypted) return null
            // In production, this would decrypt using the main process
            return encrypted
        } catch (error) {
            console.error('Failed to get secure item:', error)
            return null
        }
    },

    setItem: (key: string, value: string): void => {
        try {
            // In production, this would encrypt using the main process
            localStorage.setItem(`secure_${key}`, value)
        } catch (error) {
            console.error('Failed to set secure item:', error)
        }
    },

    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(`secure_${key}`)
        } catch (error) {
            console.error('Failed to remove secure item:', error)
        }
    }
}

export function useSecurity(): SecurityContext {
    const [isSecure, setIsSecure] = useState(false)
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [jwtToken, setJwtToken] = useState<string | null>(null)

    const loadSecurityConfig = async () => {
        try {
            const key = LocalSecureStorage.getItem('api_key')
            const token = LocalSecureStorage.getItem('jwt_token')

            setApiKey(key)
            setJwtToken(token)
            setIsSecure(true)
        } catch (error) {
            console.error('Failed to load security config:', error)
            setIsSecure(false)
        }
    }

    const saveSecurityConfig = async (key: string, value: string) => {
        try {
            LocalSecureStorage.setItem(key, value)

            if (key === 'api_key') {
                setApiKey(value)
            } else if (key === 'jwt_token') {
                setJwtToken(value)
            }
        } catch (error) {
            console.error('Failed to save security config:', error)
            throw error
        }
    }

    useEffect(() => {
        loadSecurityConfig()
    }, [])

    return {
        isSecure,
        apiKey,
        jwtToken,
        loadSecurityConfig,
        saveSecurityConfig
    }
}
