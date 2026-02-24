-- Migration: Multi-tenancy support
-- Description: Adds 'shops' table and links existing tables to shops for multi-tenant isolation.

-- 1. Create 'shops' table
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- 2. Add 'shop_id' column to relevant tables
DO $$
BEGIN
  -- List of tables to add shop_id to
  -- categories, products, modifier_sets, modifiers, orders, shop_settings, daily_order_counter, audit_logs, user_roles
  
  -- categories
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='shop_id') THEN
    ALTER TABLE public.categories ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;

  -- products
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='shop_id') THEN
    ALTER TABLE public.products ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;

  -- modifier_sets
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modifier_sets' AND column_name='shop_id') THEN
    ALTER TABLE public.modifier_sets ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;

  -- modifiers (optional but good for consistency, though they link via modifier_set)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modifiers' AND column_name='shop_id') THEN
    ALTER TABLE public.modifiers ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;

  -- orders
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shop_id') THEN
    ALTER TABLE public.orders ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;

  -- shop_settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shop_settings' AND column_name='shop_id') THEN
    ALTER TABLE public.shop_settings ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;

  -- daily_order_counter
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_order_counter' AND column_name='shop_id') THEN
    ALTER TABLE public.daily_order_counter ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;

  -- audit_logs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='shop_id') THEN
    ALTER TABLE public.audit_logs ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;

  -- user_roles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_roles' AND column_name='shop_id') THEN
    ALTER TABLE public.user_roles ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;

END $$;

-- 3. Adjust constraints

-- daily_order_counter: composite primary key (counter_date, shop_id)
-- First remove the existing primary key if it exists as just counter_date
ALTER TABLE public.daily_order_counter DROP CONSTRAINT IF EXISTS daily_order_counter_pkey;
ALTER TABLE public.daily_order_counter ADD PRIMARY KEY (counter_date, shop_id);

-- 4. Update the generate_order_number function to be shop-aware
CREATE OR REPLACE FUNCTION public.generate_order_number(_shop_id UUID)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  today DATE := CURRENT_DATE;
  seq INT;
  prefix CHAR;
  lock_id BIGINT;
BEGIN
  -- Create a unique lock ID based on the date and shop_id (hash of shop_id)
  -- This ensures different shops don't block each other
  lock_id := (EXTRACT(EPOCH FROM today)::BIGINT) + (('x' || substr(md5(_shop_id::text), 1, 8))::bit(32)::bigint);
  
  -- Acquire an advisory lock to prevent race conditions for this specific shop/date
  PERFORM pg_advisory_xact_lock(lock_id);
  
  INSERT INTO daily_order_counter (counter_date, shop_id, last_sequence) 
  VALUES (today, _shop_id, 1)
  ON CONFLICT (counter_date, shop_id) DO UPDATE 
  SET last_sequence = daily_order_counter.last_sequence + 1
  RETURNING last_sequence INTO seq;
  
  prefix := chr(65 + ((seq - 1) / 999));
  RETURN prefix || lpad(((seq - 1) % 999 + 1)::text, 3, '0');
END;
$function$;

-- 5. RLS Policies for Data Isolation
-- Note: These policies assume that the user's shop_id is stored in their session or accessible via a join.
-- For a basic setup, we'll check if the user belongs to the shop via user_roles.

-- Policy helper function
CREATE OR REPLACE FUNCTION public.get_user_shops()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT shop_id FROM public.user_roles WHERE user_id = auth.uid();
$$;

-- Apply isolation policies (Example for categories)
DROP POLICY IF EXISTS "Everyone can read categories" ON public.categories;
CREATE POLICY "Users can read their shop categories" ON public.categories
  FOR SELECT TO authenticated USING (shop_id IN (SELECT public.get_user_shops()));

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage their shop categories" ON public.categories
  FOR ALL TO authenticated USING (
    shop_id IN (SELECT public.get_user_shops()) AND public.has_role(auth.uid(), 'admin')
  );

-- Repeat for other tables... (simplified for the migration)

-- Products
DROP POLICY IF EXISTS "Everyone can read products" ON public.products;
CREATE POLICY "Users can read their shop products" ON public.products
  FOR SELECT TO authenticated USING (shop_id IN (SELECT public.get_user_shops()));

-- Orders
DROP POLICY IF EXISTS "Authenticated can read orders" ON public.orders;
CREATE POLICY "Users can read their shop orders" ON public.orders
  FOR SELECT TO authenticated USING (shop_id IN (SELECT public.get_user_shops()));

-- Shop Settings
DROP POLICY IF EXISTS "Everyone can read shop_settings" ON public.shop_settings;
CREATE POLICY "Users can read their shop settings" ON public.shop_settings
  FOR SELECT TO authenticated USING (shop_id IN (SELECT public.get_user_shops()));

-- Update triggers
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
