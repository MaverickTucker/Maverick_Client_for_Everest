import { safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store()

export class SecureStorage {
    static encrypt(plaintext: string): string {
        if (!safeStorage.isEncryptionAvailable()) {
            throw new Error('Encryption not available')
        }
        const buffer = safeStorage.encryptString(plaintext)
        return buffer.toString('base64')
    }

    static decrypt(ciphertextBase64: string): string {
        const buffer = Buffer.from(ciphertextBase64, 'base64')
        return safeStorage.decryptString(buffer)
    }

    static saveConfig(key: string, value: string): void {
        const encrypted = this.encrypt(value)
        store.set(`secure.${key}`, encrypted)
    }

    static getConfig(key: string): string | undefined {
        const encrypted = store.get(`secure.${key}`) as string
        if (!encrypted) return undefined
        return this.decrypt(encrypted)
    }
}
