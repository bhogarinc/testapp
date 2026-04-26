import { useState, useEffect, useCallback, useRef } from 'react';

export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
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
    status: string;
    responseTime: number;
    lastChecked: string;
    message?: string;
  }>;
}

interface UseHealthCheckOptions {
  interval?: number;
  autoRefresh?: boolean;
  onHealthChange?: (health: HealthData) => void;
}

interface UseHealthCheckReturn {
  data: HealthData | null;
  loading: boolean;
  error: Error | null;
  isHealthy: boolean;
  isDegraded: boolean;
  isUnhealthy: boolean;
  isLoading: boolean;
  healthScore: number;
  lastFetchTime: Date | null;
  refresh: () => void;
}

export function useHealthCheck(options: UseHealthCheckOptions = {}): UseHealthCheckReturn {
  const { interval = 30000, autoRefresh = true, onHealthChange } = options;
  
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchHealth = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      const response = await fetch('/api/v1/health', {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const healthData: HealthData = await response.json();
      setData(healthData);
      setError(null);
      setLastFetchTime(new Date());
      
      if (onHealthChange) {
        onHealthChange(healthData);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [onHealthChange]);
  
  const refresh = useCallback(() => {
    fetchHealth();
  }, [fetchHealth]);
  
  useEffect(() => {
    fetchHealth();
    
    if (autoRefresh && interval > 0) {
      intervalRef.current = setInterval(fetchHealth, interval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchHealth, autoRefresh, interval]);
  
  const isHealthy = data?.status === 'healthy';
  const isDegraded = data?.status === 'degraded';
  const isUnhealthy = data?.status === 'unhealthy' || error !== null;
  
  const healthScore = data ? calculateHealthScore(data) : 0;
  
  return {
    data,
    loading,
    error,
    isHealthy,
    isDegraded,
    isUnhealthy,
    isLoading: loading,
    healthScore,
    lastFetchTime,
    refresh,
  };
}

function calculateHealthScore(health: HealthData): number {
  let score = 100;
  
  // Deduct for overall status
  if (health.status === 'degraded') score -= 30;
  if (health.status === 'unhealthy') score -= 60;
  
  // Deduct for high memory usage
  if (health.system.memory.percentage > 80) score -= 10;
  if (health.system.memory.percentage > 90) score -= 10;
  
  // Deduct for high CPU usage
  if (health.system.cpu.usage > 70) score -= 10;
  if (health.system.cpu.usage > 90) score -= 10;
  
  // Deduct for slow response time
  if (health.responseTime > 1000) score -= 10;
  if (health.responseTime > 2000) score -= 10;
  
  // Deduct for unhealthy dependencies
  const unhealthyDeps = health.dependencies.filter(
    d => d.status === 'unhealthy'
  ).length;
  const degradedDeps = health.dependencies.filter(
    d => d.status === 'degraded'
  ).length;
  
  score -= unhealthyDeps * 15;
  score -= degradedDeps * 5;
  
  return Math.max(0, Math.min(100, score));
}
