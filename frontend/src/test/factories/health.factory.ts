/**
 * Health Data Factory
 * 
 * Factory for creating mock health data for frontend tests.
 */

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface HealthData {
  status: HealthStatus;
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  responseTime: number;
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
    };
  };
  dependencies: Array<{
    name: string;
    status: HealthStatus;
    responseTime: number;
    lastChecked: string;
    message?: string;
  }>;
}

export const createHealthData = (overrides: Partial<HealthData> = {}): HealthData => ({
  status: HealthStatus.HEALTHY,
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
      status: HealthStatus.HEALTHY,
      responseTime: 12,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'cache',
      status: HealthStatus.HEALTHY,
      responseTime: 5,
      lastChecked: new Date().toISOString(),
    },
  ],
  ...overrides,
});

export const HealthStates = {
  healthy: (): HealthData => createHealthData(),

  degraded: (): HealthData =>
    createHealthData({
      status: HealthStatus.DEGRADED,
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
          status: HealthStatus.HEALTHY,
          responseTime: 15,
          lastChecked: new Date().toISOString(),
        },
        {
          name: 'cache',
          status: HealthStatus.DEGRADED,
          responseTime: 800,
          lastChecked: new Date().toISOString(),
          message: 'High latency detected',
        },
      ],
    }),

  unhealthy: (): HealthData =>
    createHealthData({
      status: HealthStatus.UNHEALTHY,
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
          status: HealthStatus.UNHEALTHY,
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          message: 'Connection refused',
        },
      ],
    }),
};
