import type { QrVerdict } from '../../api/types';
import { VERDICT_LABELS, verdictTone } from '../../lib/verdict';

const toneClasses: Record<string, string> = {
  safe: 'bg-verdict-safe/15 text-verdict-safe ring-verdict-safe/30',
  suspicious: 'bg-verdict-suspicious/15 text-verdict-suspicious ring-verdict-suspicious/30',
  unsafe: 'bg-verdict-unsafe/15 text-verdict-unsafe ring-verdict-unsafe/30',
  unknown: 'bg-verdict-unknown/15 text-verdict-unknown ring-verdict-unknown/30',
};

type VerdictBadgeProps = {
  verdict: QrVerdict;
  size?: 'sm' | 'md';
};

export function VerdictBadge({ verdict, size = 'md' }: VerdictBadgeProps) {
  const tone = verdictTone(verdict);
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${toneClasses[tone]} ${sizeClass}`}
    >
      {VERDICT_LABELS[verdict]}
    </span>
  );
}
