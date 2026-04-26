/**
 * Health Controller Unit Tests
 * 
 * Tests for the health check endpoint controller.
 * Covers all response scenarios and edge cases.
 */

import { Request, Response } from 'express';
import { HealthController } from '../../../src/controllers/health.controller';
import { HealthService } from '../../../src/services/health.service';
import { HealthStates, HealthStatus } from '../../factories/health.factory';

jest.mock('../../../src/services/health.service');

describe('HealthController', () => {
  let controller: HealthController;
  let mockHealthService: jest.Mocked<HealthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockHealthService = new HealthService() as jest.Mocked<HealthService>;
    controller = new HealthController(mockHealthService);
    
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {},
      query: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('GET /health', () => {
    it('should return 200 with healthy status when all systems operational', async () => {
      const healthyResponse = HealthStates.healthy();
      mockHealthService.getHealthStatus.mockResolvedValue(healthyResponse);

      await controller.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HealthStatus.HEALTHY,
          version: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });

    it('should return 200 with degraded status when non-critical issues exist', async () => {
      const degradedResponse = HealthStates.degraded();
      mockHealthService.getHealthStatus.mockResolvedValue(degradedResponse);

      await controller.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HealthStatus.DEGRADED,
          dependencies: expect.arrayContaining([
            expect.objectContaining({ status: HealthStatus.DEGRADED }),
          ]),
        })
      );
    });

    it('should return 503 with unhealthy status when critical systems fail', async () => {
      const unhealthyResponse = HealthStates.unhealthy();
      mockHealthService.getHealthStatus.mockResolvedValue(unhealthyResponse);

      await controller.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HealthStatus.UNHEALTHY,
        })
      );
    });

    it('should include system metrics in response', async () => {
      const healthyResponse = HealthStates.healthy();
      mockHealthService.getHealthStatus.mockResolvedValue(healthyResponse);

      await controller.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.objectContaining({
            memory: expect.objectContaining({
              used: expect.any(Number),
              total: expect.any(Number),
              percentage: expect.any(Number),
            }),
            cpu: expect.objectContaining({
              usage: expect.any(Number),
              loadAverage: expect.any(Array),
            }),
          }),
        })
      );
    });

    it('should include dependency status in response', async () => {
      const healthyResponse = HealthStates.healthy();
      mockHealthService.getHealthStatus.mockResolvedValue(healthyResponse);

      await controller.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          dependencies: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              status: expect.any(String),
              responseTime: expect.any(Number),
            }),
          ]),
        })
      );
    });

    it('should return valid ISO timestamp', async () => {
      const healthyResponse = HealthStates.healthy();
      mockHealthService.getHealthStatus.mockResolvedValue(healthyResponse);

      await controller.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.timestamp).toBeValidISODate();
    });

    it('should handle service errors gracefully', async () => {
      mockHealthService.getHealthStatus.mockRejectedValue(
        new Error('Service unavailable')
      );

      await controller.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HealthStatus.UNHEALTHY,
          error: expect.any(String),
        })
      );
    });

    it('should include uptime in response', async () => {
      const healthyResponse = HealthStates.healthy();
      mockHealthService.getHealthStatus.mockResolvedValue(healthyResponse);

      await controller.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uptime: expect.any(Number),
        })
      );
    });

    it('should calculate response time', async () => {
      const healthyResponse = HealthStates.healthy();
      mockHealthService.getHealthStatus.mockResolvedValue(healthyResponse);

      const startTime = Date.now();
      await controller.getHealth(
        mockRequest as Request,
        mockResponse as Response
      );
      const endTime = Date.now();

      const response = jsonMock.mock.calls[0][0];
      expect(response.responseTime).toBeWithinRange(0, endTime - startTime + 100);
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when application is ready', async () => {
      mockHealthService.isReady.mockResolvedValue(true);

      await controller.getReady(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ ready: true });
    });

    it('should return 503 when application is not ready', async () => {
      mockHealthService.isReady.mockResolvedValue(false);

      await controller.getReady(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({ ready: false });
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 for liveness probe', async () => {
      await controller.getLive(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ alive: true });
    });
  });
});
