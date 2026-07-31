import { Link } from '@/context/RouterContext';
import { Rating } from '@/components/Rating';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="group relative bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all duration-300">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="aspect-square bg-stone-50 overflow-hidden">
          <img
            src={product.image_url || ''}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>
      {product.stock === 0 && (
        <div className="absolute top-3 left-3 bg-stone-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          Sold out
        </div>
      )}
      {product.featured && product.stock > 0 && (
        <div className="absolute top-3 left-3 bg-amber-400 text-stone-900 text-xs font-semibold px-2.5 py-1 rounded-full">
          Featured
        </div>
      )}
      <div className="p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-semibold text-stone-900 text-sm mb-1 line-clamp-1 hover:text-stone-600 transition">
            {product.name}
          </h3>
        </Link>
        <div className="mb-2">
          <Rating value={product.rating} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-stone-900">{formatPrice(product.price)}</span>
          <button
            onClick={() => addItem(product, 1)}
            disabled={product.stock === 0}
            className="p-2 rounded-full bg-stone-900 text-white hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Add to cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
