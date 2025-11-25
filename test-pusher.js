#!/usr/bin/env node

/**
 * Test Pusher Connection
 * Run: node test-pusher.js
 */

const Pusher = require('pusher');

console.log('🧪 Testing Pusher Connection...\n');

const pusher = new Pusher({
  appId: "2082463",
  key: "21956ac5fe939faddb0b",
  secret: "eeae1b864cdfd25a8702",
  cluster: "ap1",
  useTLS: true
});

// Test trigger (broadcast a test message)
pusher.trigger('test-channel', 'test-event', {
  message: 'Hello from GrabTheBeyond!',
  timestamp: new Date().toISOString()
})
  .then(() => {
    console.log('✅ Pusher connection successful!');
    console.log('✅ Credentials are valid');
    console.log('✅ Ready to use in production\n');
    
    console.log('📋 Configuration:');
    console.log('   App ID:', "2082463");
    console.log('   Key:', "21956ac5fe939faddb0b");
    console.log('   Cluster:', "ap1");
    console.log('   TLS:', "Enabled");
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Pusher connection failed!');
    console.error('Error:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   1. Check if credentials are correct');
    console.error('   2. Check internet connection');
    console.error('   3. Verify Pusher app is active');
    
    process.exit(1);
  });
