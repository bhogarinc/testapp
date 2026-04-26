import React from 'react';
import { HealthMonitor } from './HealthMonitor';
import { ApiInfoPanel } from './ApiInfoPanel';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>TestApp Dashboard</h1>
        <nav role="navigation">
          <ul>
            <li><a href="#health">Health</a></li>
            <li><a href="#api">API Info</a></li>
          </ul>
        </nav>
      </header>

      <main className="dashboard-content">
        <section id="health" className="dashboard-section">
          <HealthMonitor />
        </section>

        <section id="api" className="dashboard-section">
          <ApiInfoPanel />
        </section>
      </main>

      <footer className="dashboard-footer" role="contentinfo">
        <p>TestApp &copy; 2024</p>
      </footer>
    </div>
  );
};
