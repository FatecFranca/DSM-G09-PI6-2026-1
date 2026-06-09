import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { ensureFirebaseApp } from '../lib/firebase-admin.js';
import type { BlocklistRepositoryPort } from './blocklist-repository.port.js';

const DOC_PATH = 'suspicious_hosts/clones';

export class FirestoreBlocklistRepository implements BlocklistRepositoryPort {
  private db() {
    ensureFirebaseApp();
    return getFirestore();
  }

  async list(options?: { limit: number; offset: number }) {
    const snap = await this.db().doc(DOC_PATH).get();
    if (!snap.exists) {
      return { entries: [], total: 0 };
    }
    const data = snap.data() as Record<string, unknown> | undefined;
    const urls = Array.isArray(data?.urls)
      ? data.urls.filter((v): v is string => typeof v === 'string')
      : [];
    const total = urls.length;
    if (!options) {
      return { entries: urls, total };
    }
    return { entries: urls.slice(options.offset, options.offset + options.limit), total };
  }

  async add(entry: string) {
    const trimmed = entry.trim();
    const current = await this.list();
    if (current.entries.some((e) => e.trim().toLowerCase() === trimmed.toLowerCase())) {
      return { added: false };
    }

    const ref = this.db().doc(DOC_PATH);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({ urls: [trimmed], updatedAt: FieldValue.serverTimestamp() });
      return { added: true };
    }

    await ref.update({
      urls: FieldValue.arrayUnion(trimmed),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { added: true };
  }

  async remove(entry: string) {
    const trimmed = entry.trim();
    const current = await this.list();
    const match = current.entries.find((e) => e.trim().toLowerCase() === trimmed.toLowerCase());
    if (!match) {
      return { removed: false };
    }

    await this.db().doc(DOC_PATH).update({
      urls: FieldValue.arrayRemove(match),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { removed: true };
  }
}
