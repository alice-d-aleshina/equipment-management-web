#!/usr/bin/env node

/**
 * Card Reader Diagnostic Script
 * 
 * This script helps diagnose card reader connection issues and provides
 * recommendations for fixing common problems.
 */

const axios = require('axios');
const net = require('net');

// Configuration
const NEXT_JS_URL = process.env.NEXT_JS_URL || 'http://localhost:3000';
const ARDUINO_SERVER_URL = process.env.ARDUINO_SERVER_URL || 'http://localhost:3001';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function checkArduinoServer() {
  log('\n🔍 Checking Arduino Card Reader Server...', 'blue');
  
  try {
    // Check if port 3001 is open
    const portOpen = await checkPort('localhost', 3001);
    if (!portOpen) {
      log('❌ Port 3001 is not open', 'red');
      log('💡 Start the Arduino server: node arduino-card-reader.js', 'yellow');
      return false;
    }
    
    log('✅ Port 3001 is open', 'green');
    
    // Check if the Arduino server is responding
    const response = await axios.get(`${ARDUINO_SERVER_URL}/api/status`, { timeout: 5000 });
    
    if (response.status === 200) {
      log('✅ Arduino server is responding', 'green');
      log(`   Status: ${response.data.status}`, 'cyan');
      log(`   Connected: ${response.data.connected}`, 'cyan');
      return true;
    }
  } catch (error) {
    log('❌ Arduino server is not responding', 'red');
    if (error.code === 'ECONNREFUSED') {
      log('💡 The server process is not running', 'yellow');
    } else {
      log(`   Error: ${error.message}`, 'yellow');
    }
    return false;
  }
  
  return false;
}

async function checkNextJSAPI() {
  log('\n🔍 Checking Next.js Card Reader API...', 'blue');
  
  try {
    const response = await axios.get(`${NEXT_JS_URL}/api/card-reader/status`, { timeout: 5000 });
    
    if (response.status === 200) {
      log('✅ Next.js API is responding', 'green');
      
      // Check if it's in fallback mode
      const serverStatus = response.headers['x-arduino-server-status'];
      if (serverStatus === 'unavailable') {
        log('⚠️  API is running in fallback mode', 'yellow');
        log('💡 The Arduino server is not connected', 'yellow');
      } else {
        log('✅ API is connected to Arduino server', 'green');
      }
      
      log(`   Status: ${response.data.status}`, 'cyan');
      log(`   Connected: ${response.data.connected}`, 'cyan');
      return true;
    }
  } catch (error) {
    log('❌ Next.js API is not responding', 'red');
    log(`   Error: ${error.message}`, 'yellow');
    return false;
  }
  
  return false;
}

async function checkWebSocketConnection() {
  log('\n🔍 Checking WebSocket Connection...', 'blue');
  
  const wsUrl = ARDUINO_SERVER_URL.replace('http', 'ws');
  
  try {
    // Check if we can connect to the WebSocket endpoint
    const portOpen = await checkPort('localhost', 3001);
    if (!portOpen) {
      log('❌ WebSocket port is not open', 'red');
      return false;
    }
    
    log('✅ WebSocket port is accessible', 'green');
    log(`   URL: ${wsUrl}`, 'cyan');
    log('💡 Try connecting from the UI to test real-time events', 'yellow');
    return true;
  } catch (error) {
    log('❌ WebSocket connection failed', 'red');
    log(`   Error: ${error.message}`, 'yellow');
    return false;
  }
}

async function testSimulation() {
  log('\n🔍 Testing Card Simulation...', 'blue');
  
  try {
    const testCardId = 'A6860588';
    const response = await axios.post(`${NEXT_JS_URL}/api/card-reader/simulate-scan`, {
      cardId: testCardId
    }, { timeout: 5000 });
    
    if (response.status === 200 && response.data.success) {
      log('✅ Card simulation is working', 'green');
      log(`   Card ID: ${response.data.cardId}`, 'cyan');
      log(`   Card Type: ${response.data.cardType}`, 'cyan');
      log(`   Server Available: ${response.data.serverAvailable ? 'Yes' : 'No'}`, 'cyan');
      return true;
    }
  } catch (error) {
    log('❌ Card simulation failed', 'red');
    log(`   Error: ${error.message}`, 'yellow');
    return false;
  }
  
  return false;
}

async function checkPorts() {
  log('\n🔍 Checking Available Serial Ports...', 'blue');
  
  try {
    const response = await axios.get(`${NEXT_JS_URL}/api/card-reader/ports`, { timeout: 5000 });
    
    if (response.status === 200 && response.data.length > 0) {
      log('✅ Serial ports are available', 'green');
      response.data.forEach((port, index) => {
        log(`   ${index + 1}. ${port.path} - ${port.manufacturer || 'Unknown'}`, 'cyan');
      });
      
      // Check if it's fallback data
      const fallbackMode = response.headers['x-fallback-mode'];
      if (fallbackMode === 'true') {
        log('⚠️  Using fallback port data', 'yellow');
      }
      
      return true;
    } else {
      log('⚠️  No serial ports found', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Failed to get serial ports', 'red');
    log(`   Error: ${error.message}`, 'yellow');
    return false;
  }
}

async function runDiagnostics() {
  log('🚀 Starting Card Reader Diagnostics', 'blue');
  log('====================================', 'blue');
  
  const results = [];
  
  // Test Arduino server
  results.push({
    name: 'Arduino Server',
    success: await checkArduinoServer()
  });
  
  // Test Next.js API
  results.push({
    name: 'Next.js API',
    success: await checkNextJSAPI()
  });
  
  // Test WebSocket
  results.push({
    name: 'WebSocket Connection',
    success: await checkWebSocketConnection()
  });
  
  // Test simulation
  results.push({
    name: 'Card Simulation',
    success: await testSimulation()
  });
  
  // Test ports
  results.push({
    name: 'Serial Ports',
    success: await checkPorts()
  });
  
  // Summary
  log('\n📊 Diagnostic Summary', 'blue');
  log('===================', 'blue');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${icon} ${result.name}`, color);
  });
  
  log(`\n📈 Overall: ${successful}/${total} checks passed`, successful === total ? 'green' : 'yellow');
  
  // Recommendations
  log('\n💡 Recommendations:', 'blue');
  log('==================', 'blue');
  
  const arduinoServerWorking = results.find(r => r.name === 'Arduino Server')?.success;
  const nextjsWorking = results.find(r => r.name === 'Next.js API')?.success;
  
  if (!arduinoServerWorking) {
    log('• Start the Arduino server: node arduino-card-reader.js [port]', 'yellow');
    log('• Make sure Arduino is connected to the correct serial port', 'yellow');
    log('• Check that no other applications are using the serial port', 'yellow');
  }
  
  if (!nextjsWorking) {
    log('• Start the Next.js development server: npm run dev', 'yellow');
    log('• Check that the server is running on http://localhost:3000', 'yellow');
  }
  
  if (nextjsWorking && !arduinoServerWorking) {
    log('• The system will work in simulation mode without Arduino hardware', 'yellow');
    log('• Use the simulate-scan endpoint for testing', 'yellow');
  }
  
  if (successful === total) {
    log('🎉 All systems are working correctly!', 'green');
    log('• The card reader system is ready to use', 'green');
    log('• Try scanning a card or using the simulation feature', 'green');
  }
}

// Run diagnostics
runDiagnostics().catch(error => {
  log(`💥 Diagnostic script failed: ${error.message}`, 'red');
  process.exit(1);
}); 