#!/usr/bin/env node

/**
 * Test script for the Card Reader API
 * 
 * This script tests all the card reader API endpoints to ensure they're working correctly.
 * It can be run with or without the Arduino server running.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_CARD_ID = 'A6860588';
const TEST_PORT = '/dev/cu.usbserial-1420';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, data = null) {
  try {
    log(`\n🧪 Testing ${name}...`, 'blue');
    
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    log(`✅ ${name} - Status: ${response.status}`, 'green');
    
    // Check for Arduino server status in headers
    const serverStatus = response.headers['x-arduino-server-status'];
    if (serverStatus === 'unavailable') {
      log(`⚠️  Running in fallback mode (Arduino server not available)`, 'yellow');
    }
    
    // Log relevant response data
    if (response.data) {
      if (response.data.connected !== undefined) {
        log(`   Connected: ${response.data.connected}`);
      }
      if (response.data.status) {
        log(`   Status: ${response.data.status}`);
      }
      if (response.data.cardPresent !== undefined) {
        log(`   Card Present: ${response.data.cardPresent}`);
      }
      if (response.data.cardId) {
        log(`   Card ID: ${response.data.cardId}`);
      }
      if (response.data.length !== undefined) {
        log(`   Found ${response.data.length} ports`);
      }
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      log(`❌ ${name} - Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data.error || 'Unknown error'}`, 'red');
      
      // Some errors are expected (like 503 when Arduino server is down)
      if (error.response.status === 503) {
        log(`   This is expected when Arduino server is not running`, 'yellow');
        return { success: true, data: error.response.data, expected: true };
      }
    } else {
      log(`❌ ${name} - Network Error: ${error.message}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('🚀 Starting Card Reader API Tests', 'blue');
  log(`📍 API Base URL: ${API_BASE_URL}`, 'blue');
  
  const results = [];
  
  // Test 1: Get Status
  results.push(await testEndpoint(
    'Get Status',
    'GET',
    '/api/card-reader/status'
  ));
  
  // Test 2: Get Ports
  results.push(await testEndpoint(
    'Get Ports',
    'GET',
    '/api/card-reader/ports'
  ));
  
  // Test 3: Connect (this might fail if Arduino server is not running)
  results.push(await testEndpoint(
    'Connect to Port',
    'POST',
    '/api/card-reader/connect',
    { port: TEST_PORT }
  ));
  
  // Test 4: Read Card
  results.push(await testEndpoint(
    'Read Card',
    'GET',
    '/api/card-reader/read-card'
  ));
  
  // Test 5: Simulate Card Scan
  results.push(await testEndpoint(
    'Simulate Card Scan',
    'POST',
    '/api/card-reader/simulate-scan',
    { cardId: TEST_CARD_ID }
  ));
  
  // Test 6: Reset Reader
  results.push(await testEndpoint(
    'Reset Reader',
    'POST',
    '/api/card-reader/reset'
  ));
  
  // Test 7: Request UID
  results.push(await testEndpoint(
    'Request UID',
    'POST',
    '/api/card-reader/request-uid'
  ));
  
  // Test 8: Disconnect
  results.push(await testEndpoint(
    'Disconnect',
    'POST',
    '/api/card-reader/disconnect'
  ));
  
  // Summary
  log('\n📊 Test Summary', 'blue');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  if (successful === total) {
    log(`✅ All ${total} tests passed!`, 'green');
  } else {
    log(`⚠️  ${successful}/${total} tests passed`, 'yellow');
  }
  
  // Check if Arduino server is available
  const hasArduinoServer = results.some(r => 
    r.data && !r.data.serverAvailable === false && !r.expected
  );
  
  if (!hasArduinoServer) {
    log('\n💡 Tips:', 'yellow');
    log('   • Start the Arduino server: node arduino-card-reader.js', 'yellow');
    log('   • The API works in fallback mode without the Arduino server', 'yellow');
    log('   • Use simulate-scan endpoint for testing without hardware', 'yellow');
  }
}

// Run the tests
runTests().catch(error => {
  log(`💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
}); 