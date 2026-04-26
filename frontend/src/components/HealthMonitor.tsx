import React from 'react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { StatusBadge } from './StatusBadge';
import './HealthMonitor.css';

export const HealthMonitor: React.FC = () => {
  const {
    data,
    loading,
    error,
    isHealthy,
    isDegraded,
    isUnhealthy,
    healthScore,
    lastFetchTime,
    refresh,
  } = useHealthCheck({ interval: 30000 });

  if (loading && !data) {
    return (
      <div className="health-monitor loading" data-testid="health-monitor">
        <div className="loading-spinner">Loading health status...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="health-monitor error" data-testid="health-monitor">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error.message}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="health-monitor" data-testid="health-monitor">
      <div className="health-header">
        <h2>System Health</h2>
        <div className="health-actions">
          <button onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div
        className={`health-status ${isHealthy ? 'healthy' : isDegraded ? 'warning' : 'error'}`}
        data-testid="health-status"
      >
        <StatusBadge status={data.status} showIcon />
        <span className="health-score">Score: {healthScore}/100</span>
      </div>

      <div className="health-metrics">
        <div className="metric">
          <label>Response Time</label>
          <value>{data.responseTime}ms</value>
        </div>
        <div className="metric">
          <label>Uptime</label>
          <value>{formatUptime(data.uptime)}</value>
        </div>
        <div className="metric">
          <label>Version</label>
          <value>{data.version}</value>
        </div>
        <div className="metric">
          <label>Environment</label>
          <value>{data.environment}</value>
        </div>
      </div>

      <div className="system-metrics">
        <h3>System Resources</h3>
        
        <div className="metric-row">
          <label>Memory Usage</label>
          <div className="progress-bar" data-testid="memory-usage-bar">
            <div
              className="progress-fill"
              style={{ width: `${data.system.memory.percentage}%` }}
            />
            <span>
              {formatBytes(data.system.memory.used)} / {formatBytes(data.system.memory.total)}
              ({data.system.memory.percentage}%)
            </span>
          </div>
        </div>

        <div className="metric-row">
          <label>CPU Usage</label>
          <div className="cpu-gauge" data-testid="cpu-usage-gauge">
            <div
              className="cpu-fill"
              style={{ width: `${data.system.cpu.usage}%` }}
            />
            <span>{data.system.cpu.usage}%</span>
          </div>
        </div>
      </div>

      <div className="dependencies">
        <h3>Dependencies</h3>
        <ul>
          {data.dependencies.map((dep) => (
            <li key={dep.name} className={`dependency ${dep.status}`}>
              <span className="dep-name">{dep.name}</span>
              <StatusBadge status={dep.status} />
              <span className="dep-response">{dep.responseTime}ms</span>
              {dep.message && (
                <span className="dep-message">{dep.message}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {lastFetchTime && (
        <div className="last-updated">
          Last updated: {lastFetchTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
