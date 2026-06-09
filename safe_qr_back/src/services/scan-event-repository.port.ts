import type { ScanEventListOptions, ScanEventListResult, ScanEventStats } from '../models/scan-event.model.js';

export type { ScanEventListOptions, ScanEventListResult, ScanEventStats };

export interface ScanEventRepositoryPort {
  list(options: ScanEventListOptions): Promise<ScanEventListResult>;
  stats(): Promise<ScanEventStats>;
}
