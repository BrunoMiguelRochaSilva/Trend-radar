import { NavLink } from 'react-router-dom';
import {
  Radar,
  LayoutDashboard,
  Package,
  Clapperboard,
  Users,
  Store,
  TrendingUp,
  Bell,
  Sparkles,
  Settings,
  X,
} from 'lucide-react';

const primaryLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/videos', label: 'Videos', icon: Clapperboard },
];

const comingSoonLinks = [
  { label: 'Creators', icon: Users },
  { label: 'Shops', icon: Store },
  { label: 'Trends', icon: TrendingUp },
  { label: 'Alerts', icon: Bell },
  { label: 'AI Insights', icon: Sparkles },
];

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      {label}
    </NavLink>
  );
}

function ComingSoonItem({ label, icon: Icon }) {
  return (
    <div className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400">
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        {label}
      </span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Soon
      </span>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Radar className="h-4.5 w-4.5" strokeWidth={2.25} />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              TrendRadar
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          <div className="space-y-1">
            {primaryLinks.map((link) => (
              <NavItem key={link.label} {...link} />
            ))}
          </div>

          <div>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Coming soon
            </p>
            <div className="space-y-1">
              {comingSoonLinks.map((link) => (
                <ComingSoonItem key={link.label} {...link} />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-200 px-3 py-3">
          <div className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400">
            <Settings className="h-4 w-4 shrink-0" strokeWidth={2} />
            Settings
          </div>
        </div>
      </aside>
    </>
  );
}
