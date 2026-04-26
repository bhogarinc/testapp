/**
 * Updated App Configuration with Security Hardening
 * 
 * @module app
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import { env } from './config/env.config';
import { helmetConfig } from './config/helmet.config';
import { 
  corsOptions, 
  rateLimiter, 
  requestIdMiddleware, 
  securityHeaders,
  clientIpMiddleware 
} from './middleware/security.middleware';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { HealthController } from './controllers/health.controller';
import { ApiInfoController } from './controllers/api-info.controller';
import { logger } from './utils/logger';
import cors from 'cors';
import morgan from 'morgan';

export function createApp(): Application {
  const app = express();
  
  // Trust proxy (required for rate limiting behind reverse proxy)
  app.set('trust proxy', env.isProduction ? 1 : 0);
  
  // Security middleware (order matters!)
  app.use(helmetConfig);
  app.use(clientIpMiddleware);
  app.use(requestIdMiddleware);
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  
  // Rate limiting (skip for health checks)
  if (env.ENABLE_RATE_LIMITING) {
    app.use(rateLimiter);
  }
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging
  if (env.ENABLE_REQUEST_LOGGING) {
    morgan.token('request-id', (req: Request) => req.headers['x-request-id'] as string);
    app.use(morgan(
      ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" [:request-id]', 
      { stream: { write: (message: string) => logger.info(message.trim()) } }
    ));
  }
  
  // Request timing middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', `${duration}ms`);
    });
    next();
  });
  
  // Controllers
  const healthController = new HealthController();
  const apiInfoController = new ApiInfoController();
  
  // API Routes
  const apiPrefix = `${env.API_PREFIX}/${env.API_VERSION}`;
  
  // Health check routes (no rate limiting on live check)
  app.get(`${apiPrefix}/health`, healthController.getHealth);
  app.get(`${apiPrefix}/health/ready`, healthController.getReady);
  app.get(`${apiPrefix}/health/live`, healthController.getLive);
  
  // API info routes
  app.get(`${apiPrefix}/info`, apiInfoController.getApiInfo);
  app.get(`${apiPrefix}/info/endpoints`, apiInfoController.getEndpoints);
  app.get(`${apiPrefix}/info/versions`, apiInfoController.getVersions);
  
  // Root redirect to API info
  app.get('/', (req: Request, res: Response) => {
    res.redirect(`${apiPrefix}/info`);
  });
  
  // Error handling (must be last)
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  
  return app;
}
