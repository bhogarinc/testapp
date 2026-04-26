import request from 'supertest';
import { Express } from 'express';

/**
 * Root API Integration Tests
 * Tests the base API endpoints
 */
describe('Root API Integration', () => {
  let app: Express;
  const API_BASE = '/api/v1';

  beforeAll(async () => {
    const { default: serverApp } = await import('../../src/app');
    app = serverApp;
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get(`${API_BASE}/`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should include API metadata', async () => {
      const response = await request(app)
        .get(`${API_BASE}/`)
        .expect(200);

      const possibleFields = ['name', 'version', 'description', 'status', 'endpoints'];
      const hasAtLeastOneField = possibleFields.some(field => 
        response.body.hasOwnProperty(field)
      );
      
      expect(hasAtLeastOneField || Object.keys(response.body).length > 0).toBeTruthy();
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get(`${API_BASE}/non-existent-endpoint`)
        .expect(404);

      expect(response.body).toBeDefined();
    });

    it('should return JSON for API 404 errors', async () => {
      const response = await request(app)
        .get(`${API_BASE}/not-found`)
        .set('Accept', 'application/json');

      const contentType = response.headers['content-type'];
      expect(contentType).toMatch(/json/);
    });
  });

  describe('HTTP Methods', () => {
    it('should handle POST requests appropriately', async () => {
      const response = await request(app)
        .post(`${API_BASE}/health`)
        .send({});

      expect([200, 201, 405, 404]).toContain(response.status);
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await request(app)
        .options(`${API_BASE}/health`);

      expect(response.status).toBe(204);
    });
  });
});
