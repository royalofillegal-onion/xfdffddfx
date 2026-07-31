import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import type { Category, Product } from '@/types';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [maxPrice, setMaxPrice] = useState(500);
  const [sort, setSort] = useState<SortOption>('featured');
  const [showFilters, setShowFilters] = useState(false);

  // Parse query params from hash
  useEffect(() => {
    const hash = window.location.hash.replace(/^#\/shop/, '').replace(/^\?/, '');
    const params = new URLSearchParams(hash);
    const cat = params.get('category');
    const q = params.get('q');
    if (cat) setSelectedCategory(cat);
    if (q) setSearchQuery(q);
  }, []);

  useEffect(() => {
    async function load() {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('categories').select('*').order('name'),
      ]);
      const allProducts = (prodRes.data as Product[]) || [];
      setProducts(allProducts);
      setCategories((catRes.data as Category[]) || []);
      if (allProducts.length > 0) {
        const highest = Math.ceil(Math.max(...allProducts.map((p) => p.price)));
        setMaxPrice(highest);
        setPriceRange([0, highest]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== 'all') {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) result = result.filter((p) => p.category_id === cat.id);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );
    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return result;
  }, [products, categories, selectedCategory, searchQuery, priceRange, sort]);

  function clearFilters() {
    setSelectedCategory('all');
    setSearchQuery('');
    setPriceRange([0, maxPrice]);
    setSort('featured');
  }

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (priceRange[1] < maxPrice ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-900">Shop all products</h1>
        <p className="text-stone-500 mt-1">
          {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'} found`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-300 rounded-full text-sm font-medium hover:border-stone-900 transition"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-6`}>
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-900">Categories</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                    selectedCategory === 'all'
                      ? 'bg-stone-900 text-white font-medium'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                      selectedCategory === cat.slug
                        ? 'bg-stone-900 text-white font-medium'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-semibold text-stone-900 mb-4">Price Range</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-stone-600">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                  className="w-full accent-stone-900"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2.5 text-sm bg-white border border-stone-200 rounded-full focus:outline-none focus:border-stone-900 transition"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-4 py-2.5 text-sm bg-white border border-stone-200 rounded-full focus:outline-none focus:border-stone-900 transition cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-500 text-lg mb-2">No products found</p>
              <button onClick={clearFilters} className="text-stone-900 font-medium hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
