/**
 * Health Types
 * 
 * Type definitions for health check functionality.
 */

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
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
