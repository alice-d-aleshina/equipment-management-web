import { NextResponse } from 'next/server';
import CardReaderClient from '../../../lib/services/card-reader-client';
import { ARDUINO_CONFIG } from '../../../lib/config/arduino-config';

// Singleton instance of the card reader client
let cardReaderClient;

// Initialize the card reader client
function getCardReaderClient() {
  if (!cardReaderClient) {
    cardReaderClient = new CardReaderClient({
      serverUrl: ARDUINO_CONFIG.SERVER_URL
    });
  }
  return cardReaderClient;
}

/**
 * GET /api/card-reader
 * Get the current status of the card reader
 */
export async function GET(request) {
  try {
    const client = getCardReaderClient();
    const result = await client.getStatus();
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      // Return fallback data when Arduino server is unavailable
      return NextResponse.json(result.data, { 
        status: 200,
        headers: {
          'X-Arduino-Server-Status': 'unavailable'
        }
      });
    }
  } catch (error) {
    console.error('Error getting card reader status:', error);
    return NextResponse.json(
      { error: 'Failed to get card reader status' },
      { status: 500 }
    );
  }
} 