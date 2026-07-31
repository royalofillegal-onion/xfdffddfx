/*
# E-Commerce Store Schema

1. Overview
   Complete shopping platform: product catalog, customer accounts, shopping cart
   (client-side), and order management. Admins manage products and orders via a
   dashboard; customers browse, purchase, and track orders.

2. New Tables
   - `profiles`     : extends auth.users (role, full_name, phone, shipping address)
   - `categories`   : product groupings (name, slug, description, image_url)
   - `products`     : catalog items (name, slug, description, price, stock,
                      image_url, images, category_id, rating, featured)
   - `orders`       : customer purchases (status, totals, shipping address, items snapshot)
   - `order_items`  : line items per order (product snapshot, qty, unit price)

3. Security (RLS)
   - profiles            : owner read/update; role column guarded by trigger
   - categories/products : public read (anon + authenticated), admin-only write
   - orders/order_items  : owner read, owner insert; admin can read all + update order status
   - Admin role assigned at signup via trigger when email matches the configured
     admin address (admin@store.com). Role is immutable by non-admins.

4. Notes
   - Cart is managed client-side (localStorage) and persisted to an order on checkout.
   - Order items store a product snapshot so historical orders remain accurate even
     if a product is later edited or removed.
   - Stock is decremented via an atomic UPDATE on order placement.
*/

-- ---------- profiles (must come first; other policies reference it) ----------
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  full_name     text,
  phone         text,
  address_line1 text,
  city          text,
  state         text,
  postal_code   text,
  country       text DEFAULT 'United States',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_profile" ON profiles;
CREATE POLICY "read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger: create a profile row whenever a new auth user is created.
-- The first account matching the configured admin email becomes an admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email = 'admin@store.com' THEN 'admin' ELSE 'customer' END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: prevent non-admins from changing their own role.
CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
      RAISE EXCEPTION 'You are not allowed to change your role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_role ON profiles;
CREATE TRIGGER trg_guard_profile_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_role();

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  image_url   text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  price       numeric(10,2) NOT NULL CHECK (price >= 0),
  stock       integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   text,
  images      text[] DEFAULT '{}',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  rating      numeric(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  featured    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_featured_idx ON products(featured) WHERE featured = true;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','shipped','delivered','cancelled')),
  subtotal      numeric(10,2) NOT NULL,
  shipping      numeric(10,2) NOT NULL DEFAULT 0,
  tax           numeric(10,2) NOT NULL DEFAULT 0,
  total         numeric(10,2) NOT NULL,
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text,
  address_line1 text NOT NULL,
  city          text NOT NULL,
  state         text NOT NULL,
  postal_code   text NOT NULL,
  country       text NOT NULL DEFAULT 'United States',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_orders" ON orders;
CREATE POLICY "read_own_orders" ON orders FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------- order_items ----------
CREATE TABLE IF NOT EXISTS order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  unit_price  numeric(10,2) NOT NULL,
  quantity    integer NOT NULL CHECK (quantity > 0),
  line_total  numeric(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_order_items" ON order_items;
CREATE POLICY "read_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_order_items" ON order_items;
CREATE POLICY "insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

-- ---------- seed: categories ----------
INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Audio', 'audio', 'Headphones and audio gear for immersive listening', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Wearables', 'wearables', 'Smartwatches and fitness trackers', 'https://images.pexels.com/photos/12564670/pexels-photo-12564670.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Footwear', 'footwear', 'Sneakers and trainers for every stride', 'https://images.pexels.com/photos/26852497/pexels-photo-26852497.png?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Bags', 'bags', 'Backpacks, totes, and everyday carry', 'https://images.pexels.com/photos/26736144/pexels-photo-26736144.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Eyewear', 'eyewear', 'Sunglasses and frames', 'https://images.pexels.com/photos/32677205/pexels-photo-32677205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Home', 'home', 'Mugs and essentials for your space', 'https://images.pexels.com/photos/12480291/pexels-photo-12480291.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
ON CONFLICT (slug) DO NOTHING;

-- ---------- seed: products ----------
INSERT INTO products (name, slug, description, price, stock, image_url, images, category_id, rating, featured) VALUES
  ('Aurora Wireless Headphones', 'aurora-wireless-headphones',
   'Immersive over-ear headphones with active noise cancellation, 40-hour battery life, and plush memory-foam ear cushions for all-day comfort.',
   199.00, 32,
   'https://images.pexels.com/photos/9058883/pexels-photo-9058883.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/9058883/pexels-photo-9058883.jpeg?auto=compress&cs=tinysrgb&h=650&w=940','https://images.pexels.com/photos/9058878/pexels-photo-9058878.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='audio'), 4.7, true),
  ('Studio Pro Over-Ear', 'studio-pro-over-ear',
   'Reference-grade studio headphones with a wide soundstage and detachable cable, engineered for producers and audiophiles.',
   299.00, 18,
   'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='audio'), 4.9, true),
  ('Pulse Smartwatch Series 6', 'pulse-smartwatch-series-6',
   'A sleek smartwatch with heart-rate tracking, GPS, sleep insights, and a vivid always-on display. Water-resistant to 50 meters.',
   249.00, 25,
   'https://images.pexels.com/photos/12564670/pexels-photo-12564670.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/12564670/pexels-photo-12564670.jpeg?auto=compress&cs=tinysrgb&h=650&w=940','https://images.pexels.com/photos/11677077/pexels-photo-11677077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='wearables'), 4.6, true),
  ('Chrono Fit Tracker', 'chrono-fit-tracker',
   'A lightweight fitness tracker with 14-day battery, workout detection, and a slim AMOLED touchscreen.',
   179.00, 40,
   'https://images.pexels.com/photos/12880803/pexels-photo-12880803.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/12880803/pexels-photo-12880803.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='wearables'), 4.4, false),
  ('Velocity Runner Sneakers', 'velocity-runner-sneakers',
   'Responsive cushioning and a breathable knit upper built for daily runs and long-distance comfort.',
   129.00, 55,
   'https://images.pexels.com/photos/26852497/pexels-photo-26852497.png?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/26852497/pexels-photo-26852497.png?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='footwear'), 4.5, true),
  ('Cloudstep Trainers', 'cloudstep-trainers',
   'Everyday trainers with a cloud-soft midsole and durable outsole, perfect for the street or the gym.',
   149.00, 38,
   'https://images.pexels.com/photos/27008326/pexels-photo-27008326.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/27008326/pexels-photo-27008326.jpeg?auto=compress&cs=tinysrgb&h=650&w=940','https://images.pexels.com/photos/27008322/pexels-photo-27008322.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='footwear'), 4.3, false),
  ('Urban Explorer Backpack', 'urban-explorer-backpack',
   'A water-resistant 22L backpack with a padded laptop sleeve, hidden pockets, and rugged hardware for daily commutes.',
   89.00, 47,
   'https://images.pexels.com/photos/26736144/pexels-photo-26736144.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/26736144/pexels-photo-26736144.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='bags'), 4.8, true),
  ('Heritage Leather Tote', 'heritage-leather-tote',
   'A full-grain leather tote that ages beautifully, with a roomy interior and brass fittings for timeless style.',
   159.00, 21,
   'https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='bags'), 4.7, false),
  ('Eclipse Polarized Sunglasses', 'eclipse-polarized-sunglasses',
   'Polarized lenses with 100% UV protection and a lightweight acetate frame for crisp, glare-free vision.',
   119.00, 33,
   'https://images.pexels.com/photos/32677205/pexels-photo-32677205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/32677205/pexels-photo-32677205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='eyewear'), 4.6, true),
  ('Riviera Aviator Shades', 'riviera-aviator-shades',
   'Classic aviators with a stainless-steel frame and gradient lenses for effortless summer style.',
   139.00, 29,
   'https://images.pexels.com/photos/10237074/pexels-photo-10237074.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/10237074/pexels-photo-10237074.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='eyewear'), 4.4, false),
  ('Artisan Ceramic Mug', 'artisan-ceramic-mug',
   'A hand-glazed 12oz ceramic mug with a soft matte finish, microwave and dishwasher safe.',
   24.00, 80,
   'https://images.pexels.com/photos/12480291/pexels-photo-12480291.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/12480291/pexels-photo-12480291.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='home'), 4.5, false),
  ('Vintage Cafe Mug', 'vintage-cafe-mug',
   'A retro 14oz mug with a classic enamel-style finish, perfect for slow mornings and strong coffee.',
   19.00, 65,
   'https://images.pexels.com/photos/1724184/pexels-photo-1724184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   ARRAY['https://images.pexels.com/photos/1724184/pexels-photo-1724184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
   (SELECT id FROM categories WHERE slug='home'), 4.2, false)
ON CONFLICT (slug) DO NOTHING;
