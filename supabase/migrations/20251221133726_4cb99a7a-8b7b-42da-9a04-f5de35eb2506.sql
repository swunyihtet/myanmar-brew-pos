-- =====================================================
-- COFFEE POS FULL SCHEMA + SEED DATA
-- =====================================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('cashier', 'supervisor', 'admin');
CREATE TYPE public.order_status AS ENUM ('paid', 'in_progress', 'ready', 'completed', 'voided', 'refunded');
CREATE TYPE public.order_type AS ENUM ('dine_in', 'takeaway');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'mobile');
CREATE TYPE public.modifier_type AS ENUM ('single', 'multiple');

-- 2. CATEGORIES TABLE
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '☕',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read categories" ON public.categories FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_mm TEXT,
  price_mmk INT NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read products" ON public.products FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);

-- 4. MODIFIER SETS TABLE
CREATE TABLE public.modifier_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.modifier_type DEFAULT 'single',
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.modifier_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read modifier_sets" ON public.modifier_sets FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage modifier_sets" ON public.modifier_sets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. MODIFIERS TABLE
CREATE TABLE public.modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_set_id UUID REFERENCES public.modifier_sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta_mmk INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read modifiers" ON public.modifiers FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage modifiers" ON public.modifiers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_modifiers_set ON public.modifiers(modifier_set_id);

-- 6. PRODUCT MODIFIER SETS
CREATE TABLE public.product_modifier_sets (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  modifier_set_id UUID REFERENCES public.modifier_sets(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, modifier_set_id)
);
ALTER TABLE public.product_modifier_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read product_modifier_sets" ON public.product_modifier_sets FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage product_modifier_sets" ON public.product_modifier_sets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. USER ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'cashier',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 8. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'cashier');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. DAILY ORDER COUNTER
CREATE TABLE public.daily_order_counter (
  counter_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  last_sequence INT DEFAULT 0
);
ALTER TABLE public.daily_order_counter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can use counter" ON public.daily_order_counter FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  today DATE := CURRENT_DATE;
  seq INT;
  prefix CHAR;
BEGIN
  INSERT INTO daily_order_counter (counter_date, last_sequence) VALUES (today, 1)
  ON CONFLICT (counter_date) DO UPDATE SET last_sequence = daily_order_counter.last_sequence + 1
  RETURNING last_sequence INTO seq;
  prefix := chr(65 + ((seq - 1) / 999));
  RETURN prefix || lpad(((seq - 1) % 999 + 1)::text, 3, '0');
END;
$$;

-- 10. ORDERS TABLE
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL DEFAULT public.generate_order_number(),
  order_type public.order_type DEFAULT 'dine_in',
  status public.order_status DEFAULT 'paid',
  customer_name TEXT,
  customer_phone TEXT,
  subtotal_mmk INT DEFAULT 0,
  discount_mmk INT DEFAULT 0,
  tax_mmk INT DEFAULT 0,
  total_mmk INT DEFAULT 0,
  payment_method public.payment_method,
  paid_mmk INT DEFAULT 0,
  change_mmk INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read orders" ON public.orders FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Authenticated can create orders" ON public.orders FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Authenticated can update orders" ON public.orders FOR UPDATE TO authenticated, anon USING (true);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);

-- 11. ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name_snapshot TEXT NOT NULL,
  unit_price_mmk INT DEFAULT 0,
  qty INT DEFAULT 1,
  line_total_mmk INT DEFAULT 0,
  notes TEXT
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read order_items" ON public.order_items FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Authenticated can create order_items" ON public.order_items FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- 12. ORDER ITEM MODIFIERS TABLE
CREATE TABLE public.order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE NOT NULL,
  modifier_name_snapshot TEXT NOT NULL,
  price_delta_mmk INT DEFAULT 0
);
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read order_item_modifiers" ON public.order_item_modifiers FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Authenticated can create order_item_modifiers" ON public.order_item_modifiers FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE INDEX idx_order_item_modifiers_item ON public.order_item_modifiers(order_item_id);

-- 13. SHOP SETTINGS TABLE
CREATE TABLE public.shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'Golden Bean Coffee',
  address TEXT DEFAULT 'No. 42, Shwedagon Pagoda Road, Yangon',
  phone TEXT DEFAULT '+95 9 123 456 789',
  tax_enabled BOOLEAN DEFAULT true,
  tax_rate NUMERIC(5,2) DEFAULT 5.00,
  tax_inclusive BOOLEAN DEFAULT false,
  receipt_header TEXT DEFAULT 'Welcome to Golden Bean!',
  receipt_footer TEXT DEFAULT 'Thank you for visiting!',
  currency TEXT DEFAULT 'MMK',
  currency_symbol TEXT DEFAULT 'Ks',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read shop_settings" ON public.shop_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can update shop_settings" ON public.shop_settings FOR UPDATE TO authenticated USING (true);

-- 14. AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create audit_logs" ON public.audit_logs FOR INSERT TO authenticated, anon WITH CHECK (true);

-- 15. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Shop Settings
INSERT INTO public.shop_settings (name, address, phone, tax_enabled, tax_rate, receipt_header, receipt_footer)
VALUES ('Golden Bean Coffee', 'No. 42, Shwedagon Pagoda Road, Yangon', '+95 9 123 456 789', true, 5.00, 'Welcome to Golden Bean!', 'Thank you for visiting!');

-- Categories
INSERT INTO public.categories (id, name, icon, sort_order) VALUES
  ('c1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coffee', '☕', 1),
  ('c1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tea', '🍵', 2),
  ('c1000001-cccc-cccc-cccc-cccccccccccc', 'Frappe', '🧋', 3),
  ('c1000001-dddd-dddd-dddd-dddddddddddd', 'Pastry', '🥐', 4),
  ('c1000001-eeee-eeee-eeee-eeeeeeeeeeee', 'Add-ons', '✨', 5),
  ('c1000001-ffff-ffff-ffff-ffffffffffff', 'Bottled', '🧃', 6),
  ('c1000001-1111-1111-1111-111111111111', 'Merch', '👕', 7);

-- Modifier Sets
INSERT INTO public.modifier_sets (id, name, type, is_required) VALUES
  ('d1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Size', 'single', true),
  ('d1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hot / Iced', 'single', true),
  ('d1000001-cccc-cccc-cccc-cccccccccccc', 'Sweetness', 'single', false),
  ('d1000001-dddd-dddd-dddd-dddddddddddd', 'Milk', 'single', false),
  ('d1000001-eeee-eeee-eeee-eeeeeeeeeeee', 'Extra Shots', 'single', false),
  ('d1000001-ffff-ffff-ffff-ffffffffffff', 'Toppings', 'multiple', false);

-- Modifiers
INSERT INTO public.modifiers (modifier_set_id, name, price_delta_mmk, sort_order) VALUES
  ('d1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Small', 0, 1),
  ('d1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Medium', 500, 2),
  ('d1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Large', 1000, 3),
  ('d1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hot', 0, 1),
  ('d1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Iced', 300, 2),
  ('d1000001-cccc-cccc-cccc-cccccccccccc', '0%', 0, 1),
  ('d1000001-cccc-cccc-cccc-cccccccccccc', '25%', 0, 2),
  ('d1000001-cccc-cccc-cccc-cccccccccccc', '50%', 0, 3),
  ('d1000001-cccc-cccc-cccc-cccccccccccc', '75%', 0, 4),
  ('d1000001-cccc-cccc-cccc-cccccccccccc', '100%', 0, 5),
  ('d1000001-dddd-dddd-dddd-dddddddddddd', 'Whole Milk', 0, 1),
  ('d1000001-dddd-dddd-dddd-dddddddddddd', 'Skim Milk', 0, 2),
  ('d1000001-dddd-dddd-dddd-dddddddddddd', 'Oat Milk', 500, 3),
  ('d1000001-dddd-dddd-dddd-dddddddddddd', 'Soy Milk', 400, 4),
  ('d1000001-dddd-dddd-dddd-dddddddddddd', 'Almond Milk', 600, 5),
  ('d1000001-eeee-eeee-eeee-eeeeeeeeeeee', 'No Extra', 0, 1),
  ('d1000001-eeee-eeee-eeee-eeeeeeeeeeee', '+1 Shot', 800, 2),
  ('d1000001-eeee-eeee-eeee-eeeeeeeeeeee', '+2 Shots', 1500, 3),
  ('d1000001-eeee-eeee-eeee-eeeeeeeeeeee', '+3 Shots', 2200, 4),
  ('d1000001-ffff-ffff-ffff-ffffffffffff', 'Whipped Cream', 500, 1),
  ('d1000001-ffff-ffff-ffff-ffffffffffff', 'Caramel Drizzle', 400, 2),
  ('d1000001-ffff-ffff-ffff-ffffffffffff', 'Chocolate Drizzle', 400, 3),
  ('d1000001-ffff-ffff-ffff-ffffffffffff', 'Cinnamon', 200, 4);

-- Products
INSERT INTO public.products (id, category_id, name, price_mmk, is_popular) VALUES
  ('e1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Americano', 2500, true),
  ('e1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Caffe Latte', 3500, true),
  ('e1000001-cccc-cccc-cccc-cccccccccccc', 'c1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cappuccino', 3500, true),
  ('e1000001-dddd-dddd-dddd-dddddddddddd', 'c1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Caffe Mocha', 4000, false),
  ('e1000001-eeee-eeee-eeee-eeeeeeeeeeee', 'c1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Espresso', 2000, false),
  ('e1000001-ffff-ffff-ffff-ffffffffffff', 'c1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Flat White', 3800, false),
  ('e1000002-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Myanmar Milk Tea', 1500, true),
  ('e1000002-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lemon Tea', 1800, false),
  ('e1000002-cccc-cccc-cccc-cccccccccccc', 'c1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Green Tea Latte', 3200, false),
  ('e1000002-dddd-dddd-dddd-dddddddddddd', 'c1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Thai Tea', 2800, false),
  ('e1000003-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1000001-cccc-cccc-cccc-cccccccccccc', 'Caramel Frappe', 4500, true),
  ('e1000003-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c1000001-cccc-cccc-cccc-cccccccccccc', 'Mocha Frappe', 4500, false),
  ('e1000003-cccc-cccc-cccc-cccccccccccc', 'c1000001-cccc-cccc-cccc-cccccccccccc', 'Matcha Frappe', 4800, false),
  ('e1000004-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1000001-dddd-dddd-dddd-dddddddddddd', 'Butter Croissant', 2500, true),
  ('e1000004-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c1000001-dddd-dddd-dddd-dddddddddddd', 'Chocolate Muffin', 2200, false),
  ('e1000004-cccc-cccc-cccc-cccccccccccc', 'c1000001-dddd-dddd-dddd-dddddddddddd', 'Blueberry Muffin', 2200, false),
  ('e1000004-dddd-dddd-dddd-dddddddddddd', 'c1000001-dddd-dddd-dddd-dddddddddddd', 'Cinnamon Roll', 2800, false),
  ('e1000005-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1000001-eeee-eeee-eeee-eeeeeeeeeeee', 'Extra Espresso Shot', 800, false),
  ('e1000005-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c1000001-eeee-eeee-eeee-eeeeeeeeeeee', 'Flavored Syrup', 500, false),
  ('e1000005-cccc-cccc-cccc-cccccccccccc', 'c1000001-eeee-eeee-eeee-eeeeeeeeeeee', 'Oat Milk Upgrade', 500, false),
  ('e1000006-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1000001-ffff-ffff-ffff-ffffffffffff', 'Mineral Water', 800, false),
  ('e1000006-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c1000001-ffff-ffff-ffff-ffffffffffff', 'Sparkling Water', 1500, false),
  ('e1000006-cccc-cccc-cccc-cccccccccccc', 'c1000001-ffff-ffff-ffff-ffffffffffff', 'Orange Juice', 2500, false),
  ('e1000007-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1000001-1111-1111-1111-111111111111', 'Shop Tumbler', 15000, false),
  ('e1000007-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c1000001-1111-1111-1111-111111111111', 'Canvas Tote Bag', 8000, false);

-- Product Modifier Sets mapping
INSERT INTO public.product_modifier_sets (product_id, modifier_set_id) VALUES
  ('e1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('e1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1000001-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('e1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('e1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-cccc-cccc-cccc-cccccccccccc'),
  ('e1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-dddd-dddd-dddd-dddddddddddd'),
  ('e1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('e1000001-cccc-cccc-cccc-cccccccccccc', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000001-cccc-cccc-cccc-cccccccccccc', 'd1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('e1000001-cccc-cccc-cccc-cccccccccccc', 'd1000001-dddd-dddd-dddd-dddddddddddd'),
  ('e1000001-cccc-cccc-cccc-cccccccccccc', 'd1000001-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('e1000001-dddd-dddd-dddd-dddddddddddd', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000001-dddd-dddd-dddd-dddddddddddd', 'd1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('e1000001-dddd-dddd-dddd-dddddddddddd', 'd1000001-cccc-cccc-cccc-cccccccccccc'),
  ('e1000001-dddd-dddd-dddd-dddddddddddd', 'd1000001-dddd-dddd-dddd-dddddddddddd'),
  ('e1000001-dddd-dddd-dddd-dddddddddddd', 'd1000001-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('e1000001-dddd-dddd-dddd-dddddddddddd', 'd1000001-ffff-ffff-ffff-ffffffffffff'),
  ('e1000001-eeee-eeee-eeee-eeeeeeeeeeee', 'd1000001-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('e1000001-ffff-ffff-ffff-ffffffffffff', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000001-ffff-ffff-ffff-ffffffffffff', 'd1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('e1000001-ffff-ffff-ffff-ffffffffffff', 'd1000001-dddd-dddd-dddd-dddddddddddd'),
  ('e1000001-ffff-ffff-ffff-ffffffffffff', 'd1000001-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('e1000002-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000002-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('e1000002-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1000001-cccc-cccc-cccc-cccccccccccc'),
  ('e1000002-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000002-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('e1000002-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-cccc-cccc-cccc-cccccccccccc'),
  ('e1000002-cccc-cccc-cccc-cccccccccccc', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000002-cccc-cccc-cccc-cccccccccccc', 'd1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('e1000002-cccc-cccc-cccc-cccccccccccc', 'd1000001-cccc-cccc-cccc-cccccccccccc'),
  ('e1000002-cccc-cccc-cccc-cccccccccccc', 'd1000001-dddd-dddd-dddd-dddddddddddd'),
  ('e1000002-dddd-dddd-dddd-dddddddddddd', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000002-dddd-dddd-dddd-dddddddddddd', 'd1000001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('e1000002-dddd-dddd-dddd-dddddddddddd', 'd1000001-cccc-cccc-cccc-cccccccccccc'),
  ('e1000003-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000003-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1000001-cccc-cccc-cccc-cccccccccccc'),
  ('e1000003-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1000001-ffff-ffff-ffff-ffffffffffff'),
  ('e1000003-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000003-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-cccc-cccc-cccc-cccccccccccc'),
  ('e1000003-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('e1000003-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd1000001-ffff-ffff-ffff-ffffffffffff'),
  ('e1000003-cccc-cccc-cccc-cccccccccccc', 'd1000001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e1000003-cccc-cccc-cccc-cccccccccccc', 'd1000001-cccc-cccc-cccc-cccccccccccc'),
  ('e1000003-cccc-cccc-cccc-cccccccccccc', 'd1000001-ffff-ffff-ffff-ffffffffffff');