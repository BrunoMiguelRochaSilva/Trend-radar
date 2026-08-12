import { useNavigate } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import Header from '../components/Header.jsx';

// Kept intentionally minimal for V1 (spec §13). The documented Kalodata
// /video/rank example is always scoped to a product_id filter, so rather than
// guess at undocumented "browse all videos" behavior, the real video-ranking
// experience lives on each Product Details page's Popular Videos section.
export default function Videos({ onMenuClick }) {
  const navigate = useNavigate();

  return (
    <div className="flex-1">
      <Header title="Videos" subtitle="Video rankings, scoped per product." onMenuClick={onMenuClick} />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Clapperboard className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">Browse videos from a product</p>
          <p className="max-w-sm text-sm text-slate-500">
            Kalodata's video rankings are scoped to a specific product. Open any product from the
            dashboard to see its Popular Videos — top performers ranked by revenue.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Go to Products
          </button>
        </div>
      </div>
    </div>
  );
}
