/**
 * Test Setup File
 * Global test configuration and utilities for backend tests.
 */

import { config } from 'dotenv';

config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

if (process.env.CI === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
  toBeValidISODate(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid ISO date`
          : `expected ${received} to be a valid ISO date`,
      pass,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeValidISODate(): R;
    }
  }
}
