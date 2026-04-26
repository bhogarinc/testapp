/**
 * Security-Aware Logger
 * Structured logging with security event tracking
 * 
 * @module utils/logger
 */

import winston from 'winston';
import { env, isDevelopment, isProduction } from '../config/env.config';

// Custom format for security events
const securityFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: securityFormat,
  defaultMeta: { service: 'testapp-backend' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: isDevelopment ? consoleFormat : winston.format.json(),
    }),
    
    // File output for production
    ...(isProduction ? [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880,
        maxFiles: 5,
      }),
    ] : []),
  ],
  // Don't exit on error
  exitOnError: false,
});

// Create logs directory in production
if (isProduction) {
  const fs = require('fs');
  const path = require('path');
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

/**
 * Security event logger
 * Specialized logger for security-related events
 */
export const securityLogger = {
  /**
   * Log authentication attempts
   */
  authAttempt: (success: boolean, details: {
    ip: string;
    userAgent?: string;
    userId?: string;
    reason?: string;
  }): void => {
    const level = success ? 'info' : 'warn';
    logger.log(level, 'Authentication attempt', {
      event: 'AUTH_ATTEMPT',
      success,
      ...details,
    });
  },
  
  /**
   * Log access control violations
   */
  accessDenied: (details: {
    ip: string;
    path: string;
    method: string;
    userId?: string;
    requiredPermission?: string;
  }): void => {
    logger.warn('Access denied', {
      event: 'ACCESS_DENIED',
      ...details,
    });
  },
  
  /**
   * Log suspicious activity
   */
  suspiciousActivity: (details: {
    ip: string;
    activity: string;
    severity: 'low' | 'medium' | 'high';
    details?: Record<string, unknown>;
  }): void => {
    const level = details.severity === 'high' ? 'error' : 'warn';
    logger.log(level, 'Suspicious activity detected', {
      event: 'SUSPICIOUS_ACTIVITY',
      ...details,
    });
  },
  
  /**
   * Log data access events
   */
  dataAccess: (details: {
    action: 'read' | 'write' | 'delete';
    resource: string;
    resourceId: string;
    userId?: string;
    ip: string;
  }): void => {
    logger.info('Data access', {
      event: 'DATA_ACCESS',
      ...details,
    });
  },
  
  /**
   * Log API request
   */
  apiRequest: (details: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    ip: string;
    userAgent?: string;
    userId?: string;
  }): void => {
    logger.info('API request', {
      event: 'API_REQUEST',
      ...details,
    });
  },
  
  /**
   * Log security configuration changes
   */
  configChange: (details: {
    changedBy: string;
    change: string;
    oldValue?: unknown;
    newValue?: unknown;
  }): void => {
    logger.info('Security configuration changed', {
      event: 'CONFIG_CHANGE',
      ...details,
    });
  },
};

export default logger;
