import type { SafeBrowsingMatch, SafeBrowsingThreatTypeName } from './safe-browsing-port.js';

const API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
const REQUEST_TIMEOUT_MS = 5_000;

const THREAT_TYPES: SafeBrowsingThreatTypeName[] = [
  'MALWARE',
  'SOCIAL_ENGINEERING',
  'UNWANTED_SOFTWARE',
  'POTENTIALLY_HARMFUL_APPLICATION',
];

export type GoogleSafeBrowsingConfig = {
  apiKey: string;
  clientId: string;
  clientVersion: string;
  cacheTtlMs: number;
};

type ThreatMatchResponse = {
  matches?: Array<{ threatType?: string }>;
};

/**
 * Google Safe Browsing API v4 — `threatMatches:find`.
 * Fail-open: erros de rede ou API retornam `null` (heurística segue).
 */
export class GoogleSafeBrowsingPort {
  private cache = new Map<string, { match: SafeBrowsingMatch | null; fetchedAt: number }>();

  constructor(private readonly cfg: GoogleSafeBrowsingConfig) {}

  async checkUrl(url: string): Promise<SafeBrowsingMatch | null> {
    const key = url.trim();
    if (!key) {
      return null;
    }

    const cached = this.cache.get(key);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < this.cfg.cacheTtlMs) {
      return cached.match;
    }

    try {
      const match = await this.fetchThreat(key);
      this.cache.set(key, { match, fetchedAt: now });
      return match;
    } catch (err) {
      console.warn('[safe_browsing] Consulta indisponível; ignorando.', err);
      return null;
    }
  }

  private async fetchThreat(url: string): Promise<SafeBrowsingMatch | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}?key=${encodeURIComponent(this.cfg.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          client: {
            clientId: this.cfg.clientId,
            clientVersion: this.cfg.clientVersion,
          },
          threatInfo: {
            threatTypes: THREAT_TYPES,
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Safe Browsing HTTP ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = (await res.json()) as ThreatMatchResponse;
      const threatType = data.matches?.[0]?.threatType;
      if (!threatType || !THREAT_TYPES.includes(threatType as SafeBrowsingThreatTypeName)) {
        return null;
      }

      return { threatType: threatType as SafeBrowsingThreatTypeName };
    } finally {
      clearTimeout(timer);
    }
  }
}
