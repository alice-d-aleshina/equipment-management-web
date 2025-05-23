import { NextResponse } from 'next/server';
import CardReaderClient from '../../../../lib/services/card-reader-client';
import { ARDUINO_CONFIG } from '../../../../lib/config/arduino-config';

// Get card reader client instance
function getCardReaderClient() {
  return new CardReaderClient({
    serverUrl: ARDUINO_CONFIG.SERVER_URL
  });
}

// Helper function to detect card type (copied from arduino-card-reader.js)
function detectCardType(cardId) {
  if (!cardId) return 'Unknown Card';
  
  cardId = cardId.toUpperCase();
  
  // Extended rules for determining card type
  if (cardId.startsWith('04')) return 'MIFARE 1K Student Card';
  if (cardId.startsWith('A6')) return 'MIFARE 1K Standard';
  if (cardId.startsWith('F1')) return 'MIFARE Faculty Card';
  if (cardId.startsWith('7B')) return 'MIFARE Guest Card';
  if (cardId.length === 8) return 'MIFARE 1K Standard';
  if (cardId.length === 14) return 'MIFARE Ultralight';
  if (cardId.length === 20) return 'MIFARE DESFire';
  
  return 'Unknown Card Type';
}

/**
 * POST /api/card-reader/simulate-scan
 * Simulate a card scan event
 * 
 * This endpoint is specifically for development and testing
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { cardId } = data;
    
    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    console.log(`Simulating card scan with ID: ${cardId}`);
    
    const client = getCardReaderClient();
    
    // Check if Arduino server is available
    const isAvailable = await client.isServerAvailable();
    if (!isAvailable) {
      // If Arduino server is not available, simulate locally
      console.log('Arduino server unavailable, simulating locally');
      const cardType = detectCardType(cardId);
      
      return NextResponse.json({
        success: true,
        cardId: cardId.toUpperCase(),
        cardType: cardType,
        timestamp: new Date().toISOString(),
        simulated: true,
        serverAvailable: false
      });
    }
    
    // Use Arduino server for simulation
    const result = await client.simulateScan(cardId);
    
    if (result.success) {
      return NextResponse.json({
        ...result.data,
        serverAvailable: true
      });
    } else {
      // Fallback to local simulation if server simulation fails
      const cardType = detectCardType(cardId);
      
      return NextResponse.json({
        success: true,
        cardId: cardId.toUpperCase(),
        cardType: cardType,
        timestamp: new Date().toISOString(),
        simulated: true,
        serverAvailable: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error simulating card scan:', error);
    return NextResponse.json(
      { error: `Failed to simulate card scan: ${error.message}` },
      { status: 500 }
    );
  }
} 