import { Link, useRouter } from '@/context/RouterContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/format';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';

export function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart();
  const { user } = useAuth();
  const { navigate } = useRouter();

  const shipping = subtotal > 75 || subtotal === 0 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-stone-400" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Your cart is empty</h1>
          <p className="text-stone-500 mb-8">Looks like you haven't added anything yet.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-700 transition"
          >
            Start shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Continue shopping
      </Link>

      <h1 className="text-3xl font-bold text-stone-900 mb-8">
        Shopping Cart <span className="text-stone-400 text-xl font-normal">({totalItems})</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-4 bg-white rounded-2xl border border-stone-200 p-4"
            >
              <Link to={`/product/${item.product.slug}`} className="shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={item.product.image_url || ''}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <Link to={`/product/${item.product.slug}`}>
                    <h3 className="font-semibold text-stone-900 hover:text-stone-600 transition line-clamp-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-stone-500 mt-0.5">{formatPrice(item.product.price)} each</p>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1 mt-2 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-stone-300 rounded-full">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-2 text-stone-600 hover:text-stone-900 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-2 text-stone-600 hover:text-stone-900 transition disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-stone-900 w-20 text-right">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-24">
            <h2 className="font-bold text-stone-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className="font-medium text-stone-900">
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tax (8%)</span>
                <span className="font-medium text-stone-900">{formatPrice(tax)}</span>
              </div>
              {subtotal < 75 && subtotal > 0 && (
                <p className="text-xs text-stone-500 bg-stone-50 rounded-lg p-3">
                  Add {formatPrice(75 - subtotal)} more to get free shipping!
                </p>
              )}
              <div className="border-t border-stone-200 pt-3 flex justify-between">
                <span className="font-bold text-stone-900">Total</span>
                <span className="font-bold text-stone-900 text-lg">{formatPrice(total)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate(user ? '/checkout' : '/login?redirect=checkout')}
              className="w-full mt-6 px-6 py-3.5 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-700 transition flex items-center justify-center gap-2"
            >
              {user ? 'Proceed to checkout' : 'Sign in to checkout'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
