/**
 * Helmet Security Configuration
 * Comprehensive security headers for production deployment
 * 
 * @module config/helmet.config
 * @see https://helmetjs.github.io/
 */

import helmet from 'helmet';
import { env } from './env.config';

export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        ...(env.isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : [])
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      ...(env.isProduction && { upgradeInsecureRequests: [] }),
    },
  },
  
  // Strict Transport Security (HSTS)
  hsts: env.isProduction ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  } : false,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  
  // Additional security headers
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  xssFilter: true,
});

export default helmetConfig;
