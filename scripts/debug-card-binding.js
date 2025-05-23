#!/usr/bin/env node

/**
 * Debug Card Binding Issues
 * 
 * This script helps debug why second card binding fails.
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

async function debugCardBinding() {
  log('🔍 Debugging Card Binding Issues', 'blue');
  log('==================================', 'blue');
  
  try {
    // Step 1: Get all users to see current card bindings
    log('\n📋 Step 1: Current card bindings...', 'blue');
    const usersResponse = await axios.get(`${API_BASE_URL}/api/users`);
    const users = usersResponse.data;
    
    log('Users with cards:', 'cyan');
    users.forEach(user => {
      if (user.card_id) {
        log(`  - ${user.name} (ID: ${user.id}) -> Card: ${user.card_id}`, 'green');
      }
    });
    
    log('\nUsers without cards:', 'cyan');
    const usersWithoutCards = users.filter(user => !user.card_id);
    usersWithoutCards.forEach(user => {
      log(`  - ${user.name} (ID: ${user.id}) -> No card`, 'yellow');
    });
    
    if (usersWithoutCards.length === 0) {
      log('❌ No users without cards found for testing', 'red');
      return;
    }
    
    // Step 2: Test binding a new card to first user without card
    const testUser = usersWithoutCards[0];
    const testCardId = `TEST${Date.now()}`;
    
    log(`\n🔗 Step 2: Testing card binding to ${testUser.name}...`, 'blue');
    log(`   User ID: ${testUser.id}`, 'cyan');
    log(`   Card ID: ${testCardId}`, 'cyan');
    
    try {
      const bindResponse = await axios.post(`${API_BASE_URL}/api/users/${testUser.id}?action=bindCard`, {
        cardId: testCardId
      });
      
      if (bindResponse.status === 200) {
        log(`✅ First card binding successful!`, 'green');
        log(`   Response: ${JSON.stringify(bindResponse.data, null, 2)}`, 'cyan');
      }
    } catch (error) {
      log(`❌ First card binding failed:`, 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      } else {
        log(`   Error: ${error.message}`, 'red');
      }
      return;
    }
    
    // Step 3: Test binding a different card to second user without card
    if (usersWithoutCards.length > 1) {
      const testUser2 = usersWithoutCards[1];
      const testCardId2 = `TEST${Date.now() + 1}`;
      
      log(`\n🔗 Step 3: Testing second card binding to ${testUser2.name}...`, 'blue');
      log(`   User ID: ${testUser2.id}`, 'cyan');
      log(`   Card ID: ${testCardId2}`, 'cyan');
      
      try {
        const bindResponse2 = await axios.post(`${API_BASE_URL}/api/users/${testUser2.id}?action=bindCard`, {
          cardId: testCardId2
        });
        
        if (bindResponse2.status === 200) {
          log(`✅ Second card binding successful!`, 'green');
          log(`   Response: ${JSON.stringify(bindResponse2.data, null, 2)}`, 'cyan');
        }
      } catch (error) {
        log(`❌ Second card binding failed:`, 'red');
        if (error.response) {
          log(`   Status: ${error.response.status}`, 'red');
          log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
        } else {
          log(`   Error: ${error.message}`, 'red');
        }
        
        // Additional debugging
        log('\n🔍 Additional debugging...', 'blue');
        log('   Checking database state...', 'cyan');
        
        // Check if the card ID exists in database
        const usersCheck = await axios.get(`${API_BASE_URL}/api/users`);
        const cardExists = usersCheck.data.find(u => u.card_id === testCardId2);
        if (cardExists) {
          log(`   Found card ${testCardId2} bound to user: ${cardExists.name}`, 'yellow');
        } else {
          log(`   Card ${testCardId2} not found in database`, 'yellow');
        }
        
        return;
      }
    } else {
      log('\n⚠️  Only one user without card available, skipping second card test', 'yellow');
    }
    
    // Step 4: Test binding same card to different user (should fail)
    if (usersWithoutCards.length > 1) {
      const testUser3 = usersWithoutCards[1];
      
      log(`\n🚫 Step 4: Testing duplicate card binding (should fail)...`, 'blue');
      log(`   Trying to bind ${testCardId} to ${testUser3.name}`, 'cyan');
      
      try {
        const duplicateResponse = await axios.post(`${API_BASE_URL}/api/users/${testUser3.id}?action=bindCard`, {
          cardId: testCardId
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
    }
    
    // Step 5: Clean up test data
    log('\n🧹 Step 5: Cleaning up test data...', 'blue');
    try {
      // Remove the test card bindings
      await axios.post(`${API_BASE_URL}/api/users/${testUser.id}?action=bindCard`, {
        cardId: null
      });
      
      if (usersWithoutCards.length > 1) {
        const testCardId2 = `TEST${Date.now() + 1}`;
        await axios.post(`${API_BASE_URL}/api/users/${usersWithoutCards[1].id}?action=bindCard`, {
          cardId: null
        });
      }
      
      log(`✅ Test data cleaned up`, 'green');
    } catch (error) {
      log(`⚠️  Could not clean up test data: ${error.message}`, 'yellow');
    }
    
    log('\n🎉 Card binding debug completed!', 'green');
    
  } catch (error) {
    log(`💥 Debug failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

// Run the debug
debugCardBinding().catch(error => {
  log(`💥 Debug runner failed: ${error.message}`, 'red');
  process.exit(1);
}); 