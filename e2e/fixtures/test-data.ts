/**
 * Test Data Fixtures for E2E Tests
 */
export const testData = {
  api: {
    validHealthResponse: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: 12345,
      services: {
        database: 'connected',
        cache: 'connected',
      },
    },
    degradedHealthResponse: {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: 12345,
      services: {
        database: 'connected',
        cache: 'disconnected',
      },
    },
    errorHealthResponse: {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: 12345,
      services: {
        database: 'disconnected',
        cache: 'disconnected',
      },
    },
  },
  
  ui: {
    validRoutes: ['/', '/health'],
    invalidRoutes: ['/admin', '/api', '/config', '/settings'],
    breakpoints: {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 },
    },
  },
  
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 10000,
    extended: 30000,
  },
};

export const selectors = {
  healthPage: {
    statusIndicator: '[data-testid="api-status"], .status-indicator, .health-status',
    metrics: '[data-testid="health-metrics"], .metrics, .health-data',
    lastUpdated: '[data-testid="last-updated"], .timestamp, .last-check',
    errorMessage: '[data-testid="error-message"], .error, .status-error',
  },
  dashboard: {
    container: 'main, #root, .app, .dashboard',
    navigation: 'nav, [role="navigation"], .navbar, .sidebar',
    apiInfo: '[data-testid="api-info"], .api-info, .version-info',
  },
};
