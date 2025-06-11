// Clear and Reset AI Settings
// Run this in your browser console to clear the stored API key

// Clear the stored API key
localStorage.removeItem('OPENAI_API_KEY');
console.log('✓ Cleared stored OpenAI API key');

// Check if it's cleared
const currentKey = localStorage.getItem('OPENAI_API_KEY');
console.log('Current stored key:', currentKey || 'None');

// Instructions
console.log('\nNext steps:');
console.log('1. Go to AI Settings in the app');
console.log('2. Enter your valid OpenAI API key');
console.log('3. Save and test the AI recommendations again');
