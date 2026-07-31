import { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingBag, ArrowLeft, Check, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { Link, useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { Rating } from '@/components/Rating';
import { ProductCard } from '@/components/ProductCard';
import type { Product, Category } from '@/types';

export function ProductDetailPage({ slug }: { slug: string }) {
  const { addItem } = useCart();
  const { navigate } = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!data) {
        setLoading(false);
        return;
      }
      const prod = data as Product;
      setProduct(prod);
      setActiveImage(0);
      setQuantity(1);

      if (prod.category_id) {
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', prod.category_id)
          .maybeSingle();
        setCategory(catData as Category | null);

        const { data: relData } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', prod.category_id)
          .neq('id', prod.id)
          .limit(4);
        setRelated((relData as Product[]) || []);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  function handleAddToCart() {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-stone-100 rounded-3xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-stone-100 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-stone-100 rounded animate-pulse w-1/2" />
            <div className="h-24 bg-stone-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-stone-500 text-lg mb-4">Product not found</p>
        <Link to="/shop" className="text-stone-900 font-medium hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
        ? [product.image_url]
        : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-stone-100">
            <img
              src={images[activeImage] || ''}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                    activeImage === idx ? 'border-stone-900' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {category && (
            <Link
              to={`/shop?category=${category.slug}`}
              className="text-sm font-medium text-stone-500 hover:text-stone-900 transition"
            >
              {category.name}
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold text-stone-900">{product.name}</h1>
            <div className="flex items-center gap-4 mt-3">
              <Rating value={product.rating} size={18} />
              <span className="text-stone-300">|</span>
              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          <p className="text-3xl font-bold text-stone-900">{formatPrice(product.price)}</p>

          <p className="text-stone-600 leading-relaxed">{product.description}</p>

          {/* Quantity + add to cart */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center border border-stone-300 rounded-full">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 text-stone-600 hover:text-stone-900 transition disabled:opacity-30"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold text-stone-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="p-3 text-stone-600 hover:text-stone-900 transition disabled:opacity-30"
                disabled={quantity >= product.stock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" /> Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" /> Add to cart
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              handleAddToCart();
              setTimeout(() => navigate('/cart'), 300);
            }}
            disabled={product.stock === 0}
            className="w-full px-6 py-3.5 bg-white text-stone-900 font-semibold rounded-full border border-stone-300 hover:border-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Buy now
          </button>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-200">
            {[
              { icon: Truck, label: 'Free shipping' },
              { icon: RotateCcw, label: '30-day returns' },
              { icon: ShieldCheck, label: '2-year warranty' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center gap-2">
                <item.icon className="w-6 h-6 text-stone-700" />
                <span className="text-xs text-stone-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-stone-900 mb-6">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
