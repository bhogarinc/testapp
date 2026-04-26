import { useState, useEffect, useCallback, useRef } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface UseApiClientOptions {
  url: string;
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  manual?: boolean;
  cache?: boolean;
}

interface UseApiClientReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  refetch: () => Promise<void>;
}

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useApiClient<T = unknown>(
  options: UseApiClientOptions
): UseApiClientReturn<T> {
  const { url, method = 'GET', body, headers = {}, manual = false, cache: useCache = false } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!manual);
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheKey = `${method}:${url}`;
  
  const execute = useCallback(async () => {
    // Check cache first
    if (useCache && method === 'GET') {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data as T);
        setLoading(false);
        return;
      }
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      
      // Cache the result
      if (useCache && method === 'GET') {
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [url, method, body, headers, useCache, cacheKey]);
  
  const refetch = useCallback(async () => {
    // Clear cache for this request
    cache.delete(cacheKey);
    await execute();
  }, [execute, cacheKey]);
  
  useEffect(() => {
    if (!manual) {
      execute();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute, manual]);
  
  return {
    data,
    loading,
    error,
    execute,
    refetch,
  };
}
