#!/usr/bin/env node

/**
 * Card Binding Test Script
 * 
 * This script tests the card binding functionality specifically.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
// Use a timestamp-based unique card ID to avoid conflicts
const TEST_CARD_ID = `TEST${Date.now()}`;
const TEST_USER_ID = '2';

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

async function testCardBinding() {
  log('🧪 Testing Card Binding Functionality', 'blue');
  log('=====================================', 'blue');
  log(`🔧 Using unique test card ID: ${TEST_CARD_ID}`, 'cyan');
  
  try {
    // Step 1: Get user info before binding
    log('\n📋 Step 1: Getting user info before binding...', 'blue');
    const userResponse = await axios.get(`${API_BASE_URL}/api/users/${TEST_USER_ID}`);
    log(`✅ User found: ${userResponse.data.name}`, 'green');
    log(`   Current card ID: ${userResponse.data.card_id || 'None'}`, 'cyan');
    
    // Step 2: Test binding the card
    log('\n🔗 Step 2: Binding card to user...', 'blue');
    const bindResponse = await axios.post(`${API_BASE_URL}/api/users/${TEST_USER_ID}?action=bindCard`, {
      cardId: TEST_CARD_ID
    });
    
    if (bindResponse.status === 200) {
      log(`✅ Card binding successful!`, 'green');
      log(`   User: ${bindResponse.data.name}`, 'cyan');
      log(`   Card ID: ${bindResponse.data.card_id}`, 'cyan');
    } else {
      log(`❌ Unexpected response status: ${bindResponse.status}`, 'red');
    }
    
    // Step 3: Verify the binding by getting user info again
    log('\n🔍 Step 3: Verifying card binding...', 'blue');
    const verifyResponse = await axios.get(`${API_BASE_URL}/api/users/${TEST_USER_ID}`);
    
    if (verifyResponse.data.card_id === TEST_CARD_ID) {
      log(`✅ Card binding verified successfully!`, 'green');
      log(`   Card ID matches: ${verifyResponse.data.card_id}`, 'cyan');
    } else {
      log(`❌ Card binding verification failed`, 'red');
      log(`   Expected: ${TEST_CARD_ID}`, 'cyan');
      log(`   Got: ${verifyResponse.data.card_id}`, 'cyan');
    }
    
    // Step 4: Test duplicate binding (should handle gracefully)
    log('\n🔄 Step 4: Testing duplicate binding...', 'blue');
    const duplicateResponse = await axios.post(`${API_BASE_URL}/api/users/${TEST_USER_ID}?action=bindCard`, {
      cardId: TEST_CARD_ID
    });
    
    if (duplicateResponse.status === 200) {
      log(`✅ Duplicate binding handled gracefully`, 'green');
    } else {
      log(`❌ Duplicate binding failed: ${duplicateResponse.status}`, 'red');
    }
    
    // Step 5: Test binding to different user (should fail)
    log('\n⚠️  Step 5: Testing binding to different user (should fail)...', 'blue');
    try {
      const conflictResponse = await axios.post(`${API_BASE_URL}/api/users/1?action=bindCard`, {
        cardId: TEST_CARD_ID
      });
      log(`❌ Binding to different user should have failed but didn't`, 'red');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log(`✅ Correctly prevented binding to different user`, 'green');
        log(`   Error: ${error.response.data.error}`, 'cyan');
      } else {
        log(`❌ Unexpected error: ${error.message}`, 'red');
      }
    }
    
    // Step 6: Clean up - remove card binding for next test
    log('\n🧹 Step 6: Cleaning up (remove card binding)...', 'blue');
    try {
      await axios.post(`${API_BASE_URL}/api/users/${TEST_USER_ID}?action=bindCard`, {
        cardId: null
      });
      log(`✅ Card binding cleaned up`, 'green');
    } catch (error) {
      log(`⚠️  Could not clean up card binding: ${error.message}`, 'yellow');
    }
    
    log('\n🎉 Card binding tests completed successfully!', 'green');
    
  } catch (error) {
    log(`💥 Test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

// Run the test
testCardBinding().catch(error => {
  log(`💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
}); 