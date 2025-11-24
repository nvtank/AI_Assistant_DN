
console.log('🔍 Checking Gemini API Environment Variables...\n');

const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (geminiKey) {
  console.log('✅ NEXT_PUBLIC_GEMINI_API_KEY is set');
  console.log(`   Value: ${geminiKey.substring(0, 10)}...${geminiKey.substring(geminiKey.length - 4)}`);
  console.log(`   Length: ${geminiKey.length} characters`);
  
  if (geminiKey.startsWith('AIzaSy')) {
    console.log('   ✅ Format looks correct (starts with AIzaSy)');
  } else {
    console.log('   ⚠️  Warning: Key format may be incorrect');
  }
} else {
  console.log('❌ NEXT_PUBLIC_GEMINI_API_KEY is NOT set');
  console.log('   Please add it to .env file:');
  console.log('   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here');
}

console.log('\n📝 Note: After changing .env, you MUST restart the dev server!');
console.log('   Press Ctrl+C in the terminal running "npm run dev"');
console.log('   Then run "npm run dev" again\n');
