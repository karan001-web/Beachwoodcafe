-- ============================================================================
-- BEACHWOOD CAFE - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================================================

-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  placed_at TEXT,
  timestamp BIGINT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  fulfilment_type TEXT NOT NULL DEFAULT 'pickup',
  delivery_address TEXT DEFAULT '',
  delivery_apt TEXT DEFAULT '',
  delivery_city TEXT DEFAULT '',
  delivery_zip TEXT DEFAULT '',
  delivery_notes TEXT DEFAULT '',
  include_utensils BOOLEAN DEFAULT false,
  order_note TEXT DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'counter',
  card_last4 TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  tip_amount NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  status_updated_at BIGINT,
  cancelled_by TEXT,
  cancelled_at BIGINT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON public.orders (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- 2. TABLE RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.reservations (
  id TEXT PRIMARY KEY,
  reservation_number TEXT NOT NULL,
  created_at_str TEXT,
  timestamp BIGINT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  party_size TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  seating TEXT NOT NULL,
  special_requests TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy reservation lookups
CREATE INDEX IF NOT EXISTS idx_reservations_number ON public.reservations (reservation_number);
CREATE INDEX IF NOT EXISTS idx_reservations_timestamp ON public.reservations (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON public.reservations (phone);

-- 3. ENABLE SUPABASE REALTIME
-- (Allows instant live updates across devices without refreshing the browser)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;
END $$;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access so customers and cafe staff can view and manage orders/reservations
DROP POLICY IF EXISTS "Public select orders" ON public.orders;
CREATE POLICY "Public select orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete orders" ON public.orders;
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public select reservations" ON public.reservations;
CREATE POLICY "Public select reservations" ON public.reservations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert reservations" ON public.reservations;
CREATE POLICY "Public insert reservations" ON public.reservations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update reservations" ON public.reservations;
CREATE POLICY "Public update reservations" ON public.reservations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete reservations" ON public.reservations;
CREATE POLICY "Public delete reservations" ON public.reservations FOR DELETE USING (true);
