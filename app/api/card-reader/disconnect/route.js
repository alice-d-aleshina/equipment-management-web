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
 * POST /api/card-reader/disconnect
 * Disconnect from the card reader
 */
export async function POST(request) {
  try {
    const client = getCardReaderClient();
    
    // Check if Arduino server is available
    const isAvailable = await client.isServerAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { 
          error: 'Arduino card reader server is not available',
          serverAvailable: false
        },
        { status: 503 }
      );
    }
    
    // Disconnect from the card reader
    const result = await client.disconnect();
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: `Failed to disconnect: ${result.error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error disconnecting from card reader:', error);
    return NextResponse.json(
      { error: `Failed to disconnect from card reader: ${error.message}` },
      { status: 500 }
    );
  }
} 