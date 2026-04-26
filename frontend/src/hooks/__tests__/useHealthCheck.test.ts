/**
 * useHealthCheck Hook Tests
 * 
 * Tests for the health check polling hook.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useHealthCheck } from '../useHealthCheck';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { HealthStates, HealthStatus } from '../../test/factories/health.factory';

describe('useHealthCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch health status on mount', async () => {
    const { result } = renderHook(() => useHealthCheck());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.status).toBe(HealthStatus.HEALTHY);
  });

  it('should poll health status at specified interval', async () => {
    const onHealthChange = vi.fn();
    const { result } = renderHook(() =>
      useHealthCheck({ interval: 5000, onHealthChange })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(onHealthChange).toHaveBeenCalledTimes(1);

    // Advance timers to trigger next poll
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(onHealthChange).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle degraded status', async () => {
    server.use(
      http.get('*/health', () => {
        return HttpResponse.json(HealthStates.degraded());
      })
    );

    const { result } = renderHook(() => useHealthCheck());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.status).toBe(HealthStatus.DEGRADED);
    expect(result.current.isDegraded).toBe(true);
  });

  it('should handle unhealthy status', async () => {
    server.use(
      http.get('*/health', () => {
        return HttpResponse.json(HealthStates.unhealthy(), { status: 503 });
      })
    );

    const { result } = renderHook(() => useHealthCheck());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.status).toBe(HealthStatus.UNHEALTHY);
    expect(result.current.isUnhealthy).toBe(true);
  });

  it('should handle fetch errors', async () => {
    server.use(
      http.get('*/health', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useHealthCheck());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isUnhealthy).toBe(true);
  });

  it('should allow manual refresh', async () => {
    const { result } = renderHook(() => useHealthCheck({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstFetchTime = result.current.lastFetchTime;

    // Wait a bit and then refresh
    vi.advanceTimersByTime(1000);
    result.current.refresh();

    await waitFor(() => {
      expect(result.current.lastFetchTime).not.toBe(firstFetchTime);
    });
  });

  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => useHealthCheck());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    unmount();

    // After unmount, polling should stop
    vi.advanceTimersByTime(10000);
    // No error should be thrown
  });

  it('should calculate health score correctly', async () => {
    const { result } = renderHook(() => useHealthCheck());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.current.healthScore).toBeLessThanOrEqual(100);
  });

  it('should track last successful fetch', async () => {
    const { result } = renderHook(() => useHealthCheck());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lastFetchTime).toBeInstanceOf(Date);
  });

  it('should expose loading states', async () => {
    const { result } = renderHook(() => useHealthCheck());

    expect(result.current.loading).toBe(true);
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
  });
});
