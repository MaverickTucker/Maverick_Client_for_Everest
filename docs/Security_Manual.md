# 🔐 Maverick Relay Server (MRS) - Security Manual

This manual provides a comprehensive overview of the security architecture and procedures for the Maverick Relay Server.

---

## 1. Authentication Configuration

The MRS uses a **Pre-Shared Key (PSK)** authentication model, which enforces access control across all entry points.

### 🔑 The API Key
The master security key is defined in the [`.env`](file:///e:/Python_Projects/Maverick_Relay/.env) file:
`MRS_API_KEY=6f6e47c0fcd64123b1777d18bc5645a86529fee5d5a84e8dbd3216cd5f042fe7`

### 🛠️ Usage for Clients
All client applications (Web Controller, Automation Scripts) must provide this key:

#### REST API (FastAPI)
- **Header**: `X-API-Key`
- **Example**:
  ```bash
  curl -X GET "https://localhost:8188/api/shows" \
       -H "X-API-Key: 6f6e47c0fcd64123b1777d18bc5645a86529fee5d5a84e8dbd3216cd5f042fe7"
  ```

#### WebSocket (Core Service)
- **Query Parameter**: `api_key`
- **Example**:
  ```javascript
  const ws = new WebSocket("wss://localhost:8188/ws?api_key=6f6e47c0fcd64123b1777d18bc5645a86529fee5d5a84e8dbd3216cd5f042fe7");
  ```

### 🔓 Exempt Endpoints
The following endpoints are public and do not require authentication:
- `/health`: System health status for load balancers.
- `/api/version`: Current application version.
- `/docs`: Interactive Swagger documentation.
- `/metrics`: Prometheus monitoring data.

---

## 2. Transport & Proxy Security

Caddy serves as the secure gateway for all MRS traffic.

### 🔒 HTTPS Enforcement
Caddy is configured to listen on port `443` and redirection is handled for `8188`. It uses internal certificates by default but can be configured for production domains in the [`Caddyfile`](file:///e:/Python_Projects/Maverick_Relay/Caddyfile).

### 🛡️ Security Headers
The following headers are injected into every response to protect against common web vulnerabilities:
- `X-Content-Type-Options: nosniff` (Prevents MIME sniffing)
- `X-Frame-Options: DENY` (Prevents Clickjacking)
- `Content-Security-Policy`: Restricts resource loading to trusted sources.
- `Strict-Transport-Security`: Enforces HTTPS for the browser.

---

## 3. Infrastructure Isolation

The MRS uses Docker network isolation to project internal components.

### 🚧 Internal Services
The following services are **isolated** and cannot be reached from outside the host machine:
- **Database (PostgreSQL)**: Port 5432 is internal only.
- **Cache (Redis)**: Port 6379 is internal only.
- **Storage (Minio API)**: Port 9000 is internal only.

These services should only be accessed via the `mrs-api` or `mrs-core` containers.

---

## 4. Secret Management

All sensitive information is managed via the [`.env`](file:///e:/Python_Projects/Maverick_Relay/.env) file. **Never commit this file to version control.**

| Variable | Description |
|----------|-------------|
| `MRS_API_KEY` | The master key for API and WS access. |
| `POSTGRES_PASSWORD` | Password for the primary database. |
| `MINIO_ROOT_PASSWORD` | Root access password for file storage. |

---

## 5. Maintenance & Rotation

### 🔄 Rotating the API Key
If the key is compromised, follow these steps:
1. Update `MRS_API_KEY` in `.env`.
2. Apply changes:
   ```powershell
   docker-compose up -d --build
   ```

### 📋 As-Run Audit Logs
The system maintains an immutable audit trail of all playout actions triggered via hardware.
- **Endpoint**: `GET /api/as-run-logs`
- **Data**: Timestamp, Action (TAKE/OUT), Source Element, and Target Hardware IP.

---

> [!WARNING]
> Access to the physical host machine or the `.env` file grants full administrative control over the Maverick Relay Server. Ensure the host is secured with standard OS-level hardening.
