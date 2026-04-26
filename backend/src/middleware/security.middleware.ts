/**
 * Security Middleware
 * Configures CORS, rate limiting, and security headers
 * 
 * @module middleware/security.middleware
 */

import cors, { CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';
import { securityLogger } from '../utils/logger';

// Parse allowed origins from environment or use defaults
const parseAllowedOrigins = (): string[] => {
  if (env.CORS_ORIGIN === '*') {
    return env.isDevelopment 
      ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
      : []; // Empty in production means no CORS allowed by default
  }
  return env.CORS_ORIGIN.split(',').map(origin => origin.trim());
};

const allowedOrigins = parseAllowedOrigins();

/**
 * CORS configuration options
 */
export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (env.isDevelopment && env.CORS_ORIGIN === '*') {
      return callback(null, true);
    }
    
    // Check against whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      securityLogger.suspiciousActivity({
        ip: 'unknown', // Will be set by middleware
        activity: 'CORS violation attempt',
        severity: 'low',
        details: { attemptedOrigin: origin },
      });
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: env.CORS_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

/**
 * Rate limiting configuration
 * Prevents brute force and DoS attacks
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // Use X-Forwarded-For if behind proxy, otherwise use IP
    return (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response): void => {
    securityLogger.suspiciousActivity({
      ip: req.ip || 'unknown',
      activity: 'Rate limit exceeded',
      severity: 'medium',
      details: {
        path: req.path,
        method: req.method,
        userAgent: req.get('user-agent'),
      },
    });
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
    });
  },
  skip: (req: Request): boolean => {
    // Skip rate limiting for health checks from monitoring
    return req.path === '/api/v1/health/live';
  },
});

/**
 * IP extraction middleware
 * Sets the client IP correctly when behind proxies
 */
export const clientIpMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Trust proxy if configured
  if (env.isProduction) {
    req.app.set('trust proxy', 1);
  }
  next();
};

/**
 * Request ID middleware
 * Adds unique request ID for tracking and debugging
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId as string;
  res.setHeader('X-Request-ID', requestId as string);
  
  next();
};

/**
 * Security headers middleware
 * Additional headers not covered by Helmet
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove X-Powered-By (also handled by Helmet)
  res.removeHeader('X-Powered-By');
  
  // Add timing-allow-origin for performance APIs
  res.setHeader('Timing-Allow-Origin', '*');
  
  // Cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};
