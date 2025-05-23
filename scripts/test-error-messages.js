#!/usr/bin/env node

/**
 * Test Error Messages for Card Binding
 * 
 * This script tests that error messages are displayed correctly when trying to bind duplicate cards.
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

async function testErrorMessages() {
  log('🧪 Testing Error Messages for Card Binding', 'blue');
  log('==========================================', 'blue');
  
  try {
    // Step 1: Get users
    log('\n📋 Step 1: Getting users...', 'blue');
    const usersResponse = await axios.get(`${API_BASE_URL}/api/users`);
    const users = usersResponse.data;
    
    // Find a user with a card and a user without a card
    const userWithCard = users.find(user => user.card_id);
    const userWithoutCard = users.find(user => !user.card_id);
    
    if (!userWithCard) {
      log('❌ No users with cards found. Creating test scenario...', 'red');
      
      if (!userWithoutCard) {
        log('❌ No users available for testing', 'red');
        return;
      }
      
      // Bind a card to create test scenario
      const testCard = `ERROR_TEST_${Date.now()}`;
      await axios.post(`${API_BASE_URL}/api/users/${userWithoutCard.id}?action=bindCard`, {
        cardId: testCard
      });
      
      log(`✅ Created test user with card: ${userWithoutCard.name} -> ${testCard}`, 'green');
      
      // Refresh user data
      const refreshResponse = await axios.get(`${API_BASE_URL}/api/users`);
      const refreshedUsers = refreshResponse.data;
      const testUserWithCard = refreshedUsers.find(u => u.id === userWithoutCard.id);
      const testUserWithoutCard = refreshedUsers.find(u => !u.card_id);
      
      if (!testUserWithoutCard) {
        log('❌ No users without cards available for duplicate test', 'red');
        return;
      }
      
      log('\nTest scenario created:', 'cyan');
      log(`  User with card: ${testUserWithCard.name} (ID: ${testUserWithCard.id}) -> Card: ${testUserWithCard.card_id}`, 'green');
      log(`  User without card: ${testUserWithoutCard.name} (ID: ${testUserWithoutCard.id})`, 'yellow');
      
      // Step 2: Test duplicate card binding
      log(`\n🚫 Step 2: Testing duplicate card binding error...`, 'blue');
      log(`   Trying to bind card "${testUserWithCard.card_id}" to user "${testUserWithoutCard.name}"`, 'cyan');
      
      try {
        const duplicateResponse = await axios.post(`${API_BASE_URL}/api/users/${testUserWithoutCard.id}?action=bindCard`, {
          cardId: testUserWithCard.card_id
        });
        
        log(`❌ Duplicate binding should have failed but didn't`, 'red');
        log(`   Response: ${JSON.stringify(duplicateResponse.data, null, 2)}`, 'red');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          log(`✅ Correctly prevented duplicate binding`, 'green');
          log(`   Status: ${error.response.status}`, 'cyan');
          log(`   Error message: "${error.response.data.error}"`, 'cyan');
          
          // Check if error message contains the expected format
          if (error.response.data.error.includes('уже связана со студентом')) {
            log(`✅ Error message format is correct`, 'green');
          } else {
            log(`⚠️  Error message format might need improvement`, 'yellow');
          }
        } else {
          log(`❌ Unexpected error: ${error.message}`, 'red');
          if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
          }
        }
      }
      
      // Step 3: Clean up test data
      log(`\n🧹 Step 3: Cleaning up test data...`, 'blue');
      try {
        await axios.post(`${API_BASE_URL}/api/users/${testUserWithCard.id}?action=bindCard`, {
          cardId: null
        });
        log(`✅ Test data cleaned up`, 'green');
      } catch (error) {
        log(`⚠️  Could not clean up test data: ${error.message}`, 'yellow');
      }
      
    } else {
      log('Found existing test scenario:', 'cyan');
      log(`  User with card: ${userWithCard.name} (ID: ${userWithCard.id}) -> Card: ${userWithCard.card_id}`, 'green');
      
      if (!userWithoutCard) {
        log('❌ No users without cards available for testing', 'red');
        return;
      }
      
      log(`  User without card: ${userWithoutCard.name} (ID: ${userWithoutCard.id})`, 'yellow');
      
      // Step 2: Test duplicate card binding
      log(`\n🚫 Step 2: Testing duplicate card binding error...`, 'blue');
      log(`   Trying to bind card "${userWithCard.card_id}" to user "${userWithoutCard.name}"`, 'cyan');
      
      try {
        const duplicateResponse = await axios.post(`${API_BASE_URL}/api/users/${userWithoutCard.id}?action=bindCard`, {
          cardId: userWithCard.card_id
        });
        
        log(`❌ Duplicate binding should have failed but didn't`, 'red');
        log(`   Response: ${JSON.stringify(duplicateResponse.data, null, 2)}`, 'red');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          log(`✅ Correctly prevented duplicate binding`, 'green');
          log(`   Status: ${error.response.status}`, 'cyan');
          log(`   Error message: "${error.response.data.error}"`, 'cyan');
          
          // Check if error message contains the expected format
          if (error.response.data.error.includes('уже связана со студентом')) {
            log(`✅ Error message format is correct`, 'green');
            
            // Check if it contains the student name
            if (error.response.data.error.includes(userWithCard.name)) {
              log(`✅ Error message includes student name correctly`, 'green');
            } else {
              log(`⚠️  Error message should include student name: "${userWithCard.name}"`, 'yellow');
            }
          } else {
            log(`⚠️  Error message format might need improvement`, 'yellow');
          }
        } else {
          log(`❌ Unexpected error: ${error.message}`, 'red');
          if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
          }
        }
      }
    }
    
    log('\n🎉 Error message test completed!', 'green');
    log('💡 Users should see helpful error messages when trying to bind duplicate cards', 'cyan');
    
  } catch (error) {
    log(`💥 Test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

// Run the test
testErrorMessages().catch(error => {
  log(`💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
}); 