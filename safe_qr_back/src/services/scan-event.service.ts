import type { ScanEventListOptions } from '../models/scan-event.model.js';
import type { ScanEventRepositoryPort } from './scan-event-repository.port.js';

export class ScanEventService {
  constructor(private readonly repository: ScanEventRepositoryPort) {}

  list(options: ScanEventListOptions) {
    return this.repository.list(options);
  }

  stats() {
    return this.repository.stats();
  }
}
