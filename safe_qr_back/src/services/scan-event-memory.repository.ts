import type { QrVerdictName } from '../models/qr-verdict.js';
import type { ScanEventModel, ScanEventStats } from '../models/scan-event.model.js';
import type { ScanEventListOptions, ScanEventRepositoryPort } from './scan-event-repository.port.js';

const EMPTY_STATS = (): ScanEventStats => ({
  total: 0,
  byVerdict: { safe: 0, suspicious: 0, unsafe: 0, unknown: 0 },
});

/**
 * Repositório em memória — testes e dev sem credenciais Firebase.
 */
export class InMemoryScanEventRepository implements ScanEventRepositoryPort {
  constructor(private readonly seed: ScanEventModel[] = defaultSeed()) {}

  async list(options: ScanEventListOptions) {
    const filtered = options.verdict
      ? this.seed.filter((item) => item.verdict === options.verdict)
      : [...this.seed];
    const sorted = filtered.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const items = sorted.slice(options.offset, options.offset + options.limit);
    return { items, total: sorted.length };
  }

  async stats(): Promise<ScanEventStats> {
    const stats = EMPTY_STATS();
    for (const item of this.seed) {
      stats.byVerdict[item.verdict] += 1;
      stats.total += 1;
    }
    return stats;
  }
}

function defaultSeed(): ScanEventModel[] {
  return [
    {
      eventId: 'evt-safe-001',
      eventType: 'qr.analyzed',
      schemaVersion: '1',
      source: 'safe-qr-api',
      correlationId: 'req-001',
      occurredAt: '2026-06-08T20:00:00.000Z',
      idUser: 'user-demo-1',
      contentDigest: 'abc123def4567890',
      rawByteLength: 24,
      verdict: 'safe',
      safeToOpen: true,
      reasonCodes: ['HTTPS_OK'],
      reasonsCount: 1,
      parsed: { type: 'url', scheme: 'https', host: 'example.com' },
      client: { platform: 'android', appVersion: '1.0.0' },
      analysisDurationMs: 42,
    },
    {
      eventId: 'evt-unsafe-002',
      eventType: 'qr.analyzed',
      schemaVersion: '1',
      source: 'safe-qr-api',
      correlationId: 'req-002',
      occurredAt: '2026-06-08T19:30:00.000Z',
      idUser: 'user-demo-2',
      contentDigest: 'fedcba0987654321',
      rawByteLength: 31,
      verdict: 'unsafe',
      safeToOpen: false,
      reasonCodes: ['BLOCKLIST_MATCH'],
      reasonsCount: 2,
      parsed: { type: 'url', scheme: 'https', host: 'clone-bank.com' },
      client: { platform: 'ios', appVersion: '1.0.0' },
      analysisDurationMs: 55,
    },
    {
      eventId: 'evt-suspicious-003',
      eventType: 'qr.analyzed',
      schemaVersion: '1',
      source: 'safe-qr-api',
      correlationId: 'req-003',
      occurredAt: '2026-06-08T18:00:00.000Z',
      idUser: 'user-demo-3',
      contentDigest: '1122334455667788',
      rawByteLength: 18,
      verdict: 'suspicious' as QrVerdictName,
      safeToOpen: false,
      reasonCodes: ['SHORTENER'],
      reasonsCount: 1,
      parsed: { type: 'url', scheme: 'https', host: 'bit.ly' },
      client: { platform: 'android', appVersion: '1.0.0' },
      analysisDurationMs: 38,
    },
  ];
}
