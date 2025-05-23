/**
 * Arduino Card Reader Server Configuration
 */

export const ARDUINO_CONFIG = {
  // Default Arduino server URL
  SERVER_URL: process.env.ARDUINO_SERVER_URL || process.env.NEXT_PUBLIC_ARDUINO_SERVER_URL || 'http://localhost:3001',
  
  // Connection timeout
  TIMEOUT: parseInt(process.env.ARDUINO_TIMEOUT) || 5000,
  
  // Retry configuration
  RETRY_COUNT: parseInt(process.env.ARDUINO_RETRY_COUNT) || 3,
  RETRY_DELAY: parseInt(process.env.ARDUINO_RETRY_DELAY) || 1000,
  
  // Default port for Arduino
  DEFAULT_PORT: process.env.ARDUINO_DEFAULT_PORT || '/dev/cu.usbserial-1420',
  
  // Server port
  SERVER_PORT: parseInt(process.env.ARDUINO_SERVER_PORT) || 3001,
  
  // WebSocket configuration
  WEBSOCKET_URL: process.env.ARDUINO_WEBSOCKET_URL || process.env.NEXT_PUBLIC_ARDUINO_WEBSOCKET_URL || 'http://localhost:3001'
};

export default ARDUINO_CONFIG; 