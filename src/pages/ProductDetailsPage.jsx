import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { fetchProductDetails, fetchProductVideos } from '../services/api.js';
import { normalizeProduct } from '../utils/normalizeProduct.js';
import { normalizeVideos } from '../utils/normalizeVideo.js';
import ProductDetails from '../components/ProductDetails.jsx';
import VideoGrid from '../components/VideoGrid.jsx';
import VideoAdTable from '../components/VideoAdTable.jsx';
import VideoDetail from '../components/VideoDetail.jsx';
import CacheStatus from '../components/CacheStatus.jsx';
import { ProductDetailsSkeleton } from '../components/LoadingSkeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { useCachedQuery } from '../hooks/useCachedQuery.js';
import { buildProductDetailParams, buildVideoRankParams } from '../utils/queryParams.js';
import { DATE_RANGE_OPTIONS } from '../constants/filterOptions.js';

export default function ProductDetailsPage({ onMenuClick }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last7Day');
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  // Opening the same product again (this session or a future one) is served
  // from cache — 0 Kalodata calls — until Refresh is explicitly clicked.
  const productQuery = useCachedQuery({
    endpoint: 'product/detail',
    params: buildProductDetailParams(id, dateRange),
    fetcher: (forceRefresh) => fetchProductDetails(id, { dateRange, refresh: forceRefresh }),
    enabled: !!id,
  });

  // The FIRST page of videos (page_size 100, page_number 1) — shared by both
  // Popular Videos (top 10 slice) and the Video & Ad table's first page, so
  // they read the exact same cached call and never fetch it twice. Video & Ad
  // owns any pagination beyond this first page itself.
  const videoPage1Query = useCachedQuery({
    endpoint: 'video/rank',
    params: buildVideoRankParams(id, dateRange, 1),
    fetcher: (forceRefresh) =>
      fetchProductVideos(id, { dateRange, pageSize: 100, pageNumber: 1, refresh: forceRefresh }),
    enabled: !!id,
  });

  const product = normalizeProduct(productQuery.response?.data);
  const allVideos = normalizeVideos(videoPage1Query.response?.data);
  const popularVideos = allVideos.slice(0, 10);

  const pageIsFetching = productQuery.isFetching || videoPage1Query.isFetching;

  async function handleRefreshAll() {
    // "Refresh product" refreshes everything tied to this product's default
    // (page-1) view in one action — product/detail + video/rank, exactly
    // 1 call each, regardless of how many sections read that data.
    await Promise.all([productQuery.refresh(), videoPage1Query.refresh()]);
  }

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

          <div className="flex items-center gap-3">
            <select
              aria-label="Date Range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {!productQuery.isLoading && (
              <CacheStatus
                updatedAt={productQuery.updatedAt}
                fromCache={productQuery.fromCache}
                isFetching={pageIsFetching}
                onRefresh={handleRefreshAll}
                label="Refresh product"
              />
            )}
          </div>
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Product Details
        </h1>
      </header>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {productQuery.isLoading && <ProductDetailsSkeleton />}

        {productQuery.isError && (
          <ErrorState
            title={productQuery.error?.message || 'Unable to load product data.'}
            onRetry={productQuery.refresh}
          />
        )}

        {!productQuery.isLoading && !productQuery.isError && product && (
          <>
            <ProductDetails product={product} />

            <VideoGrid
              videos={popularVideos}
              isLoading={videoPage1Query.isLoading}
              isFetching={videoPage1Query.isFetching}
              isError={videoPage1Query.isError}
              error={videoPage1Query.error}
              onRefresh={videoPage1Query.refresh}
              updatedAt={videoPage1Query.updatedAt}
              fromCache={videoPage1Query.fromCache}
              onOpenVideo={setSelectedVideoId}
            />

            <VideoAdTable
              key={`${id}-${dateRange}`}
              productId={id}
              dateRange={dateRange}
              page1Query={videoPage1Query}
              onOpenVideo={setSelectedVideoId}
            />
          </>
        )}
      </div>

      {selectedVideoId && (
        <VideoDetail
          videoId={selectedVideoId}
          dateRange={dateRange}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </div>
  );
}
