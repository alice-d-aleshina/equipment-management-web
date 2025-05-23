/**
 * Arduino Card Reader Client
 * 
 * This service connects to the external arduino-card-reader server
 * running on port 3001 and provides a unified interface for the
 * Next.js API routes.
 */

import axios from 'axios';
import { ARDUINO_CONFIG } from '../config/arduino-config';

class CardReaderClient {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || ARDUINO_CONFIG.SERVER_URL;
    this.timeout = options.timeout || ARDUINO_CONFIG.TIMEOUT;
    this.retryCount = options.retryCount || ARDUINO_CONFIG.RETRY_COUNT;
    this.retryDelay = options.retryDelay || ARDUINO_CONFIG.RETRY_DELAY;
    
    // Configure axios instance
    this.api = axios.create({
      baseURL: this.serverUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`CardReaderClient initialized with server URL: ${this.serverUrl}`);
  }
  
  /**
   * Check if the Arduino server is available
   */
  async isServerAvailable() {
    try {
      const response = await this.api.get('/api/status');
      return response.status === 200;
    } catch (error) {
      console.error('Arduino server not available:', error.message);
      return false;
    }
  }
  
  /**
   * Get card reader status
   */
  async getStatus() {
    try {
      const response = await this.api.get('/api/status');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting status:', error.message);
      return {
        success: false,
        error: error.message,
        data: this._getDefaultStatus()
      };
    }
  }
  
  /**
   * Connect to a specific port
   */
  async connect(port) {
    try {
      const response = await this.api.post('/api/connect', { port });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error connecting:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Disconnect from the card reader
   */
  async disconnect() {
    try {
      const response = await this.api.post('/api/disconnect');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error disconnecting:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Reset the card reader
   */
  async reset() {
    try {
      const response = await this.api.post('/api/reset');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error resetting:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Read card (check if card is present)
   */
  async readCard() {
    try {
      const response = await this.api.get('/api/read-card');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error reading card:', error.message);
      return {
        success: false,
        error: error.message,
        data: { cardPresent: false }
      };
    }
  }
  
  /**
   * Get available serial ports
   */
  async getPorts() {
    try {
      const response = await this.api.get('/api/ports');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting ports:', error.message);
      return {
        success: false,
        error: error.message,
        data: this._getDefaultPorts()
      };
    }
  }
  
  /**
   * Simulate a card scan (for testing)
   */
  async simulateScan(cardId) {
    try {
      const response = await this.api.post('/api/simulate-scan', { cardId });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error simulating scan:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Request card UID
   */
  async requestUID() {
    try {
      const response = await this.api.post('/api/request-uid');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error requesting UID:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get default status when server is unavailable
   */
  _getDefaultStatus() {
    return {
      connected: false,
      status: 'Arduino server unavailable',
      cardPresent: false,
      cardId: '',
      cardType: '',
      uptime: 0
    };
  }
  
  /**
   * Get default ports when server is unavailable
   */
  _getDefaultPorts() {
    return [
      {
        path: ARDUINO_CONFIG.DEFAULT_PORT,
        manufacturer: 'Silicon Labs',
        serialNumber: 'DN05LYKYA',
        pnpId: 'usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller',
        locationId: 'Port_#0001.Hub_#0001',
        vendorId: '10C4',
        productId: 'EA60'
      }
    ];
  }
  
  /**
   * Retry a request with exponential backoff
   */
  async _retryRequest(requestFn, retries = this.retryCount) {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying request in ${this.retryDelay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this._retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }
}

export default CardReaderClient; 