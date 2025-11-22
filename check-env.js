
require('dotenv').config();
const https = require('https');
const http = require('http');

console.log('\n🔍 GRAB THE BEYOND - Environment Check\n');
console.log('='.repeat(60));

// Track results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

/**
 * Check if variable exists
 */
function checkVar(name, required = true) {
  const value = process.env[name];
  const exists = !!value;
  
  if (exists) {
    results.passed.push(`✅ ${name}: Set`);
    return true;
  } else {
    if (required) {
      results.failed.push(`❌ ${name}: Missing (Required)`);
    } else {
      results.warnings.push(`⚠️  ${name}: Not set (Optional)`);
    }
    return false;
  }
}

/**
 * Test Firebase connection
 */
async function testFirebase() {
  console.log('\n📦 Firebase Configuration');
  console.log('-'.repeat(60));
  
  const vars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  let allPresent = true;
  vars.forEach(v => {
    if (!checkVar(v, false)) allPresent = false;
  });
  
  if (allPresent) {
    console.log('\n✅ Firebase Client Config: Complete');
  } else {
    console.log('\n⚠️  Firebase Client Config: Incomplete (App will use mock data)');
  }
  
  // Check Admin SDK
  console.log('\nFirebase Admin SDK:');
  const adminVars = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY'
  ];
  
  let adminComplete = true;
  adminVars.forEach(v => {
    if (!checkVar(v, false)) adminComplete = false;
  });
  
  if (adminComplete) {
    console.log('✅ Firebase Admin: Complete');
  } else {
    console.log('⚠️  Firebase Admin: Incomplete (Will use mock data)');
  }
}

/**
 * Test OpenWeatherMap API
 */
async function testWeatherAPI() {
  console.log('\n☁️  OpenWeatherMap API');
  console.log('-'.repeat(60));
  
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  API Key: Not set (Will use mock weather data)');
    return;
  }
  
  console.log('✅ API Key: Set');
  console.log('🔄 Testing API connection...');
  
  return new Promise((resolve) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Da%20Nang&appid=${apiKey}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.cod === 200) {
            console.log('✅ API Connection: Working');
            console.log(`   Temperature: ${(json.main.temp - 273.15).toFixed(1)}°C`);
            console.log(`   Weather: ${json.weather[0].description}`);
            results.passed.push('OpenWeatherMap API: Working');
          } else {
            console.log(`❌ API Error: ${json.message}`);
            results.failed.push('OpenWeatherMap API: Invalid key');
          }
        } catch (e) {
          console.log('❌ API Error: Invalid response');
          results.failed.push('OpenWeatherMap API: Failed');
        }
        resolve();
      });
    }).on('error', (e) => {
      console.log(`❌ Connection Error: ${e.message}`);
      results.failed.push('OpenWeatherMap API: Connection failed');
      resolve();
    });
  });
}

/**
 * Test Puter AI
 */
async function testPuterAI() {
  console.log('\n🤖 Puter AI Configuration');
  console.log('-'.repeat(60));
  
  const enabled = process.env.PUTER_ENABLED === 'true';
  
  if (enabled) {
    console.log('✅ Puter AI: Enabled');
    console.log('ℹ️  Note: Puter loads via CDN (https://js.puter.com/v2/)');
    console.log('ℹ️  No API key required - FREE AI service!');
    results.passed.push('Puter AI: Enabled');
  } else {
    console.log('⚠️  Puter AI: Disabled');
    results.warnings.push('Puter AI: Disabled');
  }
}

/**
 * Test Server Configuration
 */
async function testServerConfig() {
  console.log('\n🖥️  Server Configuration');
  console.log('-'.repeat(60));
  
  const port = process.env.PORT || 3001;
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  
  console.log(`✅ PORT: ${port}`);
  
  if (socketUrl) {
    console.log(`✅ Socket URL: ${socketUrl}`);
    
    // Test if server is running
    console.log('🔄 Testing server connection...');
    
    return new Promise((resolve) => {
      const url = socketUrl.replace('http://', '').replace('https://', '');
      const [hostname, portStr] = url.split(':');
      
      const req = http.request({
        hostname,
        port: portStr || 80,
        path: '/',
        method: 'GET',
        timeout: 2000
      }, (res) => {
        console.log(`✅ Server: Responding (Status: ${res.statusCode})`);
        results.passed.push('Server: Running');
        resolve();
      });
      
      req.on('error', () => {
        console.log('⚠️  Server: Not running (Start with: npm run dev:all)');
        results.warnings.push('Server: Not running');
        resolve();
      });
      
      req.on('timeout', () => {
        console.log('⚠️  Server: Timeout');
        results.warnings.push('Server: Timeout');
        req.destroy();
        resolve();
      });
      
      req.end();
    });
  } else {
    console.log('❌ Socket URL: Not set');
    results.failed.push('NEXT_PUBLIC_SOCKET_URL: Missing');
  }
}

/**
 * Test Grab Configuration
 */
async function testGrabConfig() {
  console.log('\n🚗 Grab Configuration');
  console.log('-'.repeat(60));
  
  const scheme = process.env.GRAB_DEEP_LINK_SCHEME;
  
  if (scheme) {
    console.log(`✅ Deep Link Scheme: ${scheme}`);
    console.log('ℹ️  Note: Using Mock Grab App for demo');
    console.log('ℹ️  Real Grab integration requires official partnership');
    results.passed.push('Grab Config: Set');
  } else {
    console.log('⚠️  Deep Link Scheme: Not set');
    results.warnings.push('Grab Config: Not set');
  }
}


function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Passed: ${results.passed.length}`);
  if (results.passed.length > 0) {
    results.passed.forEach(r => console.log(`   ${r}`));
  }
  
  console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
  if (results.warnings.length > 0) {
    results.warnings.forEach(r => console.log(`   ${r}`));
  }
  
  console.log(`\n❌ Failed: ${results.failed.length}`);
  if (results.failed.length > 0) {
    results.failed.forEach(r => console.log(`   ${r}`));
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed.length === 0) {
    console.log('✅ ALL CRITICAL CHECKS PASSED!');
    console.log('\n🚀 Your app is ready to run!');
    console.log('\nStart with:');
    console.log('   npm run dev:all');
    console.log('\nOr separately:');
    console.log('   Terminal 1: PORT=3002 node server/index.js');
    console.log('   Terminal 2: npm run dev');
  } else {
    console.log('❌ SOME CHECKS FAILED');
    console.log('\nPlease fix the failed items above.');
    console.log('Check your .env file and ensure all required variables are set.');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}


async function main() {
  await testFirebase();
  await testWeatherAPI();
  await testPuterAI();
  await testServerConfig();
  await testGrabConfig();
  
  printSummary();
}

// Run checks
main().catch(console.error);
