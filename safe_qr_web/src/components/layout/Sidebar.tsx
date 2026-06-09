import { Activity, LayoutDashboard, ShieldBan } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/events', label: 'Eventos', icon: Activity, end: false },
  { to: '/blocklist', label: 'Blocklist', icon: ShieldBan, end: false },
] as const;

export function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/8 bg-surface-900/50 backdrop-blur-xl">
      <div className="border-b border-white/8 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dim shadow-lg shadow-accent/25">
            <ShieldBan className="h-5 w-5 text-surface-950" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Safe QR</p>
            <p className="text-xs text-slate-400">Painel Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent/15 text-accent-glow shadow-inner shadow-accent/5'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <footer className="border-t border-white/8 p-4">
        <p className="text-center text-xs text-slate-500">FATEC Franca · PI6 2026</p>
      </footer>
    </aside>
  );
}
