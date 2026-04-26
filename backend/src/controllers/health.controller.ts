/**
 * Health Controller
 * 
 * Controller for health check endpoints.
 */

import { Request, Response } from 'express';
import { HealthService } from '../services/health.service';
import { HealthStatus } from '../types/health.types';

export class HealthController {
  private healthService: HealthService;

  constructor(healthService?: HealthService) {
    this.healthService = healthService || new HealthService();
  }

  getHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.healthService.getHealthStatus();
      const statusCode = health.status === HealthStatus.UNHEALTHY ? 503 : 200;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date().toISOString(),
        error: 'Failed to check health status',
      });
    }
  };

  getReady = async (req: Request, res: Response): Promise<void> => {
    const isReady = await this.healthService.isReady();
    const statusCode = isReady ? 200 : 503;
    res.status(statusCode).json({ ready: isReady });
  };

  getLive = (req: Request, res: Response): void => {
    res.status(200).json({ alive: true });
  };
}
