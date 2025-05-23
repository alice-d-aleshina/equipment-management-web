#!/usr/bin/env node

/**
 * Test Card Binding Fix
 * 
 * This script tests that card binding works correctly after the fix.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

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

async function testCardBindingFix() {
  log('🧪 Testing Card Binding Fix', 'blue');
  log('============================', 'blue');
  
  try {
    // Step 1: Get users without cards
    log('\n📋 Step 1: Finding users without cards...', 'blue');
    const usersResponse = await axios.get(`${API_BASE_URL}/api/users`);
    const users = usersResponse.data;
    
    const usersWithoutCards = users.filter(user => !user.card_id);
    
    if (usersWithoutCards.length < 2) {
      log('❌ Need at least 2 users without cards for testing', 'red');
      log('Current users without cards:', 'yellow');
      usersWithoutCards.forEach(user => {
        log(`  - ${user.name} (ID: ${user.id})`, 'yellow');
      });
      return;
    }
    
    log('Users available for testing:', 'cyan');
    usersWithoutCards.slice(0, 2).forEach(user => {
      log(`  - ${user.name} (ID: ${user.id})`, 'green');
    });
    
    // Step 2: Bind first card
    const testUser1 = usersWithoutCards[0];
    const testCard1 = `FIX_TEST_${Date.now()}_1`;
    
    log(`\n🔗 Step 2: Binding first card...`, 'blue');
    log(`   User: ${testUser1.name} (ID: ${testUser1.id})`, 'cyan');
    log(`   Card: ${testCard1}`, 'cyan');
    
    const bind1Response = await axios.post(`${API_BASE_URL}/api/users/${testUser1.id}?action=bindCard`, {
      cardId: testCard1
    });
    
    if (bind1Response.status === 200) {
      log(`✅ First card bound successfully!`, 'green');
    } else {
      log(`❌ First card binding failed: ${bind1Response.status}`, 'red');
      return;
    }
    
    // Step 3: Bind second card (different card, different user)
    const testUser2 = usersWithoutCards[1];
    const testCard2 = `FIX_TEST_${Date.now()}_2`;
    
    log(`\n🔗 Step 3: Binding second card...`, 'blue');
    log(`   User: ${testUser2.name} (ID: ${testUser2.id})`, 'cyan');
    log(`   Card: ${testCard2}`, 'cyan');
    
    const bind2Response = await axios.post(`${API_BASE_URL}/api/users/${testUser2.id}?action=bindCard`, {
      cardId: testCard2
    });
    
    if (bind2Response.status === 200) {
      log(`✅ Second card bound successfully!`, 'green');
      log(`   This shows the fix is working!`, 'green');
    } else {
      log(`❌ Second card binding failed: ${bind2Response.status}`, 'red');
      log(`   Error: ${JSON.stringify(bind2Response.data, null, 2)}`, 'red');
      return;
    }
    
    // Step 4: Verify both cards are bound correctly
    log(`\n🔍 Step 4: Verifying card bindings...`, 'blue');
    
    const verifyResponse = await axios.get(`${API_BASE_URL}/api/users`);
    const updatedUsers = verifyResponse.data;
    
    const user1Updated = updatedUsers.find(u => u.id === testUser1.id);
    const user2Updated = updatedUsers.find(u => u.id === testUser2.id);
    
    if (user1Updated.card_id === testCard1) {
      log(`✅ User 1 card verified: ${user1Updated.name} -> ${user1Updated.card_id}`, 'green');
    } else {
      log(`❌ User 1 card mismatch: expected ${testCard1}, got ${user1Updated.card_id}`, 'red');
    }
    
    if (user2Updated.card_id === testCard2) {
      log(`✅ User 2 card verified: ${user2Updated.name} -> ${user2Updated.card_id}`, 'green');
    } else {
      log(`❌ User 2 card mismatch: expected ${testCard2}, got ${user2Updated.card_id}`, 'red');
    }
    
    // Step 5: Test duplicate card binding (should still fail)
    log(`\n🚫 Step 5: Testing duplicate card protection...`, 'blue');
    log(`   Trying to bind ${testCard1} to ${testUser2.name}`, 'cyan');
    
    try {
      const duplicateResponse = await axios.post(`${API_BASE_URL}/api/users/${testUser2.id}?action=bindCard`, {
        cardId: testCard1
      });
      
      log(`❌ Duplicate binding should have failed but didn't`, 'red');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log(`✅ Correctly prevented duplicate binding`, 'green');
        log(`   Error: ${error.response.data.error}`, 'cyan');
      } else {
        log(`❌ Unexpected error: ${error.message}`, 'red');
      }
    }
    
    // Step 6: Clean up
    log(`\n🧹 Step 6: Cleaning up test data...`, 'blue');
    
    try {
      await axios.post(`${API_BASE_URL}/api/users/${testUser1.id}?action=bindCard`, {
        cardId: null
      });
      
      await axios.post(`${API_BASE_URL}/api/users/${testUser2.id}?action=bindCard`, {
        cardId: null
      });
      
      log(`✅ Test data cleaned up`, 'green');
    } catch (error) {
      log(`⚠️  Could not clean up test data: ${error.message}`, 'yellow');
    }
    
    log('\n🎉 Card binding fix test completed successfully!', 'green');
    log('✨ Multiple cards can now be bound to different users without conflicts!', 'green');
    
  } catch (error) {
    log(`💥 Test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

// Run the test
testCardBindingFix().catch(error => {
  log(`💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
}); 