# Maverick NDI Bridge (C++)

This directory contains the conceptual source for the C++ NDI Bridge. This bridge captures NDI streams and provides a WebSocket server for the Maverick Client.

## Prerequisites

- **NDI SDK**: [Download here](https://www.ndi.video/sdk/)
- **nlohmann/json**: For JSON handling.
- **cpp-httplib** or **uWebSockets**: For the WebSocket server.
- **OpenCV** (optional): For JPEG encoding if not using NDI's built-in conversion.

## Implementation Details

The bridge performs the following:
1. Scans the network for available NDI sources using `NDIlib_find_create_v2`.
2. Creates a `NDIlib_recv_create_v3` instance for the selected source.
3. Every ~66ms (15 FPS), it captures a frame using `NDIlib_recv_capture_v3`.
4. Converts the frame to BGR/RGB and encodes it as a JPEG buffer.
5. Broadcasts the JPEG buffer as a Base64 string via WebSockets.

## Proposed Code Structure

- `main.cpp`: Entry point, WebSocket server initialization.
- `NDIManager.cpp`: NDI discovery and capture logic.
- `WSHandler.cpp`: WebSocket message handling (`SELECT_SOURCE`, `PING`).
