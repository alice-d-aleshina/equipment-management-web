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
 * POST /api/card-reader/reset
 * Reset the card reader
 * 
 * NOTE: This is a simulation for development - in production, you would
 * need to run this on a server with access to SerialPort functionality.
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
    
    // Reset the card reader
    const result = await client.reset();
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: `Failed to reset: ${result.error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error resetting card reader:', error);
    return NextResponse.json(
      { error: `Failed to reset card reader: ${error.message}` },
      { status: 500 }
    );
  }
} 