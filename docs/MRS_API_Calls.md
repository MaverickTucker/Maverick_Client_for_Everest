# Maverick Relay Server (MRS) - Master API Reference

This is the definitive guide to the Maverick Relay Server API. All endpoints are nativesly exposed at `https://localhost:8188` (HTTPS required). 

> [!IMPORTANT]
> **Authentication Required**: All `/api/*` requests must include the `X-API-Key` header.
> **WebSocket Auth**: Connections to `/ws` must include the `api_key` query parameter.

Interactive documentation is available at `https://localhost:8188/docs`.

---

## 🗄️ 1. Database Schema
| Table | Key Properties | Description |
|-------|----------------|-------------|
| **Shows** | `id`, `name`, `profile_id` | Master organizational wrapper. |
| **Templates** | `id`, `show_id`, `schema`, `scene_info` | Engine-agnostic structural definitions. |
| **Elements** | `id`, `show_id`, `data (JSONB)`| Saved graphic pages with unique values. |
| **Profiles** | `id`, `name` | Control room groupings (e.g., "News", "Sports"). |
| **Channels** | `id`, `profile_id`, `name` | Playout destinations (PGM, PVW). |
| **Engines** | `id`, `host`, `port`, `status` | Physical Maverick Render nodes. |
| **ElementGroups** | `id`, `show_id`, `name` | Logical folders for grouping Elements. |

---

## 📂 2. Structural Hierarchy (Graphic Management)

### 🎭 Shows
- **Create**: `POST /api/shows`
- **List**: `GET /api/shows`
- **Get/Update/Delete**: `GET|PUT|DELETE /api/shows/{id}`

#### 📽️ Templates
Engine-agnostic structural definitions.
- **Import Scene**: `POST /api/shows/{id}/templates/scene-importv1?name={name}&path={path}`
- **List (Filtered)**: `GET /api/templates?show_id={id}`
- **Read (Preview)**: `POST /api/shows/{id}/templates/{id}/read?channel_id={ch_id}`
- **Delete Template**: `DELETE /api/shows/{id}/templates/{id}`
- **Get Scene Info**: `GET /api/templates/{id}/scene-info` (Metadata Discovery)
- **Routed Take (Template)**: `POST /api/shows/{id}/templates/{id}/take?channel_id={ch_id}&layer=2`
- **Get/Update/Delete**: `GET|PUT|DELETE /api/templates/{id}`

### 🧱 Elements (Pages)
- **Create**: `POST /api/elements`
- **List (Filtered)**: `GET /api/elements?show_id={id}`
- **Get/Update/Delete/Patch**: `GET|PUT|DELETE|PATCH /api/elements/{id}`
- **Duplicate (Save As)**: `POST /api/elements/{id}/duplicate`
- **Read (Preview)**: `POST /api/shows/{id}/elements/{id}/read?channel_id={ch_id}`
- **Delete Element**: `DELETE /api/shows/{id}/elements/{id}`

### 📦 ElementGroups
- **Create**: `POST /api/element-groups`
- **List (Filtered)**: `GET /api/element-groups?show_id={id}`
- **Get/Update/Delete**: `GET|PUT|DELETE /api/element-groups/{id}`
- **Add Element**: `POST /api/element-groups/{id}/elements/{element_id}`
- **Remove Element**: `DELETE /api/element-groups/{id}/elements/{element_id}`
- **Duplicate Group**: `POST /api/element-groups/{id}/duplicate?new_name={name}`

---

## 🏗️ 3. Infrastructure & Routing

### 👤 Profiles
- **Create/List**: `POST|GET /api/profiles`
- **Get/Update/Delete**: `GET|PUT|DELETE /api/profiles/{id}`

### 📺 Channels
- **Create/List**: `POST|GET /api/channels?profile_id={id}`
- **Get/Update/Delete**: `GET|PUT|DELETE /api/channels/{id}`
- **Update Role**: `PATCH /api/channels/{id}/role?role={PGM|PVW|NONE}` (Playout assignment)
- **List Mapped Engines**: `GET /api/channels/{id}/engines`
- **Add/Remove Engine**: `POST|DELETE /api/channels/{id}/engines/{engine_id}`

### 🚀 Engines
- **Create/List**: `POST|GET /api/engines`
- **Get/Update/Delete**: `GET|PUT|DELETE /api/engines/{id}`

---

## 🎮 4. Playout Actions (The Controller)

### 🕹️ Routed Playout (Multi-Engine)
These endpoints resolve target hardware based on the provided routing parameters.

| Action | Logic | Endpoint Example |
|--------|-------|------------------|
| **TAKE** | Atomic Sync & Load | `POST .../take?channel_id={ch_id}` |
| **OUT** | Resolve & Clear | `POST .../out?engine_id={eng_id}` |
| **READ** | Load to PVW | `POST .../read?profile_id={prof_id}` |
| **CONTINUE** | Timeline Step | `POST .../continue` |

- **Routed Take (by Channel & Layer)**: 
  `curl -X POST "http://localhost:8188/api/shows/{show_id}/elements/{el_id}/take?channel_id={ch_id}&layer=2"`
- **Direct Engine Take (Layer 1)**: 
  `curl -X POST "http://localhost:8188/api/shows/{show_id}/elements/{el_id}/take?engine_id={eng_id}&layer=1"`
- **Default Profile Take**: 
  `curl -X POST "http://localhost:8188/api/shows/{show_id}/elements/{el_id}/take"`
- **Playout Actions**: `take`, `out`, `read`, `continue`, `continue_reverse`, `update`

---

## 📡 5. Layer-Level Broadcast Control
Directly control physical hardware layers.

### 🎥 Scene & Stage
- **Load Scene**: `POST /api/layer/{id}/scene/load?path={p}`
- **Single Scene Load**: `POST /api/layer/{id}/single-scene/load?path={p}`
- **Unload Scene**: `DELETE /api/layer/{id}/scene`
- **Stage Control**: `POST /api/layer/{id}/stage?command={START|STOP|RESET_ALL}`
- **Save Scene**: `POST /api/layer/{id}/scene/save`

### 🔍 Discovery & Interactive Setup
- **Ping Engine**: `GET /api/layer/{id}/ping` -> Returns "HELLO"
- **Interactive Discover**: `GET /api/layer/{id}/discover-tags` (Returns structured JSON)
- **Hardware Fetch**: `GET /api/layer/{id}/global/template` (Raw Everest string)

### ⏱️ Director & Timeline
- **Control Director**: `POST /api/layer/{id}/director/{dir}/action?action={val}`
- **Seek Director**: `PUT /api/layer/{id}/director/{dir}?time={float}`
- **Get Duration**: `GET /api/layer/{id}/director/{dir}/duration`

---

### 🧪 Quick Playout API (Name-Based)
Convenience endpoints for rapid manual control using element/template names instead of IDs.
- **Element Take**: `POST /api/quick/take/{name}?layer=1`
- **Element Read**: `POST /api/quick/read/{name}?layer=1`
- **Element Out**: `POST /api/quick/out/{name}?layer=1`
- **Template Take**: `POST /api/quick/template/take/{name}?layer=1`
- **Template Read**: `POST /api/quick/template/read/{name}?layer=1`
- **Template Out**: `POST /api/quick/template/out/{name}?layer=1`

### 🧹 Global Control
- **Cleanup All**: `POST /api/cleanup_All` (Throttled 6-layer engine reset)

---

## 📈 7. Monitoring & Health
- **Engine Status**: `GET /api/engines` (Includes `current_scene` JSON mapping for layers 1-6)
- **Engine Real-time WS**: `WS /api/ws/engines` (Pushes `INITIAL_STATE` and `STATUS_CHANGE` events)
- **Prometheus Metrics**: `GET /metrics` (Includes `mrs_playout_latency_seconds`)

---

## 📜 8. As-Run Logging
Audit trail for every playout action triggered for hardware.

### 📝 Logs
- **List All Logs**: `GET /api/as-run-logs`
- **Filter by Show**: `GET /api/as-run-logs?show_id={id}`

**Log Properties**:
* `timestamp`: Precise UTC execution time.
* `action`: TAKE, OUT, READ, etc.
* `element_id`: Source page instance.
* `pool`: Trigger origin (**TEMPLATES**, **ELEMENTS**, or **ELEMENTGROUP**).
* `engine_host`: Target hardware IP.
* `status`: DISPATCHED.
