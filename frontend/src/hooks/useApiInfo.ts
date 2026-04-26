import { useApiClient } from './useApiClient';

interface ApiInfo {
  name: string;
  version: string;
  description: string;
  environment: string;
  baseUrl: string;
  documentation: string;
}

interface UseApiInfoReturn {
  data: ApiInfo | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useApiInfo(): UseApiInfoReturn {
  const { data, loading, error, refetch } = useApiClient<ApiInfo>({
    url: '/api/v1/info',
    method: 'GET',
  });
  
  return {
    data,
    loading,
    error,
    refetch,
  };
}
