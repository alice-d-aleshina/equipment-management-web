import { NextResponse } from 'next/server';
import CardReaderClient from '../../../../lib/services/card-reader-client';
import { ARDUINO_CONFIG } from '../../../../lib/config/arduino-config';

// Get card reader client instance
function getCardReaderClient() {
  return new CardReaderClient({
    serverUrl: ARDUINO_CONFIG.SERVER_URL
  });
}

/**
 * POST /api/card-reader/connect
 * Connect to the card reader on a specific port
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { port } = data;
    
    if (!port) {
      return NextResponse.json(
        { error: 'Port is required' },
        { status: 400 }
      );
    }

    console.log(`Connecting to Arduino on port: ${port}`);
    
    const client = getCardReaderClient();
    
    // Check if Arduino server is available
    const isAvailable = await client.isServerAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { 
          error: `Arduino card reader server is not available at ${ARDUINO_CONFIG.SERVER_URL}. Please ensure the arduino-card-reader server is running on port ${ARDUINO_CONFIG.SERVER_PORT}.`,
          serverAvailable: false,
          serverUrl: ARDUINO_CONFIG.SERVER_URL
        },
        { status: 503 }
      );
    }
    
    // Connect to the specified port
    const result = await client.connect(port);
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: `Failed to connect: ${result.error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error connecting to card reader:', error);
    return NextResponse.json(
      { error: `Failed to connect to card reader: ${error.message}` },
      { status: 500 }
    );
  }
} 