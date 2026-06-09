import { getFirestore, type Timestamp } from 'firebase-admin/firestore';

import { ensureFirebaseApp } from '../lib/firebase-admin.js';
import type { QrVerdictName } from '../models/qr-verdict.js';
import type { ScanEventModel, ScanEventStats } from '../models/scan-event.model.js';
import type { ScanEventListOptions, ScanEventRepositoryPort } from './scan-event-repository.port.js';

const VERDICTS: QrVerdictName[] = ['safe', 'suspicious', 'unsafe', 'unknown'];

export type FirestoreScanEventConfig = {
  collection: string;
};

export class FirestoreScanEventRepository implements ScanEventRepositoryPort {
  constructor(private readonly cfg: FirestoreScanEventConfig) {}

  private db() {
    ensureFirebaseApp();
    return getFirestore();
  }

  private collection() {
    return this.db().collection(this.cfg.collection);
  }

  async list(options: ScanEventListOptions) {
    const col = this.collection();

    if (!options.verdict) {
      const countSnap = await col.count().get();
      const total = countSnap.data().count;
      const snap = await col
        .orderBy('occurredAt', 'desc')
        .offset(options.offset)
        .limit(options.limit)
        .get();
      const items = snap.docs.map((doc) => toScanEventModel(doc.id, doc.data()));
      return { items, total };
    }

    // Filtro por verdict: evita índice composto Firestore (where + orderBy em campos diferentes).
    const filtered = col.where('verdict', '==', options.verdict);
    const countSnap = await filtered.count().get();
    const total = countSnap.data().count;
    if (total === 0) {
      return { items: [], total: 0 };
    }

    const fetchCap = 500;
    const snap = await filtered.limit(fetchCap).get();
    const sorted = snap.docs
      .map((doc) => toScanEventModel(doc.id, doc.data()))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const items = sorted.slice(options.offset, options.offset + options.limit);
    return { items, total };
  }

  async stats(): Promise<ScanEventStats> {
    const counts = await Promise.all(
      VERDICTS.map(async (verdict) => {
        const snap = await this.collection().where('verdict', '==', verdict).count().get();
        return [verdict, snap.data().count] as const;
      }),
    );

    const byVerdict = Object.fromEntries(counts) as Record<QrVerdictName, number>;
    const total = Object.values(byVerdict).reduce((sum, n) => sum + n, 0);
    return { total, byVerdict };
  }
}

function toScanEventModel(docId: string, data: Record<string, unknown>): ScanEventModel {
  return {
    eventId: typeof data.eventId === 'string' ? data.eventId : docId,
    eventType: 'qr.analyzed',
    schemaVersion: '1',
    source: typeof data.source === 'string' ? data.source : 'safe-qr-api',
    correlationId: typeof data.correlationId === 'string' ? data.correlationId : '',
    occurredAt: timestampToIso(data.occurredAt),
    idUser: typeof data.idUser === 'string' ? data.idUser : null,
    contentDigest: typeof data.contentDigest === 'string' ? data.contentDigest : '',
    rawByteLength: typeof data.rawByteLength === 'number' ? data.rawByteLength : 0,
    verdict: (typeof data.verdict === 'string' ? data.verdict : 'unknown') as ScanEventModel['verdict'],
    safeToOpen: data.safeToOpen === true,
    reasonCodes: Array.isArray(data.reasonCodes)
      ? data.reasonCodes.filter((v): v is string => typeof v === 'string')
      : [],
    reasonsCount: typeof data.reasonsCount === 'number' ? data.reasonsCount : 0,
    parsed: isRecord(data.parsed) ? data.parsed : {},
    client: isRecord(data.client) ? data.client : {},
    analysisDurationMs: typeof data.analysisDurationMs === 'number' ? data.analysisDurationMs : 0,
  };
}

function timestampToIso(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date(0).toISOString();
}

function isRecord(value: unknown): value is Record<string, string | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
