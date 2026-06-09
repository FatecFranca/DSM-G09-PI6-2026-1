import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldBan, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useAdminAuth } from '../auth/AdminAuthContext';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';

export function BlocklistPage() {
  const { api } = useAdminAuth();
  const queryClient = useQueryClient();
  const [newEntry, setNewEntry] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'blocklist'],
    queryFn: () => api!.getBlocklist(),
    enabled: Boolean(api),
  });

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
      setFormError('Informe uma URL ou host.');
      return;
    }
    addMutation.mutate(trimmed);
  }

  return (
    <>
      <TopBar
        title="Blocklist"
        subtitle="Domínios suspeitos em suspicious_hosts/clones"
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <Card title="Adicionar entrada" className="lg:col-span-2">
            <form onSubmit={handleAdd} className="space-y-4">
              <Input
                label="URL ou host"
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="exemplo-phish.com ou https://site.clonado/login"
                error={formError}
              />
              <Button type="submit" loading={addMutation.isPending} className="w-full">
                <Plus className="h-4 w-4" />
                Adicionar à blocklist
              </Button>
            </form>
          </Card>

          <Card
            title={`Entradas (${data?.total ?? 0})`}
            subtitle="Hosts que forçam veredito unsafe na análise"
            className="lg:col-span-3"
          >
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : isError ? (
              <p className="text-sm text-verdict-unsafe">Falha ao carregar blocklist.</p>
            ) : !data?.entries.length ? (
              <EmptyState
                icon={ShieldBan}
                title="Blocklist vazia"
                description="Adicione domínios clonados ou suspeitos para bloquear na análise."
              />
            ) : (
              <ul className="space-y-2">
                {data.entries.map((entry) => (
                  <li
                    key={entry}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-surface-900/50 px-4 py-3"
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
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
