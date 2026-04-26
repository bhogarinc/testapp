/**
 * Integration Test Setup
 */
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(30000);

// Global beforeAll setup
beforeAll(async () => {
  console.log('Starting integration tests...');
});

// Global afterAll teardown
afterAll(async () => {
  console.log('Integration tests completed.');
});

// Clean up after each test
afterEach(async () => {
  // Clean up any test data
});
