/**
 * Health Response Factory
 * Factory for creating mock health check responses.
 */

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

export interface DependencyHealth {
  name: string;
  status: HealthStatus;
  responseTime: number;
  lastChecked: string;
  message?: string;
}

export interface SystemHealth {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
}

export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  responseTime: number;
  system: SystemHealth;
  dependencies: DependencyHealth[];
}

const DEFAULTS = {
  status: HealthStatus.HEALTHY,
  version: '1.0.0',
  environment: 'test',
  uptime: 3600,
  timestamp: () => new Date().toISOString(),
  responseTime: 50,
} as const;

export const createDependencyHealth = (
  overrides: Partial<DependencyHealth> = {}
): DependencyHealth => ({
  name: 'database',
  status: HealthStatus.HEALTHY,
  responseTime: 25,
  lastChecked: new Date().toISOString(),
  ...overrides,
});

export const createSystemHealth = (
  overrides: Partial<SystemHealth> = {}
): SystemHealth => ({
  memory: {
    used: 512 * 1024 * 1024,
    total: 2048 * 1024 * 1024,
    percentage: 25,
  },
  cpu: {
    usage: 15,
    loadAverage: [0.5, 0.7, 0.6],
  },
  ...overrides,
});

export const createHealthResponse = (
  overrides: Partial<HealthResponse> = {}
): HealthResponse => ({
  status: DEFAULTS.status,
  timestamp: DEFAULTS.timestamp(),
  version: DEFAULTS.version,
  environment: DEFAULTS.environment,
  uptime: DEFAULTS.uptime,
  responseTime: DEFAULTS.responseTime,
  system: createSystemHealth(),
  dependencies: [
    createDependencyHealth({ name: 'database' }),
    createDependencyHealth({ name: 'cache' }),
  ],
  ...overrides,
});

export const HealthStates = {
  healthy: (): HealthResponse =>
    createHealthResponse({
      status: HealthStatus.HEALTHY,
      dependencies: [
        createDependencyHealth({ name: 'database', status: HealthStatus.HEALTHY }),
        createDependencyHealth({ name: 'cache', status: HealthStatus.HEALTHY }),
      ],
    }),

  degraded: (): HealthResponse =>
    createHealthResponse({
      status: HealthStatus.DEGRADED,
      dependencies: [
        createDependencyHealth({ name: 'database', status: HealthStatus.HEALTHY }),
        createDependencyHealth({
          name: 'cache',
          status: HealthStatus.DEGRADED,
          responseTime: 500,
          message: 'High latency detected',
        }),
      ],
    }),

  unhealthy: (): HealthResponse =>
    createHealthResponse({
      status: HealthStatus.UNHEALTHY,
      dependencies: [
        createDependencyHealth({
          name: 'database',
          status: HealthStatus.UNHEALTHY,
          message: 'Connection refused',
        }),
        createDependencyHealth({ name: 'cache', status: HealthStatus.HEALTHY }),
      ],
    }),
};
