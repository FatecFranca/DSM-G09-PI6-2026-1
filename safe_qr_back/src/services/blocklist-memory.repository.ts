import type { BlocklistRepositoryPort } from './blocklist-repository.port.js';

export class InMemoryBlocklistRepository implements BlocklistRepositoryPort {
  private entries: string[];

  constructor(seed: string[] = ['clone-bank.com', 'https://phish-example.net/login']) {
    this.entries = [...seed];
  }

  async list() {
    return { entries: [...this.entries], total: this.entries.length };
  }

  async add(entry: string) {
    const trimmed = entry.trim();
    if (this.entries.some((e) => e.trim().toLowerCase() === trimmed.toLowerCase())) {
      return { added: false };
    }
    this.entries.push(trimmed);
    return { added: true };
  }

  async remove(entry: string) {
    const trimmed = entry.trim().toLowerCase();
    const index = this.entries.findIndex((e) => e.trim().toLowerCase() === trimmed);
    if (index < 0) {
      return { removed: false };
    }
    this.entries.splice(index, 1);
    return { removed: true };
  }
}
