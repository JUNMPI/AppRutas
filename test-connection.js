// test-connection.js
const axios = require('axios');

const testConnections = async () => {
  const urls = [
    'http://localhost:5000/health',
    'http://192.168.100.4:5000/health',
    'http://127.0.0.1:5000/health'
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      console.log(`✅ ${url} - Status: ${response.status}`);
      console.log('   Data:', response.data);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
};

testConnections();