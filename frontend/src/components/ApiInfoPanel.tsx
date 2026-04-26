import React from 'react';
import { useApiInfo } from '../hooks/useApiInfo';
import './ApiInfoPanel.css';

export const ApiInfoPanel: React.FC = () => {
  const { data, loading, error } = useApiInfo();

  if (loading) {
    return (
      <div className="api-info loading" data-testid="api-info">
        <div className="loading-spinner">Loading API info...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="api-info error" data-testid="api-info">
        <div className="error-message">{error.message}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="api-info" data-testid="api-info">
      <h2>API Information</h2>
      
      <div className="info-grid">
        <div className="info-item">
          <label>Name</label>
          <value>{data.name}</value>
        </div>
        
        <div className="info-item">
          <label>Version</label>
          <value>{data.version}</value>
        </div>
        
        <div className="info-item">
          <label>Description</label>
          <value>{data.description}</value>
        </div>
        
        <div className="info-item">
          <label>Environment</label>
          <value>{data.environment}</value>
        </div>
        
        <div className="info-item">
          <label>Base URL</label>
          <value>{data.baseUrl}</value>
        </div>
        
        <div className="info-item">
          <label>Documentation</label>
          <value>
            <a href={data.documentation}>View Docs</a>
          </value>
        </div>
      </div>
    </div>
  );
};
