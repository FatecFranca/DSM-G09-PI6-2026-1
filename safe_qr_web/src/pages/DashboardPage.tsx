import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, HelpCircle, ShieldBan } from 'lucide-react';

import { useAdminAuth } from '../auth/AdminAuthContext';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { VerdictBadge } from '../components/ui/VerdictBadge';
import { formatNumber } from '../lib/format';
import { VERDICT_ORDER } from '../lib/verdict';
import type { QrVerdict } from '../api/types';

const verdictIcons: Record<QrVerdict, typeof CheckCircle2> = {
  safe: CheckCircle2,
  suspicious: AlertTriangle,
  unsafe: AlertTriangle,
  unknown: HelpCircle,
};

export function DashboardPage() {
  const { api } = useAdminAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api!.getStats(),
    enabled: Boolean(api),
  });

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Visão geral do ecossistema Safe QR"
      />

      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : isError || !data ? (
          <Card title="Erro ao carregar">
            <p className="text-sm text-verdict-unsafe">Não foi possível obter as estatísticas.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Activity}
                label="Total de eventos"
                value={formatNumber(data.scanEvents.total)}
                accent="text-accent-glow"
              />
              <StatCard
                icon={ShieldBan}
                label="Blocklist"
                value={formatNumber(data.blocklist.total)}
                accent="text-verdict-unsafe"
              />
              <StatCard
                icon={CheckCircle2}
                label="API"
                value={data.api.version}
                accent="text-verdict-safe"
                sub={`${data.api.service} · ${data.api.status}`}
              />
              <StatCard
                icon={AlertTriangle}
                label="Inseguros"
                value={formatNumber(data.scanEvents.byVerdict.unsafe)}
                accent="text-verdict-unsafe"
              />
            </div>

            <Card title="Distribuição por veredito" subtitle="Eventos de auditoria (scan_events)">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {VERDICT_ORDER.map((verdict) => {
                  const Icon = verdictIcons[verdict];
                  const count = data.scanEvents.byVerdict[verdict] ?? 0;
                  const pct =
                    data.scanEvents.total > 0
                      ? Math.round((count / data.scanEvents.total) * 100)
                      : 0;

                  return (
                    <div
                      key={verdict}
                      className="rounded-xl border border-white/6 bg-surface-900/50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <VerdictBadge verdict={verdict} />
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <p className="text-2xl font-bold text-white">{formatNumber(count)}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-700">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{pct}% do total</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="glass-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon className={`h-5 w-5 ${accent}`} strokeWidth={1.75} />
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
      {sub ? <p className="mt-1 font-mono text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
