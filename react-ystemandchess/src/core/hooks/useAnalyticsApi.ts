import { useState, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import { environment } from '../../environments/environment';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetch: (path: string) => Promise<T | null>;
}

export function useAnalyticsApi<T>(): ApiState<T> {
  const [cookies] = useCookies(['login']);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (path: string): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${environment.urls.middlewareURL}${path}`, {
        headers: { Authorization: `Bearer ${cookies.login}` },
      });
      if (res.status === 401 || res.status === 403) {
        throw new Error('Access denied');
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json: T = await res.json();
      setData(json);
      return json;
    } catch (e: any) {
      setError(e.message ?? 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [cookies.login]);

  return { data, loading, error, fetch: fetchData };
}
