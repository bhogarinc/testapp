/**
 * Health Service
 * 
 * Service layer for health check functionality.
 */

import { HealthStatus, HealthResponse, DependencyHealth, SystemHealth } from '../types/health.types';

export class HealthService {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  async getHealthStatus(): Promise<HealthResponse> {
    const startTime = Date.now();
    
    const dependencies = await this.checkDependencies();
    const system = this.getSystemHealth();
    
    const criticalDependencies = ['database'];
    const hasUnhealthyCritical = dependencies
      .filter(d => criticalDependencies.includes(d.name))
      .some(d => d.status === HealthStatus.UNHEALTHY);
    
    const hasDegraded = dependencies.some(d => d.status === HealthStatus.DEGRADED);
    
    let status = HealthStatus.HEALTHY;
    if (hasUnhealthyCritical) {
      status = HealthStatus.UNHEALTHY;
    } else if (hasDegraded) {
      status = HealthStatus.DEGRADED;
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      responseTime: Date.now() - startTime,
      system,
      dependencies,
    };
  }

  async isReady(): Promise<boolean> {
    try {
      const criticalDeps = await this.checkCriticalDependencies();
      return criticalDeps.every(d => d.status === HealthStatus.HEALTHY);
    } catch {
      return false;
    }
  }

  private async checkDependencies(): Promise<DependencyHealth[]> {
    return Promise.all([
      this.checkDatabase(),
      this.checkCache(),
    ]);
  }

  private async checkCriticalDependencies(): Promise<DependencyHealth[]> {
    return [await this.checkDatabase()];
  }

  private async checkDatabase(): Promise<DependencyHealth> {
    const startTime = Date.now();
    try {
      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, 10));
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 1000) {
        return {
          name: 'database',
          status: HealthStatus.DEGRADED,
          responseTime,
          lastChecked: new Date().toISOString(),
          message: 'High latency detected',
        };
      }
      
      return {
        name: 'database',
        status: HealthStatus.HEALTHY,
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: HealthStatus.UNHEALTHY,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkCache(): Promise<DependencyHealth> {
    const startTime = Date.now();
    try {
      await new Promise(resolve => setTimeout(resolve, 5));
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'cache',
        status: HealthStatus.HEALTHY,
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'cache',
        status: HealthStatus.UNHEALTHY,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getSystemHealth(): SystemHealth {
    const used = process.memoryUsage();
    const total = 2 * 1024 * 1024 * 1024; // 2GB
    
    return {
      memory: {
        used: used.heapUsed,
        total,
        percentage: Math.round((used.heapUsed / total) * 100),
      },
      cpu: {
        usage: 15,
        loadAverage: [0.5, 0.7, 0.6],
      },
    };
  }
}
