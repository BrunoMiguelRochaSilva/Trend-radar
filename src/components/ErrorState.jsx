import { AlertTriangle, RotateCw } from 'lucide-react';

export default function ErrorState({
  title = 'Unable to load product data.',
  message,
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-500">
        <AlertTriangle className="h-5 w-5" strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-medium text-rose-700">{title}</p>
        {message && <p className="mt-1 max-w-sm text-sm text-rose-500/90">{message}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-50"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
