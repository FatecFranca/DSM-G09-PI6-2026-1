import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldBan, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAdminAuth } from '../auth/AdminAuthContext';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import { clampPage, DEFAULT_PAGE_SIZE, slicePage } from '../lib/pagination';

export function BlocklistPage() {
  const { api } = useAdminAuth();
  const queryClient = useQueryClient();
  const [newEntry, setNewEntry] = useState('');
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'blocklist'],
    queryFn: () => api!.getBlocklist({ limit: 500 }),
    enabled: Boolean(api),
  });

  const total = data?.total ?? data?.entries.length ?? 0;
  const pagedEntries = data ? slicePage(data.entries, page, DEFAULT_PAGE_SIZE) : [];

  useEffect(() => {
    if (data) {
      setPage((current) => clampPage(current, total, DEFAULT_PAGE_SIZE));
    }
  }, [data, total]);

  const addMutation = useMutation({
    mutationFn: (entry: string) => api!.addBlocklistEntry(entry),
    onSuccess: () => {
      setNewEntry('');
      setFormError('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blocklist'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (entry: string) => api!.removeBlocklistEntry(entry),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blocklist'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newEntry.trim();
    if (!trimmed) {
      setFormError('Informe uma palavra-chave ou host.');
      return;
    }
    addMutation.mutate(trimmed);
  }

  return (
    <>
      <TopBar
        title="Blocklist"
        subtitle="Palavras-chave ou domínios suspeitos (suspicious_hosts/clones)"
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <Card title="Adicionar entrada" className="lg:col-span-2">
            <form onSubmit={handleAdd} className="space-y-4">
              <Input
                label="Palavra-chave ou host"
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="amaz0n, magasine ou amaz0n.com.br"
                error={formError}
              />
              <Button type="submit" loading={addMutation.isPending} className="w-full">
                <Plus className="h-4 w-4" />
                Adicionar à blocklist
              </Button>
            </form>
          </Card>

          <Card
            title={`Entradas (${total})`}
            subtitle="Palavras-chave que forçam veredito inseguro na análise"
            className="lg:col-span-3"
            action={
              total > 0 ? (
                <Pagination
                  variant="header"
                  page={page}
                  pageSize={DEFAULT_PAGE_SIZE}
                  total={total}
                  onPageChange={setPage}
                />
              ) : undefined
            }
          >
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : isError ? (
              <p className="text-sm text-verdict-unsafe">Falha ao carregar blocklist.</p>
            ) : !pagedEntries.length ? (
              <EmptyState
                icon={ShieldBan}
                title="Blocklist vazia"
                description="Adicione domínios clonados ou suspeitos para bloquear na análise."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/6">
                <ul className="divide-y divide-white/6">
                  {pagedEntries.map((entry) => (
                    <li
                      key={entry}
                      className="flex items-center justify-between gap-4 bg-surface-900/50 px-4 py-3"
                    >
                      <span className="truncate font-mono text-sm text-slate-200">{entry}</span>
                      <Button
                        variant="danger"
                        onClick={() => removeMutation.mutate(entry)}
                        loading={removeMutation.isPending && removeMutation.variables === entry}
                        aria-label={`Remover ${entry}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={page}
                  pageSize={DEFAULT_PAGE_SIZE}
                  total={total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
