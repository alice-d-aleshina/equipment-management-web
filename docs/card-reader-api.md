# Card Reader API Documentation

## Overview

The Card Reader API provides a unified interface for connecting to and managing an Arduino-based RFID card reader. The API acts as a bridge between the Next.js application and the external `arduino-card-reader` server running on port 3001.

## Architecture

```
Next.js App → Card Reader API Routes → CardReaderClient → Arduino Server (port 3001) → Arduino Hardware
```

### Components

1. **CardReaderClient** (`lib/services/card-reader-client.js`) - HTTP client for communicating with the Arduino server
2. **API Routes** (`app/api/card-reader/`) - Next.js API endpoints that expose card reader functionality
3. **Arduino Server** (`arduino-card-reader.js`) - External Node.js server that manages the physical Arduino connection
4. **UI Components** (`client/components/CardReaderMonitor.jsx`) - React components for monitoring and controlling the card reader

## Configuration

The Arduino server connection is configured in `lib/config/arduino-config.js`:

```javascript
export const ARDUINO_CONFIG = {
  SERVER_URL: 'http://localhost:3001',
  TIMEOUT: 5000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  DEFAULT_PORT: '/dev/cu.usbserial-1420',
  SERVER_PORT: 3001
};
```

You can override these settings using environment variables:
- `ARDUINO_SERVER_URL` or `NEXT_PUBLIC_ARDUINO_SERVER_URL`
- `ARDUINO_TIMEOUT`
- `ARDUINO_RETRY_COUNT`
- `ARDUINO_RETRY_DELAY`
- `ARDUINO_DEFAULT_PORT`
- `ARDUINO_SERVER_PORT`

## API Endpoints

### GET /api/card-reader/status
Get the current status of the card reader.

**Response:**
```json
{
  "connected": true,
  "status": "Connected to /dev/cu.usbserial-1420",
  "cardPresent": false,
  "cardId": "",
  "cardType": "",
  "uptime": 120
}
```

### POST /api/card-reader/connect
Connect to the card reader on a specific port.

**Request:**
```json
{
  "port": "/dev/cu.usbserial-1420"
}
```

**Response:**
```json
{
  "connected": true,
  "status": "Connected to /dev/cu.usbserial-1420"
}
```

### POST /api/card-reader/disconnect
Disconnect from the card reader.

**Response:**
```json
{
  "connected": false,
  "status": "Disconnected"
}
```

### POST /api/card-reader/reset
Reset the card reader.

**Response:**
```json
{
  "success": true,
  "status": "Reset complete"
}
```

### GET /api/card-reader/read-card
Read card data if a card is present.

**Response:**
```json
{
  "cardPresent": true,
  "cardId": "A6860588",
  "cardType": "MIFARE 1K Standard",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/card-reader/ports
Get a list of available serial ports.

**Response:**
```json
[
  {
    "path": "/dev/cu.usbserial-1420",
    "manufacturer": "Silicon Labs",
    "serialNumber": "DN05LYKYA",
    "vendorId": "10C4",
    "productId": "EA60"
  }
]
```

### POST /api/card-reader/simulate-scan
Simulate a card scan for testing purposes.

**Request:**
```json
{
  "cardId": "A6860588"
}
```

**Response:**
```json
{
  "success": true,
  "cardId": "A6860588",
  "cardType": "MIFARE 1K Standard",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "simulated": true,
  "serverAvailable": true
}
```

### POST /api/card-reader/request-uid
Request the UID of a card currently on the reader.

**Response:**
```json
{
  "success": true,
  "cardId": "A6860588",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Fallback Mode

When the Arduino server is not available, the API automatically switches to fallback mode:

- Returns mock data for status and ports
- Allows local simulation of card scans
- Provides clear error messages indicating server unavailability
- Headers include `X-Arduino-Server-Status: unavailable` and `X-Fallback-Mode: true`

## Error Handling

The API provides comprehensive error handling:

- **503 Service Unavailable**: Arduino server is not running
- **400 Bad Request**: Missing required parameters
- **500 Internal Server Error**: Unexpected errors

Error responses include detailed error messages and context information.

## Usage Examples

### Starting the Arduino Server

First, start the external Arduino server:

```bash
node arduino-card-reader.js /dev/cu.usbserial-1420
```

### Using the API from JavaScript

```javascript
// Check status
const status = await fetch('/api/card-reader/status').then(r => r.json());

// Connect to a port
await fetch('/api/card-reader/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ port: '/dev/cu.usbserial-1420' })
});

// Poll for card reads
const pollForCard = async () => {
  const response = await fetch('/api/card-reader/read-card');
  const data = await response.json();
  
  if (data.cardPresent) {
    console.log('Card detected:', data.cardId, data.cardType);
  }
};

// Simulate a card scan
await fetch('/api/card-reader/simulate-scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cardId: 'A6860588' })
});
```

### Using the UI Component

```jsx
import CardReaderMonitor from '@/client/components/CardReaderMonitor';

function MyPage() {
  return (
    <div>
      <h1>Card Reader Management</h1>
      <CardReaderMonitor />
    </div>
  );
}
```

## WebSocket Support

The Arduino server also provides WebSocket support for real-time card scan events. Connect to `ws://localhost:3001` to receive:

- `card_scan` events when cards are detected
- `status_update` events for reader status changes
- `connection_status` events for connection state changes

## Troubleshooting

### Arduino Server Not Starting
- Check that the Arduino is connected to the specified port
- Ensure no other applications are using the serial port
- Verify the port path is correct for your system

### API Returns Fallback Data
- Ensure the Arduino server is running on port 3001
- Check network connectivity between Next.js app and Arduino server
- Verify the `ARDUINO_SERVER_URL` configuration

### Card Not Detected
- Ensure the Arduino is properly connected and powered
- Check that the RFID reader is working correctly
- Verify the card is compatible with the reader
- Use the simulate-scan endpoint to test the API without hardware

## Development

For development without Arduino hardware:

1. The API automatically provides fallback data when the Arduino server is unavailable
2. Use the simulate-scan endpoint to test card detection logic
3. The UI component shows whether it's running in hardware or simulation mode
4. All API endpoints work in both modes, providing appropriate responses 