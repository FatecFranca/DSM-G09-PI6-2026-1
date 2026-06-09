import type { QrVerdictName } from './qr-verdict.js';

export type ScanEventParsed = {
  type?: string;
  scheme?: string;
  host?: string;
};

export type ScanEventClient = {
  platform?: string;
  appVersion?: string;
};

export type ScanEventModel = {
  eventId: string;
  eventType: 'qr.analyzed';
  schemaVersion: '1';
  source: string;
  correlationId: string;
  occurredAt: string;
  idUser: string | null;
  contentDigest: string;
  rawByteLength: number;
  verdict: QrVerdictName;
  safeToOpen: boolean;
  reasonCodes: string[];
  reasonsCount: number;
  parsed: ScanEventParsed;
  client: ScanEventClient;
  analysisDurationMs: number;
};

export type ScanEventListOptions = {
  limit: number;
  offset: number;
  verdict?: QrVerdictName;
};

export type ScanEventListResult = {
  items: ScanEventModel[];
  total: number;
};

export type ScanEventStats = {
  total: number;
  byVerdict: Record<QrVerdictName, number>;
};
