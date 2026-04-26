import React from 'react';
import './StatusBadge.css';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = false,
}) => {
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  
  const getIcon = () => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'unhealthy':
        return '✗';
      default:
        return '?';
    }
  };
  
  return (
    <span className={`status-badge ${status}`}>
      {showIcon && (
        <span className="status-icon" data-testid="status-icon">
          {getIcon()}
        </span>
      )}
      <span className="status-label">{displayLabel}</span>
    </span>
  );
};
