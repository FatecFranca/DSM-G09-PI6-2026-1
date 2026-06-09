import { describe, expect, it } from 'vitest';

import { QrAnalyzeService } from '../src/services/qr-analyze.service.js';
import type { SafeBrowsingPort } from '../src/services/safe-browsing-port.js';
import { NullSuspiciousHostsPort } from '../src/services/suspicious-hosts-port.js';

class MockSafeBrowsing implements SafeBrowsingPort {
  constructor(private readonly threatUrl: string) {}

  async checkUrl(url: string) {
    if (url === this.threatUrl) {
      return { threatType: 'SOCIAL_ENGINEERING' as const };
    }
    return null;
  }
}

describe('QrAnalyzeService + Safe Browsing (mock)', () => {
  it('URL na Safe Browsing → unsafe', async () => {
    const url = 'https://testsafebrowsing.appspot.com/s/phishing.html';
    const svc = new QrAnalyzeService(
      new NullSuspiciousHostsPort(),
      new MockSafeBrowsing(url),
    );
    const r = await svc.evaluateAsync(url);
    expect(r.verdict).toBe('unsafe');
    expect(r.safeToOpen).toBe(false);
    expect(r.reasons.some((x) => x.includes('Safe Browsing'))).toBe(true);
  });

  it('URL limpa fora da Safe Browsing → heurística normal', async () => {
    const svc = new QrAnalyzeService(
      new NullSuspiciousHostsPort(),
      new MockSafeBrowsing('https://evil-only.test'),
    );
    const r = await svc.evaluateAsync('https://example.org');
    expect(r.verdict).toBe('safe');
    expect(r.safeToOpen).toBe(true);
  });
});
