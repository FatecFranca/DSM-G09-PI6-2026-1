import { useQuery } from '@tanstack/react-query';
import { Filter, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import type { QrVerdict } from '../api/types';
import { ApiError } from '../api/types';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { VerdictBadge } from '../components/ui/VerdictBadge';
import { formatDateTime, shortenUserId, truncateMiddle } from '../lib/format';
import { VERDICT_LABELS, VERDICT_ORDER } from '../lib/verdict';

export function EventsPage() {
  const { api } = useAdminAuth();
  const [verdict, setVerdict] = useState<QrVerdict | ''>('');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'scan-events', verdict],
    queryFn: () =>
      api!.getScanEvents({
        limit: 100,
        verdict: verdict || undefined,
      }),
    enabled: Boolean(api),
  });

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Falha ao carregar eventos.';

  return (
    <>
      <TopBar
        title="Eventos de auditoria"
        subtitle="Registros gravados pelos workers em scan_events"
      />

      <div className="flex-1 overflow-y-auto p-8">
        <Card
          title="Filtros"
          action={
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <button
              type="button"
              onClick={() => setVerdict('')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                verdict === ''
                  ? 'bg-accent/20 text-accent-glow'
                  : 'bg-surface-700 text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            {VERDICT_ORDER.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVerdict(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  verdict === v
                    ? 'bg-accent/20 text-accent-glow'
                    : 'bg-surface-700 text-slate-400 hover:text-white'
                }`}
              >
                {VERDICT_LABELS[v]}
              </button>
            ))}
          </div>
        </Card>

        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : isError ? (
            <Card title="Erro">
              <p className="text-sm text-verdict-unsafe">{errorMessage}</p>
            </Card>
          ) : !data?.items.length ? (
            <EmptyState
              icon={Filter}
              title="Nenhum evento"
              description={
                verdict
                  ? `Nenhum registro com veredito "${VERDICT_LABELS[verdict]}".`
                  : 'Escaneie um QR no app mobile para gerar eventos de auditoria.'
              }
            />
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/8 bg-surface-900/60 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4 font-medium">Quando</th>
                      <th className="px-5 py-4 font-medium">Veredito</th>
                      <th className="px-5 py-4 font-medium">Host</th>
                      <th className="px-5 py-4 font-medium">Digest</th>
                      <th className="px-5 py-4 font-medium">Usuário</th>
                      <th className="px-5 py-4 font-medium">Plataforma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {data.items.map((event) => (
                      <tr
                        key={event.eventId}
                        className="transition-colors hover:bg-white/3"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-slate-300">
                          {formatDateTime(event.occurredAt)}
                        </td>
                        <td className="px-5 py-4">
                          <VerdictBadge verdict={event.verdict} size="sm" />
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-300">
                          {event.parsed.host ?? '—'}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {truncateMiddle(event.contentDigest, 20)}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                          {shortenUserId(event.idUser)}
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          {event.client.platform ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer className="border-t border-white/8 px-5 py-3 text-xs text-slate-500">
                {data.total} evento(s) no total
              </footer>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
