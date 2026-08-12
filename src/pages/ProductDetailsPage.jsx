import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { fetchProductDetails } from '../services/api.js';
import { normalizeProduct } from '../utils/normalizeProduct.js';
import ProductDetails from '../components/ProductDetails.jsx';
import VideoGrid from '../components/VideoGrid.jsx';
import CacheStatus from '../components/CacheStatus.jsx';
import { ProductDetailsSkeleton } from '../components/LoadingSkeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { useCachedQuery } from '../hooks/useCachedQuery.js';
import { buildProductDetailParams } from '../utils/queryParams.js';

const DATE_RANGE = 'last7Day';

export default function ProductDetailsPage({ onMenuClick }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Opening the same product again (this session or a future one) is served
  // from cache — 0 Kalodata calls — until Refresh is explicitly clicked.
  const { response, isLoading, isFetching, isError, error, refresh, updatedAt, fromCache } =
    useCachedQuery({
      endpoint: 'product/detail',
      params: buildProductDetailParams(id, DATE_RANGE),
      fetcher: (forceRefresh) =>
        fetchProductDetails(id, { dateRange: DATE_RANGE, refresh: forceRefresh }),
      enabled: !!id,
    });

  const product = normalizeProduct(response?.data);

  return (
    <div className="flex-1">
      <header className="border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </button>
          </div>
          {!isLoading && (
            <CacheStatus
              updatedAt={updatedAt}
              fromCache={fromCache}
              isFetching={isFetching}
              onRefresh={refresh}
              label="Refresh product details"
            />
          )}
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Product Details
        </h1>
      </header>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {isLoading && <ProductDetailsSkeleton />}

        {isError && (
          <ErrorState title={error?.message || 'Unable to load product data.'} onRetry={refresh} />
        )}

        {!isLoading && !isError && product && (
          <>
            <ProductDetails product={product} />
            <VideoGrid productId={product.id} dateRange={DATE_RANGE} />
          </>
        )}
      </div>
    </div>
  );
}
