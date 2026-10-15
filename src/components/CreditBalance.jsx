import { useQuery } from '@tanstack/react-query';
import { Coins, RefreshCw } from 'lucide-react';
import { fetchCreditBalance } from '../services/api.js';
import { relativeTime } from '../utils/relativeTime.js';

// Below this the balance is shown in amber — roughly 10 more rank/detail lookups.
const LOW_BALANCE = 1;

function formatCredits(value) {
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Remaining Kalodata credits, shown in the sidebar. Checking the balance is
 * free, so it re-checks on its own after every paid fetch (useCachedQuery
 * invalidates ['credit-balance']) — cached results never trigger a re-check.
 */
export default function CreditBalance() {
  const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: fetchCreditBalance,
    staleTime: 0,
  });

  const balance = data?.data;
  const total = balance?.totalRemain;
  const isLow = total != null && Number(total) < LOW_BALANCE;

  let value;
  let note;
  if (isLoading) {
    value = <span className="text-slate-300">—</span>;
  } else if (isError) {
    value = <span className="text-sm font-medium text-slate-400">Unavailable</span>;
    note = 'Could not reach Kalodata';
  } else if (data?.mock) {
    value = <span className="text-sm font-medium text-slate-500">Mock mode</span>;
    note = 'Preview data · no credits used';
  } else {
    value = <span className={isLow ? 'text-amber-600' : 'text-slate-900'}>{formatCredits(total)}</span>;
    note = `Updated ${relativeTime(new Date(dataUpdatedAt))} · free to check`;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Kalodata credits
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh credit balance"
          title="Re-check the balance (free — spends no credits)"
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="mt-0.5 flex items-center gap-1.5 text-lg font-semibold tabular-nums">
        <Coins className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} />
        {value}
      </p>
      {balance?.subRemain != null && (
        <p className="text-[11px] text-slate-500">Sub-account: {formatCredits(balance.subRemain)}</p>
      )}
      {note && <p className="text-[11px] text-slate-400">{note}</p>}
    </div>
  );
}
