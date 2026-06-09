import type { BlocklistRepositoryPort } from './blocklist-repository.port.js';

export class BlocklistService {
  constructor(private readonly repository: BlocklistRepositoryPort) {}

  list() {
    return this.repository.list();
  }

  add(entry: string) {
    return this.repository.add(entry);
  }

  remove(entry: string) {
    return this.repository.remove(entry);
  }
}
