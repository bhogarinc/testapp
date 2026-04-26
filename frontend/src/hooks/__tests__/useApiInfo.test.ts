/**
 * useApiInfo Hook Tests
 * 
 * Tests for the API information hook.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useApiInfo } from '../useApiInfo';

describe('useApiInfo', () => {
  it('should fetch API info on mount', async () => {
    const { result } = renderHook(() => useApiInfo());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toMatchObject({
      name: 'TestApp API',
      version: expect.any(String),
      description: expect.any(String),
    });
  });

  it('should expose error state', async () => {
    const { result } = renderHook(() => useApiInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it('should allow manual refetch', async () => {
    const { result } = renderHook(() => useApiInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstData = result.current.data;
    
    await result.current.refetch();
    
    expect(result.current.data).toEqual(firstData);
  });
});
