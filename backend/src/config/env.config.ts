/**
 * Environment Configuration
 * Validates and sanitizes all environment variables using envalid
 * 
 * @module config/env.config
 */

import { cleanEnv, port, str, bool, num } from 'envalid';

export const env = cleanEnv(process.env, {
  // Server Configuration
  PORT: port({ default: 3000 }),
  HOST: str({ default: '0.0.0.0' }),
  
  // Environment
  NODE_ENV: str({ 
    choices: ['development', 'test', 'production'], 
    default: 'development' 
  }),
  
  // API Configuration
  API_VERSION: str({ default: 'v1' }),
  API_PREFIX: str({ default: '/api' }),
  
  // Logging
  LOG_LEVEL: str({ 
    choices: ['debug', 'info', 'warn', 'error'], 
    default: 'info' 
  }),
  
  // Security
  ENABLE_RATE_LIMITING: bool({ default: true }),
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),
  
  // CORS
  CORS_ORIGIN: str({ default: '*' }),
  CORS_CREDENTIALS: bool({ default: false }),
  
  // Session/Cookie (if needed in future)
  SESSION_SECRET: str({ default: 'change-me-in-production' }),
  COOKIE_SECURE: bool({ default: false }),
  COOKIE_HTTP_ONLY: bool({ default: true }),
  
  // Feature Flags
  ENABLE_SWAGGER: bool({ default: true }),
  ENABLE_REQUEST_LOGGING: bool({ default: true }),
});

// Computed properties
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export default env;
