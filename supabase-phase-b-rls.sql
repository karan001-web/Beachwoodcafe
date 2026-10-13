-- ============================================================================
-- BEACHWOOD CAFE - PHASE B ROW LEVEL SECURITY (RLS) MIGRATION
-- Run in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================================================
-- IMPORTANT: Do not execute this script until server-side application changes 
-- and tests are verified, and explicit user approval is granted.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 0: PRE-MIGRATION READ-ONLY INSPECTION (Safe to run anytime)
-- ----------------------------------------------------------------------------
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('orders', 'reservations');
--
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name IN ('orders', 'reservations')
-- ORDER BY table_name, ordinal_position;

-- ----------------------------------------------------------------------------
-- STEP 1: APPLY IDEMPOTENT PRODUCTION MIGRATION
-- ----------------------------------------------------------------------------
BEGIN;

-- 1. Ensure cancel_token column exists for durable customer ownership token persistence
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancel_token TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_cancel_token 
ON public.orders (cancel_token);

-- 2. Activate Row Level Security on both tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 3. Safely drop all 8 legacy permissive policies (USING true / WITH CHECK true)
DROP POLICY IF EXISTS "Public select orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
DROP POLICY IF EXISTS "Public delete orders" ON public.orders;

DROP POLICY IF EXISTS "Public select reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public delete reservations" ON public.reservations;

-- 4. Grant full authoritative access exclusively to backend service_role
-- (In Supabase, service_role bypasses RLS by default; explicit policies guarantee persistence)
DROP POLICY IF EXISTS "Service role full access orders" ON public.orders;
CREATE POLICY "Service role full access orders" 
ON public.orders 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access reservations" ON public.reservations;
CREATE POLICY "Service role full access reservations" 
ON public.reservations 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 5. Explicit default denial for anonymous (anon) callers
-- In PostgreSQL, when RLS is enabled and no policy matches the 'anon' role,
-- all operations (SELECT, INSERT, UPDATE, DELETE) are strictly denied.
-- Direct PostgREST queries using the public anon key will return empty sets or 403 Forbidden.

COMMIT;

-- ----------------------------------------------------------------------------
-- STEP 2: POST-MIGRATION VERIFICATION QUERY
-- ----------------------------------------------------------------------------
-- SELECT schemaname, tablename, policyname, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('orders', 'reservations');

-- ----------------------------------------------------------------------------
-- EMERGENCY RECOVERY PROCEDURE (Reserved exclusively for catastrophic triage)
-- Note: Do NOT restore open access as standard recovery. First verify that
-- SUPABASE_SERVICE_ROLE_KEY is correctly configured in Vercel project settings.
-- ----------------------------------------------------------------------------
-- BEGIN;
-- DROP POLICY IF EXISTS "Service role full access orders" ON public.orders;
-- DROP POLICY IF EXISTS "Service role full access reservations" ON public.reservations;
-- CREATE POLICY "Public select orders" ON public.orders FOR SELECT USING (true);
-- CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);
-- CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);
-- CREATE POLICY "Public select reservations" ON public.reservations FOR SELECT USING (true);
-- CREATE POLICY "Public insert reservations" ON public.reservations FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Public update reservations" ON public.reservations FOR UPDATE USING (true);
-- CREATE POLICY "Public delete reservations" ON public.reservations FOR DELETE USING (true);
-- COMMIT;
