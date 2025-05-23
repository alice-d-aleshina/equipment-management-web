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
 * GET /api/card-reader/status
 * Get the status of the card reader
 * 
 * NOTE: This is a simulation for development - in production, you would
 * need to run this on a server with access to SerialPort functionality.
 */
export async function GET(request) {
  try {
    const client = getCardReaderClient();
    const result = await client.getStatus();
    
    if (result.success) {
      console.log('Card reader status:', result.data);
      return NextResponse.json(result.data);
    } else {
      // Return fallback data when Arduino server is unavailable
      console.log('Arduino server unavailable, returning fallback status');
      return NextResponse.json(result.data, { 
        status: 200,
        headers: {
          'X-Arduino-Server-Status': 'unavailable',
          'X-Fallback-Mode': 'true'
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