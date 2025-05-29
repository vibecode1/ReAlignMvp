// Debug LOE Creation Issue

const fetch = require('node-fetch');

async function testLoeCreation() {
  console.log('=== Testing LOE Draft Creation ===\n');

  // First, let's check if the server is running
  try {
    const healthCheck = await fetch('http://localhost:5000/api/v1/loe/templates');
    console.log('Server health check:', healthCheck.status);
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.error('Error:', error.message);
    return;
  }

  // Now let's try to create a draft without authentication
  console.log('\n1. Testing without authentication...');
  try {
    const response = await fetch('http://localhost:5000/api/v1/loe/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_id: '123e4567-e89b-12d3-a456-426614174000',
        template_type: 'unemployment',
        generate_with_ai: false
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }

  // Test with a mock token
  console.log('\n2. Testing with mock authentication...');
  try {
    const response = await fetch('http://localhost:5000/api/v1/loe/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify({
        transaction_id: '123e4567-e89b-12d3-a456-426614174000',
        template_type: 'unemployment',
        generate_with_ai: false
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n=== End of Debug Test ===');
}

testLoeCreation();