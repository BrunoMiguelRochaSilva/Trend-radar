import ProductRow from './ProductRow.jsx';
import ProductCard from './ProductCard.jsx';
import { useCachedTopVideos } from '../hooks/useCachedTopVideos.js';

const COLUMNS = [
  { label: 'Rank', align: 'text-left' },
  { label: 'Product', align: 'text-left' },
  { label: 'Revenue', align: 'text-left' },
  { label: 'Growth', align: 'text-left' },
  { label: 'Sales', align: 'text-left' },
  { label: 'Top Videos', align: 'text-left' },
  { label: 'Unit Price', align: 'text-left' },
  { label: 'Video Revenue', align: 'text-left' },
  { label: 'Live Revenue', align: 'text-left' },
  { label: 'Seller', align: 'text-left' },
];

// The first product/rank call doesn't return creator/video/livestream counts —
// those only come from /product/detail, fetched lazily when a product is
// opened. So this table only ever renders fields already present on the rank
// response (see spec §11). The one exception is "Top Videos", which only reads
// what's already in the local cache from opening a product — never a new call.
// `rankOffset` = rows before this page (100 per page), so ranks continue (#101, #102…).
export default function ProductTable({ products, dateRange, rankOffset = 0 }) {
  const topVideos = useCachedTopVideos(
    products.map((p) => p.id),
    dateRange
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1040px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={`whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 ${col.align}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => (
              <ProductRow
                key={product.id}
                product={product}
                rank={rankOffset + i + 1}
                topVideos={topVideos[product.id]}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 p-3 md:hidden">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} rank={rankOffset + i + 1} />
        ))}
      </div>
    </div>
  );
}
