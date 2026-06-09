import type {
  AdminStatsResponse,
  ApiErrorBody,
  BlocklistMutationResponse,
  BlocklistResponse,
  QrVerdict,
  ScanEventsResponse,
} from './types';
import { ApiError } from './types';

export type ApiClientConfig = {
  baseUrl: string;
  adminKey: string;
};

export function createApiClient(config: ApiClientConfig) {
  const base = config.baseUrl.replace(/\/$/, '');

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('X-Admin-Key', config.adminKey);
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${base}${path}`, { ...init, headers });

    if (!res.ok) {
      let body: ApiErrorBody | undefined;
      try {
        body = (await res.json()) as ApiErrorBody;
      } catch {
        /* empty */
      }
      throw new ApiError(body?.message ?? res.statusText, res.status, body);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }

  return {
    getStats: () => request<AdminStatsResponse>('/v1/admin/stats'),

    getScanEvents: (params: { limit?: number; offset?: number; verdict?: QrVerdict }) => {
      const search = new URLSearchParams();
      if (params.limit != null) search.set('limit', String(params.limit));
      if (params.offset != null) search.set('offset', String(params.offset));
      if (params.verdict) search.set('verdict', params.verdict);
      const qs = search.toString();
      return request<ScanEventsResponse>(`/v1/scan-events${qs ? `?${qs}` : ''}`);
    },

    getBlocklist: (params?: { limit?: number; offset?: number }) => {
      const search = new URLSearchParams();
      if (params?.limit != null) search.set('limit', String(params.limit));
      if (params?.offset != null) search.set('offset', String(params.offset));
      const qs = search.toString();
      return request<BlocklistResponse>(`/v1/admin/blocklist${qs ? `?${qs}` : ''}`);
    },

    addBlocklistEntry: (entry: string) =>
      request<BlocklistMutationResponse>('/v1/admin/blocklist', {
        method: 'POST',
        body: JSON.stringify({ entry }),
      }),

    removeBlocklistEntry: (entry: string) =>
      request<BlocklistMutationResponse>('/v1/admin/blocklist', {
        method: 'DELETE',
        body: JSON.stringify({ entry }),
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
