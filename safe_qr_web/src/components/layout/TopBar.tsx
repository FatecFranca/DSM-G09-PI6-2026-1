import { LogOut, Server } from 'lucide-react';

import { useAdminAuth } from '../../auth/AdminAuthContext';
import { Button } from '../ui/Button';

type TopBarProps = {
  title: string;
  subtitle?: string;
};

export function TopBar({ title, subtitle }: TopBarProps) {
  const { apiBaseUrl, logout } = useAdminAuth();

  return (
    <header className="flex items-center justify-between border-b border-white/8 bg-surface-900/30 px-8 py-5 backdrop-blur-md">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-surface-800/60 px-3 py-2 text-xs text-slate-400 sm:flex">
          <Server className="h-3.5 w-3.5 text-accent" />
          <span className="max-w-[200px] truncate font-mono">{apiBaseUrl}</span>
        </div>
        <Button variant="ghost" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
