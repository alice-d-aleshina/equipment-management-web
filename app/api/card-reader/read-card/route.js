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
 * GET /api/card-reader/read-card
 * Read card data if a card is present
 */
export async function GET(request) {
  try {
    const client = getCardReaderClient();
    
    // Check if Arduino server is available
    const isAvailable = await client.isServerAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { 
          cardPresent: false,
          error: 'Arduino card reader server is not available',
          serverAvailable: false
        },
        { status: 200 } // Return 200 with error info for polling compatibility
      );
    }
    
    // Read card data
    const result = await client.readCard();
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      // Return fallback data when read fails
      return NextResponse.json({
        cardPresent: false,
        status: 'Read failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error reading card:', error);
    return NextResponse.json(
      { 
        cardPresent: false,
        error: `Failed to read card: ${error.message}` 
      },
      { status: 200 } // Return 200 for polling compatibility
    );
  }
} 