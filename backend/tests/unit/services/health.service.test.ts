/**
 * Health Service Unit Tests
 * 
 * Tests for the health check business logic and service layer.
 */

import { HealthService } from '../../../src/services/health.service';
import { HealthStatus } from '../../factories/health.factory';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getHealthStatus', () => {
    it('should return health status with all required fields', async () => {
      const status = await service.getHealthStatus();

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('timestamp');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('responseTime');
      expect(status).toHaveProperty('system');
      expect(status).toHaveProperty('dependencies');
    });

    it('should return healthy status when all checks pass', async () => {
      jest.spyOn(service as any, 'checkDependencies').mockResolvedValue([
        { name: 'database', status: HealthStatus.HEALTHY, responseTime: 10 },
        { name: 'cache', status: HealthStatus.HEALTHY, responseTime: 5 },
      ]);

      const status = await service.getHealthStatus();
      expect(status.status).toBe(HealthStatus.HEALTHY);
    });

    it('should return degraded status when non-critical check fails', async () => {
      jest.spyOn(service as any, 'checkDependencies').mockResolvedValue([
        { name: 'database', status: HealthStatus.HEALTHY, responseTime: 10 },
        { name: 'cache', status: HealthStatus.DEGRADED, responseTime: 500 },
      ]);

      const status = await service.getHealthStatus();
      expect(status.status).toBe(HealthStatus.DEGRADED);
    });

    it('should return unhealthy status when critical check fails', async () => {
      jest.spyOn(service as any, 'checkDependencies').mockResolvedValue([
        { name: 'database', status: HealthStatus.UNHEALTHY, responseTime: 0 },
        { name: 'cache', status: HealthStatus.HEALTHY, responseTime: 5 },
      ]);

      const status = await service.getHealthStatus();
      expect(status.status).toBe(HealthStatus.UNHEALTHY);
    });

    it('should calculate correct uptime', async () => {
      const startTime = Date.now();
      jest.setSystemTime(startTime);
      
      service = new HealthService();
      
      const uptimeSeconds = 3600;
      jest.setSystemTime(startTime + uptimeSeconds * 1000);

      const status = await service.getHealthStatus();
      expect(status.uptime).toBeGreaterThanOrEqual(uptimeSeconds - 1);
      expect(status.uptime).toBeLessThanOrEqual(uptimeSeconds + 1);
    });

    it('should include memory usage metrics', async () => {
      const status = await service.getHealthStatus();
      
      expect(status.system.memory).toMatchObject({
        used: expect.any(Number),
        total: expect.any(Number),
        percentage: expect.any(Number),
      });
      
      expect(status.system.memory.percentage).toBeWithinRange(0, 100);
    });

    it('should include CPU usage metrics', async () => {
      const status = await service.getHealthStatus();
      
      expect(status.system.cpu).toMatchObject({
        usage: expect.any(Number),
        loadAverage: expect.any(Array),
      });
    });

    it('should check all configured dependencies', async () => {
      const checkDependenciesSpy = jest.spyOn(service as any, 'checkDependencies');
      
      await service.getHealthStatus();
      
      expect(checkDependenciesSpy).toHaveBeenCalled();
    });

    it('should measure response time accurately', async () => {
      const status = await service.getHealthStatus();
      
      expect(status.responseTime).toBeGreaterThanOrEqual(0);
      expect(status.responseTime).toBeLessThan(1000);
    });
  });

  describe('isReady', () => {
    it('should return true when all critical dependencies are healthy', async () => {
      jest.spyOn(service as any, 'checkCriticalDependencies').mockResolvedValue([
        { status: HealthStatus.HEALTHY },
        { status: HealthStatus.HEALTHY },
      ]);

      const isReady = await service.isReady();
      expect(isReady).toBe(true);
    });

    it('should return false when any critical dependency is unhealthy', async () => {
      jest.spyOn(service as any, 'checkCriticalDependencies').mockResolvedValue([
        { status: HealthStatus.HEALTHY },
        { status: HealthStatus.UNHEALTHY },
      ]);

      const isReady = await service.isReady();
      expect(isReady).toBe(false);
    });

    it('should return false when check throws error', async () => {
      jest.spyOn(service as any, 'checkCriticalDependencies').mockRejectedValue(
        new Error('Connection failed')
      );

      const isReady = await service.isReady();
      expect(isReady).toBe(false);
    });
  });

  describe('checkDependencies', () => {
    it('should check database connectivity', async () => {
      const dependencies = await (service as any).checkDependencies();
      
      const dbCheck = dependencies.find((d: any) => d.name === 'database');
      expect(dbCheck).toBeDefined();
      expect(dbCheck).toHaveProperty('status');
      expect(dbCheck).toHaveProperty('responseTime');
    });

    it('should check cache connectivity', async () => {
      const dependencies = await (service as any).checkDependencies();
      
      const cacheCheck = dependencies.find((d: any) => d.name === 'cache');
      expect(cacheCheck).toBeDefined();
      expect(cacheCheck).toHaveProperty('status');
      expect(cacheCheck).toHaveProperty('responseTime');
    });

    it('should mark dependency as degraded when slow', async () => {
      jest.spyOn(service as any, 'checkDatabase').mockResolvedValue({
        name: 'database',
        status: HealthStatus.DEGRADED,
        responseTime: 2500,
      });

      const dependencies = await (service as any).checkDependencies();
      const dbCheck = dependencies.find((d: any) => d.name === 'database');
      
      expect(dbCheck.status).toBe(HealthStatus.DEGRADED);
    });
  });

  describe('error handling', () => {
    it('should handle errors in dependency checks gracefully', async () => {
      jest.spyOn(service as any, 'checkDatabase').mockRejectedValue(
        new Error('Connection refused')
      );

      const status = await service.getHealthStatus();
      
      expect(status.status).toBe(HealthStatus.UNHEALTHY);
      expect(status.dependencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'database',
            status: HealthStatus.UNHEALTHY,
          }),
        ])
      );
    });

    it('should include error message in dependency status', async () => {
      const errorMessage = 'Timeout exceeded';
      jest.spyOn(service as any, 'checkCache').mockRejectedValue(
        new Error(errorMessage)
      );

      const status = await service.getHealthStatus();
      const cacheCheck = status.dependencies.find((d: any) => d.name === 'cache');
      
      expect(cacheCheck.message).toContain(errorMessage);
    });
  });
});
