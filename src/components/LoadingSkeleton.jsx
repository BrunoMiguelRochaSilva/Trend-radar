// Shared skeleton-loading primitives. Composed differently per surface
// (table rows, KPI cards, video cards) but all share the same shimmer look.

function Bone({ className = '' }) {
  return (
    <div className={`skeleton-shimmer relative overflow-hidden rounded bg-slate-200 ${className}`} />
  );
}

export function KpiSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <Bone className="h-3.5 w-24" />
          <Bone className="mt-3 h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ProductTableSkeleton({ rows = 12 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="hidden md:block">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0"
          >
            <Bone className="h-4 w-6" />
            <Bone className="h-11 w-11 shrink-0 rounded-lg" />
            <Bone className="h-4 w-48" />
            <Bone className="ml-auto h-4 w-16" />
            <Bone className="h-4 w-14" />
            <Bone className="h-4 w-14" />
            <Bone className="h-4 w-14" />
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {Array.from({ length: Math.min(rows, 6) }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
            <Bone className="h-14 w-14 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="w-64 shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <Bone className="h-32 w-full rounded-lg" />
      <Bone className="mt-3 h-3.5 w-24" />
      <Bone className="mt-2 h-4 w-full" />
      <Bone className="mt-2 h-4 w-3/4" />
      <div className="mt-3 flex gap-3">
        <Bone className="h-3 w-10" />
        <Bone className="h-3 w-10" />
        <Bone className="h-3 w-10" />
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 5 }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:flex-row">
        <Bone className="h-32 w-32 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-3">
          <Bone className="h-6 w-2/3" />
          <Bone className="h-4 w-1/3" />
          <Bone className="h-4 w-1/4" />
        </div>
      </div>
      <KpiSkeleton count={6} />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <Bone className="h-4 w-32" />
        <Bone className="mt-4 h-56 w-full" />
      </div>
    </div>
  );
}

export default Bone;
