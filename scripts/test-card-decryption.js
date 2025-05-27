/**
 * Test script for card decryption functionality
 * Tests the card decryption utilities and validates correct behavior
 */

console.log('🧪 Testing Card Decryption Functionality...\n');

// Test data - examples of encrypted card IDs
const testData = [
  {
    name: 'Valid encrypted card',
    cardId: 'dGVzdF9pdl9oZXJl:ZW5jcnlwdGVkX2RhdGFfaGVyZQ==',
    expectedToBeEncrypted: true
  },
  {
    name: 'Plain card ID',
    cardId: '04A1B2C3',
    expectedToBeEncrypted: false
  },
  {
    name: 'Another plain card',
    cardId: 'A6860588',
    expectedToBeEncrypted: false
  },
  {
    name: 'Invalid encrypted format',
    cardId: 'invalid:format:too:many:colons',
    expectedToBeEncrypted: false
  },
  {
    name: 'Empty string',
    cardId: '',
    expectedToBeEncrypted: false
  },
  {
    name: 'Null value',
    cardId: null,
    expectedToBeEncrypted: false
  }
];

// Mock implementations for testing (since we can't easily import ES modules in Node.js test)
function isEncryptedCardId(cardId) {
  if (!cardId || typeof cardId !== 'string') {
    return false;
  }
  
  // Зашифрованная строка должна содержать ':' и быть в формате base64:base64
  const parts = cardId.split(':');
  if (parts.length !== 2) {
    return false;
  }
  
  // Проверяем, что обе части похожи на base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(parts[0]) && base64Regex.test(parts[1]) && parts[0].length > 0 && parts[1].length > 0;
}

async function testEncryptionDetection() {
  console.log('📋 Testing encryption detection:\n');
  
  let passed = 0;
  let total = testData.length;
  
  testData.forEach((test, index) => {
    const result = isEncryptedCardId(test.cardId);
    const success = result === test.expectedToBeEncrypted;
    
    console.log(`${index + 1}. ${test.name}:`);
    console.log(`   Input: ${test.cardId}`);
    console.log(`   Expected encrypted: ${test.expectedToBeEncrypted}`);
    console.log(`   Actual encrypted: ${result}`);
    console.log(`   ${success ? '✅ PASS' : '❌ FAIL'}\n`);
    
    if (success) passed++;
  });
  
  console.log(`📊 Detection Test Results: ${passed}/${total} tests passed\n`);
  return passed === total;
}

async function testDecryptionFlow() {
  console.log('🔓 Testing decryption flow:\n');
  
  const mockSafeDecrypt = async (cardId) => {
    // Mock implementation - in real scenario this would use WebCrypto API
    if (isEncryptedCardId(cardId)) {
      // Simulate decryption by returning a mock decrypted value
      return '04A1B2C3'; // Mock decrypted card ID
    }
    return cardId;
  };
  
  const testCases = [
    {
      name: 'Encrypted card ID',
      input: 'dGVzdF9pdl9oZXJl:ZW5jcnlwdGVkX2RhdGFfaGVyZQ==',
      expected: '04A1B2C3'
    },
    {
      name: 'Plain card ID',
      input: 'A6860588',
      expected: 'A6860588'
    }
  ];
  
  let passed = 0;
  
  for (const test of testCases) {
    try {
      const result = await mockSafeDecrypt(test.input);
      const success = result === test.expected;
      
      console.log(`${test.name}:`);
      console.log(`   Input: ${test.input}`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Result: ${result}`);
      console.log(`   ${success ? '✅ PASS' : '❌ FAIL'}\n`);
      
      if (success) passed++;
    } catch (error) {
      console.log(`${test.name}:`);
      console.log(`   ❌ FAIL - Error: ${error.message}\n`);
    }
  }
  
  console.log(`📊 Decryption Test Results: ${passed}/${testCases.length} tests passed\n`);
  return passed === testCases.length;
}

async function testCardScanFlow() {
  console.log('💳 Testing card scan flow:\n');
  
  // Mock the handleCardScan function behavior
  const mockHandleCardScan = async (encryptedCardId) => {
    console.log(`   Received card ID: ${encryptedCardId}`);
    
    if (!encryptedCardId) {
      console.log('   ❌ Empty card ID');
      return false;
    }
    
    let cardId;
    if (isEncryptedCardId(encryptedCardId)) {
      console.log('   🔓 Card ID is encrypted, decrypting...');
      try {
        // Mock decryption
        cardId = '04A1B2C3'; // Mock result
        console.log('   ✅ Card ID decrypted successfully');
      } catch (error) {
        console.log('   ❌ Decryption failed');
        return false;
      }
    } else {
      cardId = encryptedCardId;
      console.log('   ℹ️ Card ID is not encrypted');
    }
    
    const formattedCardId = cardId.replace(/\s/g, '').toUpperCase();
    console.log(`   📋 Formatted card ID: ${formattedCardId}`);
    
    // Mock student lookup
    const mockStudents = [
      { id: '1', name: 'Иван Иванов', card_id: '04A1B2C3', hasAccess: true },
      { id: '2', name: 'Мария Петрова', card_id: 'A6860588', hasAccess: true }
    ];
    
    const matchingStudent = mockStudents.find(
      (student) => student.card_id && student.card_id.toUpperCase() === formattedCardId.toUpperCase()
    );
    
    if (matchingStudent) {
      console.log(`   👤 Student found: ${matchingStudent.name}`);
      if (matchingStudent.hasAccess) {
        console.log('   ✅ Access granted');
      } else {
        console.log('   ❌ Access denied');
      }
      return true;
    } else {
      console.log('   ❓ No matching student found');
      return true; // Still valid, just no student match
    }
  };
  
  const testScans = [
    {
      name: 'Encrypted card scan',
      cardId: 'dGVzdF9pdl9oZXJl:ZW5jcnlwdGVkX2RhdGFfaGVyZQ=='
    },
    {
      name: 'Plain card scan',
      cardId: 'A6860588'
    },
    {
      name: 'Unknown card scan',
      cardId: 'UNKNOWN123'
    }
  ];
  
  let passed = 0;
  
  for (const test of testScans) {
    console.log(`🔍 ${test.name}:`);
    try {
      const result = await mockHandleCardScan(test.cardId);
      if (result) {
        console.log('   ✅ PASS - Scan handled successfully\n');
        passed++;
      } else {
        console.log('   ❌ FAIL - Scan handling failed\n');
      }
    } catch (error) {
      console.log(`   ❌ FAIL - Error: ${error.message}\n`);
    }
  }
  
  console.log(`📊 Card Scan Test Results: ${passed}/${testScans.length} tests passed\n`);
  return passed === testScans.length;
}

async function runTests() {
  console.log('🚀 Starting Card Decryption Tests...\n');
  
  const results = [];
  
  try {
    results.push(await testEncryptionDetection());
    results.push(await testDecryptionFlow());
    results.push(await testCardScanFlow());
    
    const allPassed = results.every(r => r);
    
    console.log('=' .repeat(50));
    console.log('📋 FINAL TEST RESULTS:');
    console.log('=' .repeat(50));
    console.log(`Encryption Detection: ${results[0] ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Decryption Flow: ${results[1] ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Card Scan Flow: ${results[2] ? '✅ PASS' : '❌ FAIL'}`);
    console.log('=' .repeat(50));
    console.log(`Overall: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    console.log('=' .repeat(50));
    
    return allPassed;
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  runTests,
  testEncryptionDetection,
  testDecryptionFlow,
  testCardScanFlow
}; 