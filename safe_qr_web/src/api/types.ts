export type QrVerdict = 'safe' | 'suspicious' | 'unsafe' | 'unknown';

export type ScanEvent = {
  eventId: string;
  eventType: 'qr.analyzed';
  schemaVersion: '1';
  source: string;
  correlationId: string;
  occurredAt: string;
  idUser: string | null;
  contentDigest: string;
  rawByteLength: number;
  verdict: QrVerdict;
  safeToOpen: boolean;
  reasonCodes: string[];
  reasonsCount: number;
  parsed: {
    type?: string;
    scheme?: string;
    host?: string;
  };
  client: {
    platform?: string;
    appVersion?: string;
  };
  analysisDurationMs: number;
};

export type ScanEventsResponse = {
  items: ScanEvent[];
  total: number;
};

export type AdminStatsResponse = {
  api: {
    status: string;
    service: string;
    version: string;
  };
  scanEvents: {
    total: number;
    byVerdict: Record<QrVerdict, number>;
  };
  blocklist: {
    total: number;
  };
};

export type BlocklistResponse = {
  entries: string[];
  total: number;
};

export type BlocklistMutationResponse = {
  entry: string;
  action: 'added' | 'removed' | 'unchanged';
};

export type ApiErrorBody = {
  error: string;
  message: string;
  requestId?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
