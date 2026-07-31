import { useState } from 'react';
import { ShoppingBag, Search, User, Menu, X, Heart, Package } from 'lucide-react';
import { Link, useRouter } from '@/context/RouterContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { path, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'Audio', to: '/shop?category=audio' },
    { label: 'Wearables', to: '/shop?category=wearables' },
    { label: 'Footwear', to: '/shop?category=footwear' },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
      setMobileOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-stone-900 hidden sm:block">
              Lumina
            </span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-stone-100 border border-transparent rounded-full focus:outline-none focus:bg-white focus:border-stone-300 transition"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                  path === link.to
                    ? 'text-stone-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {user && (
              <Link
                to="/orders"
                className="hidden sm:flex p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition"
                title="My Orders"
              >
                <Package className="w-5 h-5" />
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md transition"
              >
                Admin
              </Link>
            )}
            <Link
              to="/cart"
              className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-stone-900 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/account"
                  className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition"
                  title="Account"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-stone-600 hover:text-stone-900 px-2"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition"
                title="Sign in"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-full"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 space-y-3 border-t border-stone-200 pt-3">
            <form onSubmit={handleSearch} className="md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-stone-100 rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-300"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
                  >
                    Account
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
                >
                  Admin Dashboard
                </Link>
              )}
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="text-left px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-stone-900" />
              </div>
              <span className="text-xl font-bold text-white">Lumina</span>
            </div>
            <p className="text-sm text-stone-400 max-w-xs">
              Thoughtfully designed products for modern living. Free shipping on orders over $75.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-white transition">All Products</Link></li>
              <li><Link to="/shop?category=audio" className="hover:text-white transition">Audio</Link></li>
              <li><Link to="/shop?category=wearables" className="hover:text-white transition">Wearables</Link></li>
              <li><Link to="/shop?category=footwear" className="hover:text-white transition">Footwear</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition">Sign In</Link></li>
              <li><Link to="/signup" className="hover:text-white transition">Create Account</Link></li>
              <li><Link to="/orders" className="hover:text-white transition">Order History</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">Shopping Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white transition cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Shipping Info</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Returns</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Contact Us</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-stone-400">© 2026 Lumina. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-stone-400">
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> Crafted with care</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
