/**
 * API Info Controller
 * 
 * Controller for API information endpoints.
 */

import { Request, Response } from 'express';
import { ApiInfoService } from '../services/api-info.service';

export class ApiInfoController {
  private apiInfoService: ApiInfoService;

  constructor(apiInfoService?: ApiInfoService) {
    this.apiInfoService = apiInfoService || new ApiInfoService();
  }

  getApiInfo = (req: Request, res: Response): void => {
    try {
      const info = this.apiInfoService.getApiInfo();
      res.status(200).json(info);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve API information',
        timestamp: new Date().toISOString(),
      });
    }
  };

  getEndpoints = (req: Request, res: Response): void => {
    try {
      const endpoints = this.apiInfoService.getEndpoints();
      res.status(200).json({ endpoints });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve endpoints',
        timestamp: new Date().toISOString(),
      });
    }
  };

  getVersions = (req: Request, res: Response): void => {
    try {
      const versions = this.apiInfoService.getVersions();
      res.status(200).json({ versions });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve versions',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
