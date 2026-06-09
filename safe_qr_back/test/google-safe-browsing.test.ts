import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GoogleSafeBrowsingPort } from '../src/services/google-safe-browsing.js';

describe('GoogleSafeBrowsingPort', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  const port = () =>
    new GoogleSafeBrowsingPort({
      apiKey: 'test-api-key',
      clientId: 'safe-qr-test',
      clientVersion: '0.0.0',
      cacheTtlMs: 60_000,
    });

  it('retorna match quando API encontra ameaça', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [{ threatType: 'SOCIAL_ENGINEERING' }],
      }),
    });

    const match = await port().checkUrl('https://testsafebrowsing.appspot.com/s/phishing.html');
    expect(match).toEqual({ threatType: 'SOCIAL_ENGINEERING' });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('retorna null quando API não encontra ameaça', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const match = await port().checkUrl('https://example.com');
    expect(match).toBeNull();
  });

  it('fail-open em erro HTTP', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'API key invalid',
    });

    const match = await port().checkUrl('https://example.com');
    expect(match).toBeNull();
  });

  it('usa cache na segunda consulta da mesma URL', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const svc = port();
    await svc.checkUrl('https://example.com');
    await svc.checkUrl('https://example.com');
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
