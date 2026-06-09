import type { QrVerdict } from '../api/types';

export const VERDICT_LABELS: Record<QrVerdict, string> = {
  safe: 'Seguro',
  suspicious: 'Suspeito',
  unsafe: 'Inseguro',
  unknown: 'Desconhecido',
};

export const VERDICT_ORDER: QrVerdict[] = ['safe', 'suspicious', 'unsafe', 'unknown'];

export function verdictTone(verdict: QrVerdict): string {
  switch (verdict) {
    case 'safe':
      return 'safe';
    case 'suspicious':
      return 'suspicious';
    case 'unsafe':
      return 'unsafe';
    default:
      return 'unknown';
  }
}
