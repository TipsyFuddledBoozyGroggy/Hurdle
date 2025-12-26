// Jest setup for Selenium tests
// This file runs before each test suite

// Increase timeout for Selenium tests
jest.setTimeout(60000);

// Global test setup
beforeAll(async () => {
  console.log('🔧 Setting up Selenium test environment...');
  
  // Check if Chrome is available
  try {
    const { execSync } = require('child_process');
    execSync('google-chrome --version', { stdio: 'ignore' });
    console.log('✅ Chrome browser detected');
  } catch (error) {
    console.warn('⚠️  Chrome browser not found, tests may fail');
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up Selenium test environment...');
});