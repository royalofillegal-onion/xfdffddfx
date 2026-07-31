import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { Header, Footer } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/ShopPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrdersPage, OrderDetailPage } from '@/pages/OrdersPage';
import { LoginPage, SignupPage } from '@/pages/AuthPages';
import { AccountPage } from '@/pages/AccountPage';
import { AdminPage } from '@/pages/AdminPage';

function Routes() {
  const { path } = useRouter();
  const cleanPath = path.split('?')[0];

  // Product detail: /product/:slug
  if (cleanPath.startsWith('/product/')) {
    const slug = cleanPath.replace('/product/', '');
    return <ProductDetailPage slug={slug} />;
  }

  // Order detail: /orders/:id
  if (cleanPath.startsWith('/orders/')) {
    const orderId = cleanPath.replace('/orders/', '');
    return <OrderDetailPage orderId={orderId} />;
  }

  switch (cleanPath) {
    case '/':
      return <HomePage />;
    case '/shop':
      return <ShopPage />;
    case '/cart':
      return <CartPage />;
    case '/checkout':
      return <CheckoutPage />;
    case '/orders':
      return <OrdersPage />;
    case '/login':
      return <LoginPage />;
    case '/signup':
      return <SignupPage />;
    case '/account':
      return <AccountPage />;
    case '/admin':
      return <AdminPage />;
    default:
      return <HomePage />;
  }
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-stone-50 flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes />
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;
