-- ============================================================================
-- BEACHWOOD CAFE - SAFE ADDITIVE MIGRATION: ADD cancel_token COLUMN
-- ============================================================================
-- Purpose:
-- Adds the missing 'cancel_token' column and index to the public.orders table.
--
-- Safety Guarantees:
-- 1. Non-destructive: Does NOT modify, truncate, or delete any existing tables or rows.
-- 2. Idempotent: Uses 'IF NOT EXISTS' so it is completely safe to run multiple times.
-- 3. Zero Downtime: Adding a nullable TEXT column in PostgreSQL is instantaneous.
--
-- Instructions:
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- 1. Add the cancel_token column if not present
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancel_token TEXT;

-- 2. Add an index for rapid customer ownership verification lookups
CREATE INDEX IF NOT EXISTS idx_orders_cancel_token 
ON public.orders (cancel_token);
