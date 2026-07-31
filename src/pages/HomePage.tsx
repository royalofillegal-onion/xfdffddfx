import { useEffect, useState } from 'react';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';
import { Link } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import type { Category, Product } from '@/types';

export function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').eq('featured', true).limit(8),
        supabase.from('categories').select('*').order('name'),
      ]);
      setFeatured((prodRes.data as Product[]) || []);
      setCategories((catRes.data as Category[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block px-3 py-1 bg-stone-900 text-white text-xs font-semibold rounded-full">
                New Season Collection
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 leading-tight">
                Everyday essentials, <br />
                <span className="text-stone-500">elevated.</span>
              </h1>
              <p className="text-lg text-stone-600 max-w-md">
                Discover thoughtfully designed products for modern living. From immersive audio to
                everyday carry, find your next favorite.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-700 transition group"
                >
                  Shop now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/shop?category=audio"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-900 font-semibold rounded-full border border-stone-300 hover:border-stone-900 transition"
                >
                  Explore audio
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-stone-200">
                    <img
                      src="https://images.pexels.com/photos/9058883/pexels-photo-9058883.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                      alt="Headphones"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square rounded-3xl overflow-hidden bg-stone-200">
                    <img
                      src="https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                      alt="Leather bag"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square rounded-3xl overflow-hidden bg-stone-200">
                    <img
                      src="https://images.pexels.com/photos/12564670/pexels-photo-12564670.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                      alt="Smartwatch"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-stone-200">
                    <img
                      src="https://images.pexels.com/photos/26852497/pexels-photo-26852497.png?auto=compress&cs=tinysrgb&h=650&w=940"
                      alt="Sneakers"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over $75' },
              { icon: RotateCcw, title: '30-Day Returns', desc: 'Hassle-free returns' },
              { icon: ShieldCheck, title: 'Secure Payment', desc: 'Encrypted checkout' },
              { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-stone-700" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-stone-900">{item.title}</p>
                  <p className="text-xs text-stone-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Shop by category</h2>
            <p className="text-stone-500 mt-1">Find exactly what you're looking for</p>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-stone-900 hover:text-stone-600 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100"
            >
              <img
                src={cat.image_url || ''}
                alt={cat.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-sm">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Featured products</h2>
            <p className="text-stone-500 mt-1">Our most-loved picks this season</p>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-stone-900 hover:text-stone-600 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-stone-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative rounded-3xl bg-stone-900 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative px-6 sm:px-12 py-16 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Join the Lumina community
            </h2>
            <p className="text-stone-300 max-w-md mx-auto mb-8">
              Create an account to track orders, save your favorites, and check out faster.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-stone-900 font-semibold rounded-full hover:bg-stone-100 transition group"
            >
              Get started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
