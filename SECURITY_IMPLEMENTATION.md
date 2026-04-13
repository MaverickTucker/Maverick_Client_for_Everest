# Maverick Client - Security Implementation

## Overview
Comprehensive security layers implemented across the Electron application following broadcast-grade protection standards.

## Security Layers Implemented

### 1. Anti-Debugging Protection
**File:** `src/main/security/anti-debug.ts`
- Detects debugger presence via process arguments
- Checks for `--inspect` and `--remote-debugging-port` flags
- Disabled in development mode for easier debugging
- Exits application if debugger detected in production

### 2. Secure Storage (DPAPI)
**File:** `src/main/security/secure-storage.ts`
- Uses Electron's `safeStorage` API (Windows DPAPI)
- Encrypts sensitive data at rest
- Stores encrypted values in electron-store
- Methods:
  - `encrypt(plaintext)` - Encrypts string to base64
  - `decrypt(ciphertext)` - Decrypts base64 to plaintext
  - `saveConfig(key, value)` - Stores encrypted config
  - `getConfig(key)` - Retrieves encrypted config

### 3. Integrity Verification
**File:** `src/main/security/integrity.ts`
- Verifies app integrity on startup
- Computes SHA-256 hashes of critical files
- Compares against signed manifest
- Disabled in development mode
- Exits if integrity check fails

### 4. Certificate Pinning
**File:** `src/main/security/certificate-pinning.ts`
- Pins TLS certificates for MRS connections
- Validates certificate hashes
- Prevents MITM attacks
- Whitelist of allowed hostnames
- Disabled in development mode

### 5. API Request Signing (HMAC-SHA256)
**File:** `src/renderer/src/api/secure-axios.ts`
- Signs all HTTP requests with HMAC-SHA256
- Includes timestamp and nonce for replay protection
- Headers added:
  - `X-Maverick-Signature` - HMAC signature
  - `X-Maverick-Timestamp` - Request timestamp
  - `X-Maverick-Nonce` - Unique request ID
- Automatic request/response interceptors

### 6. Secure WebSocket (JWT Auth)
**File:** `src/renderer/src/api/secure-socket.ts`
- Socket.io with JWT authentication
- Auto-reconnection with exponential backoff
- Validates channel IDs (alphanumeric + underscore)
- Handles auth errors gracefully
- Methods:
  - `initializeSecureSocket()` - Setup connection
  - `subscribeToChannel()` - Subscribe with validation
  - `unsubscribeFromChannel()` - Cleanup

### 7. Secure IPC Handlers
**File:** `src/main/ipc/secure-handlers.ts`
- Whitelist of allowed IPC channels
- Message validation and sanitization
- Input validation (key format, value length)
- Handlers:
  - `config:get` - Retrieve encrypted config
  - `config:set` - Store encrypted config
  - `hardware:button` - Hardware events
  - `playout:take` - Playout actions
  - `playout:out` - Playout cleanup

### 8. Security Context Hook
**File:** `src/renderer/src/hooks/useSecurity.ts`
- React hook for security state management
- Client-side secure storage wrapper
- Loads security config on mount
- Methods:
  - `loadSecurityConfig()` - Load from storage
  - `saveSecurityConfig()` - Save to storage

## Security Features

### Main Process Security
✅ Anti-debugging detection
✅ Integrity verification
✅ Certificate pinning
✅ Secure IPC validation
✅ Context isolation enabled
✅ Sandbox enabled
✅ Remote module disabled
✅ Node integration disabled

### Renderer Process Security
✅ HMAC-SHA256 request signing
✅ JWT token authentication
✅ Secure WebSocket connections
✅ Input validation
✅ Channel ID validation
✅ Secure storage access

### Network Security
✅ TLS 1.3 enforcement (production)
✅ Certificate pinning
✅ Request signing with timestamp/nonce
✅ JWT token rotation
✅ Replay attack prevention

## Configuration

### Environment Variables
```bash
VITE_CLIENT_SECRET=your-secret-key
NODE_ENV=production  # Enables all security checks
```

### Secure Storage Keys
- `api_key` - MRS API key
- `jwt_token` - Authentication token
- `mrs_host` - MRS server hostname
- `mrs_port` - MRS server port

## Usage Examples

### Secure API Calls
```typescript
import secureAxios from '@/api/secure-axios'

const response = await secureAxios.get('/api/shows')
// Automatically signed with HMAC-SHA256
```

### Secure WebSocket
```typescript
import { initializeSecureSocket, subscribeToChannel } from '@/api/secure-socket'

const socket = initializeSecureSocket()
subscribeToChannel('channel-1', (data) => {
  console.log('Channel event:', data)
})
```

### Secure Storage
```typescript
import { useSecurity } from '@/hooks/useSecurity'

const { saveSecurityConfig, loadSecurityConfig } = useSecurity()
await saveSecurityConfig('api_key', 'secret-key')
```

### Secure IPC
```typescript
// Main process
import { setupSecureIPC } from '@/ipc/secure-handlers'
setupSecureIPC()

// Renderer process
const config = await window.electron.ipcRenderer.invoke('config:get', 'api_key')
```

## Security Best Practices

### Do's ✅
- Always use secure storage for sensitive data
- Validate all IPC messages
- Use HTTPS/WSS in production
- Rotate JWT tokens regularly
- Sign all API requests
- Enable all security checks in production
- Use certificate pinning for critical connections

### Don'ts ❌
- Never store API keys in source code
- Never disable contextIsolation
- Never allow eval() or new Function()
- Never trust renderer process for security decisions
- Never use HTTP in production
- Never disable sandbox
- Never bundle dev tools in production

## Threat Mitigation

| Threat | Mitigation |
|--------|-----------|
| Reverse Engineering | Code obfuscation, native modules |
| Runtime Tampering | Integrity verification, anti-debug |
| MITM Attacks | TLS 1.3, certificate pinning |
| Replay Attacks | Timestamp + nonce in requests |
| Session Hijacking | JWT with short expiry (5 min) |
| Code Injection | Input validation, IPC whitelist |
| Credential Theft | DPAPI encryption, secure storage |
| Unauthorized Access | HMAC signing, API key validation |

## Monitoring & Logging

Security events are logged to console in development and to MRS in production:
- Debugger detection
- Integrity check failures
- Certificate pinning failures
- Invalid IPC messages
- Authentication errors
- Unauthorized channel access

## Future Enhancements

1. **Hardware Security Module (HSM)** - Store keys in HSM
2. **Code Signing** - Sign executables with EV certificate
3. **VMProtect Integration** - Advanced binary protection
4. **Behavioral Analysis** - Detect anomalous usage patterns
5. **Rate Limiting** - Prevent brute force attacks
6. **Audit Logging** - Immutable security event log

## References

- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)
- [Socket.io Security](https://socket.io/docs/v4/security/)
