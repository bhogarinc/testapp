/**
 * MSW Request Handlers
 * 
 * Mock API responses for testing.
 */

import { http, HttpResponse } from 'msw';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const handlers = [
  // Health check endpoint
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'test',
      uptime: 3600,
      responseTime: 45,
      system: {
        memory: {
          used: 536870912,
          total: 2147483648,
          percentage: 25,
        },
        cpu: {
          usage: 15,
          loadAverage: [0.5, 0.7, 0.6],
        },
      },
      dependencies: [
        {
          name: 'database',
          status: 'healthy',
          responseTime: 12,
          lastChecked: new Date().toISOString(),
        },
        {
          name: 'cache',
          status: 'healthy',
          responseTime: 5,
          lastChecked: new Date().toISOString(),
        },
      ],
    });
  }),

  // Health ready endpoint
  http.get(`${API_BASE_URL}/health/ready`, () => {
    return HttpResponse.json({ ready: true });
  }),

  // Health live endpoint
  http.get(`${API_BASE_URL}/health/live`, () => {
    return HttpResponse.json({ alive: true });
  }),

  // API info endpoint
  http.get(`${API_BASE_URL}/info`, () => {
    return HttpResponse.json({
      name: 'TestApp API',
      version: '1.0.0',
      description: 'A simple test application API',
      environment: 'test',
      baseUrl: '/api/v1',
      documentation: '/api/v1/docs',
    });
  }),

  // Degraded health state
  http.get(`${API_BASE_URL}/health/degraded`, () => {
    return HttpResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'test',
      uptime: 3600,
      responseTime: 2500,
      system: {
        memory: {
          used: 1932735283,
          total: 2147483648,
          percentage: 90,
        },
        cpu: {
          usage: 85,
          loadAverage: [4.5, 3.2, 2.8],
        },
      },
      dependencies: [
        {
          name: 'database',
          status: 'healthy',
          responseTime: 15,
          lastChecked: new Date().toISOString(),
        },
        {
          name: 'cache',
          status: 'degraded',
          responseTime: 800,
          lastChecked: new Date().toISOString(),
          message: 'High latency detected',
        },
      ],
    });
  }),

  // Unhealthy state
  http.get(`${API_BASE_URL}/health/unhealthy`, () => {
    return HttpResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'test',
        uptime: 3600,
        responseTime: 5000,
        system: {
          memory: {
            used: 2147483648,
            total: 2147483648,
            percentage: 100,
          },
          cpu: {
            usage: 99,
            loadAverage: [15.5, 12.3, 8.8],
          },
        },
        dependencies: [
          {
            name: 'database',
            status: 'unhealthy',
            responseTime: 0,
            lastChecked: new Date().toISOString(),
            message: 'Connection refused',
          },
        ],
      },
      { status: 503 }
    );
  }),

  // Error scenario
  http.get(`${API_BASE_URL}/health/error`, () => {
    return HttpResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to check health status',
      },
      { status: 500 }
    );
  }),
];
