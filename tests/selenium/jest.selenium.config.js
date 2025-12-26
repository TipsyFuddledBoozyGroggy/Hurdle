// Jest configuration for Selenium E2E tests
module.exports = {
  displayName: 'Selenium E2E Tests',
  testMatch: ['**/tests/selenium/**/*.test.js'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/selenium/jest.selenium.setup.js'],
  testTimeout: 60000, // 60 seconds for E2E tests
  verbose: true,
  collectCoverage: false, // Don't collect coverage for E2E tests
  maxWorkers: 1, // Run tests sequentially to avoid conflicts
};