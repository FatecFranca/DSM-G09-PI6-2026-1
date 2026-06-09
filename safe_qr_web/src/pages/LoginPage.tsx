import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { createApiClient } from '../api/client';
import { ApiError } from '../api/types';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { loadApiBaseUrl } from '../auth/storage';
import { normalizeApiBaseUrl } from '../lib/normalize-api-base-url';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const { isAuthenticated, login } = useAdminAuth();
  const [apiBaseUrl, setApiBaseUrl] = useState(loadApiBaseUrl);
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const baseUrl = normalizeApiBaseUrl(apiBaseUrl);
      const client = createApiClient({
        baseUrl,
        adminKey: adminKey.trim(),
      });
      await client.getStats();
      login(baseUrl, adminKey);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Falha ao conectar com a API';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-dim shadow-xl shadow-accent/30">
            <ShieldCheck className="h-8 w-8 text-surface-950" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Safe QR <span className="text-gradient">Admin</span>
          </h1>
          <p className="mt-2 text-slate-400">Monitore eventos e gerencie a blocklist</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel space-y-5 p-8">
          <Input
            label="URL da API"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder="https://safe-qr-api-....run.app"
            hint="Só a URL base — sem /v1/admin/stats no final"
            autoComplete="url"
          />
          <Input
            label="Chave de admin"
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="X-Admin-Key"
            hint="Mesmo valor de ADMIN_API_KEY no backend"
            error={error}
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" loading={loading}>
            Entrar no painel
          </Button>
        </form>
      </div>
    </div>
  );
}
