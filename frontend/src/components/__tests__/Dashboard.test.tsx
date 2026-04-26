/**
 * Dashboard Component Tests
 * 
 * Tests for the main dashboard component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Dashboard } from '../Dashboard';

describe('Dashboard', () => {
  it('renders dashboard header', () => {
    render(<Dashboard />);
    expect(screen.getByText(/testapp dashboard/i)).toBeInTheDocument();
  });

  it('renders navigation menu', () => {
    render(<Dashboard />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders health monitor section', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('health-monitor')).toBeInTheDocument();
    });
  });

  it('renders API info section', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('api-info')).toBeInTheDocument();
    });
  });

  it('displays version information', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/version/i)).toBeInTheDocument();
    });
  });

  it('renders footer with environment info', () => {
    render(<Dashboard />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
