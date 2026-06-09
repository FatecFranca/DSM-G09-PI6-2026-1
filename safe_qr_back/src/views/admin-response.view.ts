import type { BlocklistListResult } from '../services/blocklist-repository.port.js';
import type { ScanEventListResult, ScanEventModel, ScanEventStats } from '../models/scan-event.model.js';

export function toScanEventsListResponseJson(result: ScanEventListResult) {
  return {
    items: result.items.map(toScanEventJson),
    total: result.total,
  };
}

export function toScanEventJson(item: ScanEventModel) {
  return {
    eventId: item.eventId,
    eventType: item.eventType,
    schemaVersion: item.schemaVersion,
    source: item.source,
    correlationId: item.correlationId,
    occurredAt: item.occurredAt,
    idUser: item.idUser,
    contentDigest: item.contentDigest,
    rawByteLength: item.rawByteLength,
    verdict: item.verdict,
    safeToOpen: item.safeToOpen,
    reasonCodes: item.reasonCodes,
    reasonsCount: item.reasonsCount,
    parsed: item.parsed,
    client: item.client,
    analysisDurationMs: item.analysisDurationMs,
  };
}

export function toAdminStatsResponseJson(input: {
  scanEvents: ScanEventStats;
  blocklist: BlocklistListResult;
  api: { status: string; service: string; version: string };
}) {
  return {
    api: input.api,
    scanEvents: {
      total: input.scanEvents.total,
      byVerdict: input.scanEvents.byVerdict,
    },
    blocklist: {
      total: input.blocklist.total,
    },
  };
}

export function toBlocklistResponseJson(result: BlocklistListResult) {
  return {
    entries: result.entries,
    total: result.total,
  };
}

export function toBlocklistMutationResponseJson(input: { entry: string; action: 'added' | 'removed' | 'unchanged' }) {
  return input;
}
