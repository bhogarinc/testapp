import request from 'supertest';
import { Express } from 'express';

/**
 * Health API Integration Tests
 * Tests the health check endpoint integration
 */
describe('Health API Integration', () => {
  let app: Express;
  const API_BASE = '/api/v1';

  beforeAll(async () => {
    const { default: serverApp } = await import('../../src/app');
    app = serverApp;
  });

  describe('GET /health', () => {
    it('should return health status with 200 OK', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('status');
    });

    it('should return valid health response structure', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.any(String),
      });

      if (response.body.timestamp) {
        expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      }
      
      if (response.body.uptime) {
        expect(typeof response.body.uptime).toBe('number');
        expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      }

      if (response.body.version) {
        expect(typeof response.body.version).toBe('string');
      }
    });

    it('should respond within acceptable time limit', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get(`${API_BASE}/health`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app).get(`${API_BASE}/health`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
      });
    });

    it('should return CORS headers', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Health Status Values', () => {
    it('should return a valid status value', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .expect(200);

      const validStatuses = ['healthy', 'ok', 'up', 'degraded', 'unhealthy', 'down', 'error'];
      const status = response.body.status?.toLowerCase();
      
      expect(validStatuses).toContain(status);
    });
  });
});
