/**
 * HealthMonitor Component Tests
 * 
 * Tests for the health monitoring dashboard component.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HealthMonitor } from '../HealthMonitor';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { HealthStates, HealthStatus } from '../../test/factories/health.factory';

describe('HealthMonitor', () => {
  it('renders loading state initially', () => {
    render(<HealthMonitor />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays health status after loading', async () => {
    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
  });

  it('displays system metrics', async () => {
    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/memory/i)).toBeInTheDocument();
    expect(screen.getByText(/cpu/i)).toBeInTheDocument();
  });

  it('displays dependency status', async () => {
    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/database/i)).toBeInTheDocument();
    expect(screen.getByText(/cache/i)).toBeInTheDocument();
  });

  it('shows degraded status with warning styling', async () => {
    server.use(
      http.get('*/health', () => {
        return HttpResponse.json(HealthStates.degraded());
      })
    );

    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText(/degraded/i)).toBeInTheDocument();
    });

    const statusElement = screen.getByTestId('health-status');
    expect(statusElement).toHaveClass('warning');
  });

  it('shows unhealthy status with error styling', async () => {
    server.use(
      http.get('*/health', () => {
        return HttpResponse.json(HealthStates.unhealthy(), { status: 503 });
      })
    );

    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText(/unhealthy/i)).toBeInTheDocument();
    });

    const statusElement = screen.getByTestId('health-status');
    expect(statusElement).toHaveClass('error');
  });

  it('refreshes health status on button click', async () => {
    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(screen.getByText(/refreshing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/refreshing/i)).not.toBeInTheDocument();
    });
  });

  it('displays last updated timestamp', async () => {
    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    server.use(
      http.get('*/health', () => {
        return HttpResponse.error();
      })
    );

    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('displays response time', async () => {
    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/\d+ms/)).toBeInTheDocument();
  });

  it('displays uptime in human readable format', async () => {
    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/uptime/i)).toBeInTheDocument();
  });

  it('renders memory usage bar', async () => {
    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const memoryBar = screen.getByTestId('memory-usage-bar');
    expect(memoryBar).toBeInTheDocument();
  });

  it('renders CPU usage gauge', async () => {
    render(<HealthMonitor />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const cpuGauge = screen.getByTestId('cpu-usage-gauge');
    expect(cpuGauge).toBeInTheDocument();
  });
});
