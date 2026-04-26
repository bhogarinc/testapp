/**
 * useApiClient Hook Tests
 * 
 * Tests for the API client hook.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useApiClient } from '../useApiClient';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('useApiClient', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() =>
      useApiClient({ url: '/api/v1/info' })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toMatchObject({
      name: 'TestApp API',
      version: expect.any(String),
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle GET request', async () => {
    const { result } = renderHook(() =>
      useApiClient({ url: '/api/v1/health', method: 'GET' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveProperty('status');
  });

  it('should handle request errors', async () => {
    server.use(
      http.get('*/error-endpoint', () => {
        return HttpResponse.json(
          { error: 'Not Found' },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() =>
      useApiClient({ url: '/api/v1/error-endpoint' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('should handle network errors', async () => {
    server.use(
      http.get('*/network-error', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() =>
      useApiClient({ url: '/api/v1/network-error' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
  });

  it('should allow manual refetch', async () => {
    const { result } = renderHook(() =>
      useApiClient({ url: '/api/v1/info', manual: true })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();

    result.current.execute();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
  });

  it('should support request cancellation', async () => {
    const { result, unmount } = renderHook(() =>
      useApiClient({ url: '/api/v1/info' })
    );

    unmount();

    // Should not throw or cause memory leaks
    expect(result.current.loading).toBe(true);
  });

  it('should update loading state correctly', async () => {
    const loadingStates: boolean[] = [];

    const { result } = renderHook(() => {
      const hook = useApiClient({ url: '/api/v1/info' });
      loadingStates.push(hook.loading);
      return hook;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(loadingStates).toContain(true);
    expect(loadingStates).toContain(false);
  });

  it('should cache responses when enabled', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/cached-endpoint', () => {
        requestCount++;
        return HttpResponse.json({ count: requestCount });
      })
    );

    const { result, rerender } = renderHook(
      ({ cache }) => useApiClient({ url: '/api/v1/cached-endpoint', cache }),
      { initialProps: { cache: true } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstCount = result.current.data?.count;

    // Rerender with same cache key
    rerender({ cache: true });

    // Should not make another request
    expect(result.current.data?.count).toBe(firstCount);
    expect(requestCount).toBe(1);
  });
});
