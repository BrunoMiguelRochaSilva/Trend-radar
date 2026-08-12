import { Menu } from 'lucide-react';

export default function Header({ title, subtitle, onMenuClick, actions }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <button
            onClick={onMenuClick}
            className="mt-0.5 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
