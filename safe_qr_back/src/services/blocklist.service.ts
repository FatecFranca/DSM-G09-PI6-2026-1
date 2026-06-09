import type { BlocklistListOptions, BlocklistRepositoryPort } from './blocklist-repository.port.js';

export class BlocklistService {
  constructor(private readonly repository: BlocklistRepositoryPort) {}

  list(options?: BlocklistListOptions) {
    return this.repository.list(options);
  }

  add(entry: string) {
    return this.repository.add(entry);
  }

  remove(entry: string) {
    return this.repository.remove(entry);
  }
}
