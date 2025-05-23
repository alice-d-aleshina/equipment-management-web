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
 * POST /api/card-reader/request-uid
 * Request card UID from the Arduino reader
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
    
    // Request UID from the card reader
    const result = await client.requestUID();
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: `Failed to request UID: ${result.error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error requesting card UID:', error);
    return NextResponse.json(
      { error: `Failed to request card UID: ${error.message}` },
      { status: 500 }
    );
  }
} 