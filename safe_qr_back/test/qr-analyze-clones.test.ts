import { describe, expect, it } from 'vitest';

import { QrAnalyzeService } from '../src/services/qr-analyze.service.js';
import { hostnameMatchesBlocklist } from '../src/services/suspicious-hosts-match.js';
import type { SuspiciousHostsPort } from '../src/services/suspicious-hosts-port.js';

class MockSuspiciousHosts implements SuspiciousHostsPort {
  constructor(private readonly patterns: Set<string>) {}
  async isListedHostname(normalizedHost: string): Promise<boolean> {
    return hostnameMatchesBlocklist(normalizedHost, this.patterns);
  }
}

describe('QrAnalyzeService + lista de clones (mock)', () => {
  it('host na lista → unsafe', async () => {
    const svc = new QrAnalyzeService(new MockSuspiciousHosts(new Set(['magasineluiza.com.br'])));
    const r = await svc.evaluateAsync('https://www.magasineluiza.com.br/login');
    expect(r.verdict).toBe('unsafe');
    expect(r.safeToOpen).toBe(false);
    expect(r.reasons.some((x) => x.includes('lista de alertas'))).toBe(true);
    expect(r.parsed).toMatchObject({ type: 'url', host: expect.stringContaining('magasineluiza') });
  });

  it('host fora da lista → heurística normal (safe https)', async () => {
    const svc = new QrAnalyzeService(new MockSuspiciousHosts(new Set(['evil.example'])));
    const r = await svc.evaluateAsync('https://example.org/path');
    expect(r.verdict).toBe('safe');
    expect(r.safeToOpen).toBe(true);
  });

  it('palavra-chave amaz0n bloqueia variante amaz0n.com.br2', async () => {
    const svc = new QrAnalyzeService(new MockSuspiciousHosts(new Set(['amaz0n'])));
    const r = await svc.evaluateAsync('https://amaz0n.com.br2/oferta');
    expect(r.verdict).toBe('unsafe');
    expect(r.safeToOpen).toBe(false);
  });
});
