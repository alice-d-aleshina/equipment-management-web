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
 * GET /api/card-reader/ports
 * Get a list of available serial ports
 */
export async function GET(request) {
  try {
    const client = getCardReaderClient();
    
    // Check if Arduino server is available
    const isAvailable = await client.isServerAvailable();
    if (!isAvailable) {
      console.log('Arduino server unavailable, returning fallback ports');
      // Return fallback ports when server is unavailable
      const fallbackPorts = client._getDefaultPorts();
      return NextResponse.json(fallbackPorts, {
        headers: {
          'X-Arduino-Server-Status': 'unavailable',
          'X-Fallback-Mode': 'true'
        }
      });
    }
    
    // Get ports from Arduino server
    const result = await client.getPorts();
    
    if (result.success) {
      console.log('Successfully retrieved ports from Arduino server');
      return NextResponse.json(result.data);
    } else {
      // Return fallback data when getting ports fails
      console.log('Failed to get ports from Arduino server, using fallback');
      return NextResponse.json(result.data, {
        headers: {
          'X-Arduino-Server-Status': 'error',
          'X-Fallback-Mode': 'true'
        }
      });
    }
  } catch (error) {
    console.error('Error listing serial ports:', error);
    return NextResponse.json(
      { error: 'Failed to list serial ports' },
      { status: 500 }
    );
  }
} 