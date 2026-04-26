/**
 * Health Endpoint Integration Tests
 * 
 * Full-stack integration tests for health endpoints.
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import { HealthStatus } from '../factories/health.factory';

describe('Health API Integration', () => {
  let app: Express.Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        version: expect.any(String),
      });
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    it('should include system metrics', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.system).toMatchObject({
        memory: expect.objectContaining({
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number),
        }),
        cpu: expect.objectContaining({
          usage: expect.any(Number),
          loadAverage: expect.any(Array),
        }),
      });
    });

    it('should include dependency statuses', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.dependencies).toBeInstanceOf(Array);
      expect(response.body.dependencies.length).toBeGreaterThan(0);
      
      response.body.dependencies.forEach((dep: any) => {
        expect(dep).toMatchObject({
          name: expect.any(String),
          status: expect.any(String),
          responseTime: expect.any(Number),
        });
      });
    });

    it('should have response time under 1 second', async () => {
      const startTime = Date.now();
      await request(app).get('/api/v1/health').expect(200);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('should return ready status', async () => {
      const response = await request(app)
        .get('/api/v1/health/ready')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        ready: expect.any(Boolean),
      });
    });
  });

  describe('GET /api/v1/health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/v1/health/live')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        alive: true,
      });
    });
  });

  describe('GET /api/v1/info', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        name: expect.any(String),
        version: expect.any(String),
        description: expect.any(String),
        environment: expect.any(String),
      });
    });

    it('should return semantic version', async () => {
      const response = await request(app)
        .get('/api/v1/info')
        .expect(200);

      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
