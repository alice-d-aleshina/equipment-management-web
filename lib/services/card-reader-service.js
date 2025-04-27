/**
 * Card Reader Service (Mock Version for Edge Functions)
 * 
 * This is a mock implementation of the CardReaderService that can be used in environments
 * where serialport is not available (Edge Functions, browser, etc.)
 */

// Import EventEmitter if available, or create a minimal implementation
let EventEmitter;
try {
  EventEmitter = require('events');
} catch (e) {
  // Simple EventEmitter implementation for environments where Node.js 'events' is not available
  class SimpleEventEmitter {
    constructor() {
      this.events = {};
    }
    
    on(event, listener) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
      return this;
    }
    
    emit(event, ...args) {
      if (this.events[event]) {
        this.events[event].forEach(listener => listener(...args));
      }
      return true;
    }
    
    removeListener(event, listener) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(l => l !== listener);
      }
      return this;
    }
  }
  
  EventEmitter = SimpleEventEmitter;
}

class CardReaderService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      baudRate: 9600,
      autoOpen: false,
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: Infinity,
      ...options
    };
    
    this.connected = false;
    this.lastStatus = "disconnected";
    this.lastCardId = null;
    this.lastCardType = null;
    this.startTime = Date.now();
    
    console.warn('Using mock CardReaderService - SerialPort functionality is not available in this environment');
  }
  
  async init() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        this.lastStatus = "ready";
        this.emit('connected');
        this.emit('status', { type: 'status', status: 'ready', message: 'Mock reader initialized' });
        resolve();
      }, 500);
    });
  }
  
  async close() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = false;
        this.lastStatus = "disconnected";
        this.emit('disconnected');
        resolve();
      }, 100);
    });
  }
  
  async sendCommand() {
    return Promise.resolve();
  }
  
  static async listPorts() {
    return [{ path: 'MOCK_PORT', manufacturer: 'Mock Manufacturer', productId: 'mock' }];
  }
  
  // Utility methods used by the API
  isConnected() {
    return this.connected;
  }
  
  getLastStatus() {
    return this.lastStatus;
  }
  
  isCardPresent() {
    return !!this.lastCardId;
  }
  
  getLastCardId() {
    return this.lastCardId;
  }
  
  getLastCardType() {
    return this.lastCardType;
  }
  
  getUptime() {
    return Date.now() - this.startTime;
  }
  
  // Simulate a card scan (for testing)
  simulateCardScan(cardId, cardType = 'mifare') {
    this.lastCardId = cardId;
    this.lastCardType = cardType;
    
    const cardData = {
      type: 'card',
      card_id: cardId,
      card_type: cardType,
      timestamp: new Date().toISOString()
    };
    
    this.emit('card', cardData);
    return cardData;
  }
}

module.exports = CardReaderService; 