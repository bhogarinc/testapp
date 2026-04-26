import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { HealthController } from './controllers/health.controller';
import { ApiInfoController } from './controllers/api-info.controller';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';

export function createApp(): Application {
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  
  // Controllers
  const healthController = new HealthController();
  const apiInfoController = new ApiInfoController();
  
  // Routes
  app.get('/api/v1/health', healthController.getHealth);
  app.get('/api/v1/health/ready', healthController.getReady);
  app.get('/api/v1/health/live', healthController.getLive);
  
  app.get('/api/v1/info', apiInfoController.getApiInfo);
  app.get('/api/v1/info/endpoints', apiInfoController.getEndpoints);
  app.get('/api/v1/info/versions', apiInfoController.getVersions);
  
  // Error handling
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  
  return app;
}
