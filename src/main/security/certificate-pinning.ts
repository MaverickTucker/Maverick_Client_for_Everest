import { session } from 'electron'
import { createHash } from 'crypto'

export class CertificatePinning {
    // In production, these would be loaded from a secure config
    private static readonly PINNED_HASHES = {
        'localhost': 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        'mrs.internal': 'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
    }

    static setupPinning(): void {
        // Only enforce in production
        if (process.env.NODE_ENV === 'development') {
            console.log('Certificate pinning disabled in development')
            return
        }

        const mainSession = session.defaultSession
        if (!mainSession) return

        mainSession.setCertificateVerifyProc((request, callback) => {
            const hostname = request.hostname

            // Allow localhost in development
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                callback(0)
                return
            }

            // Check if hostname is in pinned list
            const pinnedHash = this.PINNED_HASHES[hostname as keyof typeof this.PINNED_HASHES]
            if (!pinnedHash) {
                console.warn(`No pinned certificate for hostname: ${hostname}`)
                callback(-2) // Fatal error
                return
            }

            // Verify certificate hash
            if (this.verifyCertificate(request.certificate, pinnedHash)) {
                callback(0) // Valid
            } else {
                console.error(`Certificate pinning failed for ${hostname}`)
                callback(-2) // Fatal error
            }
        })
    }

    private static verifyCertificate(cert: any, expectedHash: string): boolean {
        try {
            if (!cert || !cert.data) return false

            // Compute SHA256 hash of certificate
            const certHash = createHash('sha256')
                .update(Buffer.from(cert.data, 'binary'))
                .digest('base64')

            const computedHash = `sha256/${certHash}`
            return computedHash === expectedHash
        } catch (error) {
            console.error('Certificate verification error:', error)
            return false
        }
    }
}
