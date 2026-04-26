import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * Health Check Load Test Configuration
 * Tests API performance under various load conditions
 */

const healthCheckErrorRate = new Rate('health_check_errors');
const healthCheckResponseTime = new Trend('health_check_response_time');

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },
    
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'load' },
    },
    
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '5m', target: 0 },
      ],
      tags: { test_type: 'stress' },
    },
    
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 0 },
      ],
      tags: { test_type: 'spike' },
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
    health_check_errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.TEST_APP_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

export default function () {
  group('Health Check API', () => {
    const startTime = new Date().getTime();
    
    const response = http.get(`${API_BASE}/health`, {
      tags: { 
        name: 'health_check',
        endpoint: 'health',
      },
    });
    
    const duration = new Date().getTime() - startTime;
    healthCheckResponseTime.add(duration);
    
    const success = check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check has valid JSON': (r) => {
        try {
          const body = JSON.parse(r.body as string);
          return body.hasOwnProperty('status');
        } catch {
          return false;
        }
      },
      'health check response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    healthCheckErrorRate.add(!success);
    
    sleep(1);
  });

  group('Root API', () => {
    const response = http.get(`${API_BASE}/`, {
      tags: {
        name: 'root_api',
        endpoint: 'root',
      },
    });
    
    check(response, {
      'root API status is 200': (r) => r.status === 200,
      'root API returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    });
    
    sleep(1);
  });
}
