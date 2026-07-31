import { useState } from 'react';
import { Link, useRouter } from '@/context/RouterContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { ArrowLeft, Lock, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    address_line1: profile?.address_line1 || '',
    city: profile?.city || '',
    state: profile?.state || '',
    postal_code: profile?.postal_code || '',
    country: profile?.country || 'United States',
    card_number: '',
    card_name: '',
    card_expiry: '',
    card_cvc: '',
  });

  const shipping = subtotal > 75 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    try {
      if (!user) {
        setError('Please sign in to place your order.');
        setProcessing(false);
        return;
      }
      if (items.length === 0) {
        setError('Your cart is empty.');
        setProcessing(false);
        return;
      }

      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'processing',
          subtotal,
          shipping,
          tax,
          total,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || null,
          address_line1: form.address_line1,
          city: form.city,
          state: form.state,
          postal_code: form.postal_code,
          country: form.country,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const order = orderData as { id: string };

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image_url,
        unit_price: item.product.price,
        quantity: item.quantity,
        line_total: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Decrement stock atomically
      await Promise.all(
        items.map((item) =>
          supabase.rpc('decrement_stock', {
            product_id: item.product.id,
            qty: item.quantity,
          })
        )
      );

      clearCart();
      setPlacedOrderId(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  if (placedOrderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-3">Order confirmed!</h1>
        <p className="text-stone-600 mb-2">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
        <p className="text-sm text-stone-500 mb-8">
          Order number: <span className="font-mono font-medium text-stone-700">{placedOrderId.slice(0, 8).toUpperCase()}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/orders/${placedOrderId}`}
            className="px-6 py-3 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-700 transition"
          >
            Track your order
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3 bg-white text-stone-900 font-semibold rounded-full border border-stone-300 hover:border-stone-900 transition"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Your cart is empty</h1>
        <Link to="/shop" className="text-stone-900 font-medium hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/cart"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to cart
      </Link>

      <h1 className="text-3xl font-bold text-stone-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-bold text-stone-900 mb-4">Shipping Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" required value={form.full_name} onChange={(v) => update('full_name', v)} />
              <Field label="Email" required type="email" value={form.email} onChange={(v) => update('email', v)} />
              <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} />
              <div className="sm:col-span-2">
                <Field label="Address" required value={form.address_line1} onChange={(v) => update('address_line1', v)} />
              </div>
              <Field label="City" required value={form.city} onChange={(v) => update('city', v)} />
              <Field label="State / Province" required value={form.state} onChange={(v) => update('state', v)} />
              <Field label="Postal Code" required value={form.postal_code} onChange={(v) => update('postal_code', v)} />
              <Field label="Country" required value={form.country} onChange={(v) => update('country', v)} />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-stone-700" />
              <h2 className="font-bold text-stone-900">Payment Details</h2>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800">
              This is a demo store. No real payment will be charged. Use any card details to test.
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Card Number" required value={form.card_number} onChange={(v) => update('card_number', v)} placeholder="4242 4242 4242 4242" />
              </div>
              <Field label="Name on Card" required value={form.card_name} onChange={(v) => update('card_name', v)} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry" required value={form.card_expiry} onChange={(v) => update('card_expiry', v)} placeholder="MM/YY" />
                <Field label="CVC" required value={form.card_cvc} onChange={(v) => update('card_cvc', v)} placeholder="123" />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-24">
            <h2 className="font-bold text-stone-900 mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                    <img src={item.product.image_url || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-stone-500">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-stone-900">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-stone-200 pt-4">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className="font-medium text-stone-900">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tax</span>
                <span className="font-medium text-stone-900">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2">
                <span className="font-bold text-stone-900">Total</span>
                <span className="font-bold text-stone-900 text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full mt-6 px-6 py-3.5 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Place order
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:border-stone-900 transition"
      />
    </div>
  );
}
