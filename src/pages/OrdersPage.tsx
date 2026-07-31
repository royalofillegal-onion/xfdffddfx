import { useEffect, useState } from 'react';
import { Link } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, formatDate } from '@/lib/format';
import { Package, ChevronRight, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';
import type { Order, OrderItem, OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  processing: { label: 'Processing', color: 'bg-amber-100 text-amber-700', icon: Clock },
  shipped: { label: 'Shipped', color: 'bg-blue-100 text-blue-700', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Sign in to view your orders</h1>
        <Link to="/login" className="text-stone-900 font-medium hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-stone-900 mb-8">Your Orders</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">No orders yet</h2>
          <p className="text-stone-500 mb-8">When you place an order, it will appear here.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-700 transition"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-stone-200 p-5 hover:border-stone-300 hover:shadow-sm transition group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.color}`}>
                      <StatusIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-stone-500">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="font-bold text-stone-900">{formatPrice(order.total)}</p>
                    <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).maybeSingle(),
        supabase.from('order_items').select('*').eq('order_id', orderId),
      ]);
      setOrder(orderRes.data as Order | null);
      setOrderItems((itemsRes.data as OrderItem[]) || []);
      setLoading(false);
    }
    load();
  }, [orderId, user]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-64 bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Order not found</h1>
        <Link to="/orders" className="text-stone-900 font-medium hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const trackingSteps: OrderStatus[] = ['processing', 'shipped', 'delivered'];
  const currentStepIndex = trackingSteps.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="text-sm text-stone-500 hover:text-stone-900 mb-6 inline-block">
        ← Back to orders
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-stone-500 text-sm mt-1">Placed on {formatDate(order.created_at)}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full ${status.color}`}>
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </span>
          </div>
        </div>

        {/* Tracking */}
        {order.status !== 'cancelled' && (
          <div className="p-6 border-b border-stone-200">
            <h2 className="font-semibold text-stone-900 mb-6">Order Tracking</h2>
            <div className="relative">
              <div className="absolute left-0 right-0 top-5 h-0.5 bg-stone-200" />
              <div
                className="absolute left-0 top-5 h-0.5 bg-green-500 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` }}
              />
              <div className="relative flex justify-between">
                {trackingSteps.map((step, idx) => {
                  const stepConfig = statusConfig[step];
                  const StepIcon = stepConfig.icon;
                  const isComplete = idx <= currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                          isComplete
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-stone-200 text-stone-400'
                        }`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-medium ${isComplete ? 'text-stone-900' : 'text-stone-400'}`}>
                        {stepConfig.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="p-6 border-b border-stone-200">
          <h2 className="font-semibold text-stone-900 mb-4">Items</h2>
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                  <img src={item.product_image || ''} alt={item.product_name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-900">{item.product_name}</p>
                  <p className="text-sm text-stone-500">Qty {item.quantity} × {formatPrice(item.unit_price)}</p>
                </div>
                <span className="font-semibold text-stone-900">{formatPrice(item.line_total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="p-6 border-b border-stone-200">
          <h2 className="font-semibold text-stone-900 mb-4">Shipping Address</h2>
          <div className="text-sm text-stone-600 space-y-1">
            <p className="font-medium text-stone-900">{order.full_name}</p>
            <p>{order.address_line1}</p>
            <p>{order.city}, {order.state} {order.postal_code}</p>
            <p>{order.country}</p>
            {order.phone && <p>Phone: {order.phone}</p>}
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span className="font-medium text-stone-900">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span className="font-medium text-stone-900">{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Tax</span>
              <span className="font-medium text-stone-900">{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2">
              <span className="font-bold text-stone-900">Total</span>
              <span className="font-bold text-stone-900 text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
