import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApiClient } from '../api/client';
import { ApiError } from '../api/types';

describe('createApiClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('envia X-Admin-Key em todas as requisições', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ api: { status: 'ok' }, scanEvents: { total: 0, byVerdict: {} }, blocklist: { total: 0 } }),
    });

    const client = createApiClient({ baseUrl: 'http://localhost:3000', adminKey: 'secret-key' });
    await client.getStats();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v1/admin/stats',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get('X-Admin-Key')).toBe('secret-key');
  });

  it('lança ApiError em respostas não-ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'UNAUTHORIZED', message: 'Chave inválida' }),
    });

    const client = createApiClient({ baseUrl: 'http://api.test', adminKey: 'bad' });

    const err = await client.getBlocklist().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 401, message: 'Chave inválida' });
  });

  it('monta query string em getBlocklist', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ entries: [], total: 0 }),
    });

    const client = createApiClient({ baseUrl: 'http://api.test/', adminKey: 'k' });
    await client.getBlocklist({ limit: 10, offset: 20 });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://api.test/v1/admin/blocklist?limit=10&offset=20',
    );
  });

  it('monta query string em getScanEvents', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [], total: 0 }),
    });

    const client = createApiClient({ baseUrl: 'http://api.test/', adminKey: 'k' });
    await client.getScanEvents({ limit: 25, verdict: 'unsafe' });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://api.test/v1/scan-events?limit=25&verdict=unsafe',
    );
  });
});
