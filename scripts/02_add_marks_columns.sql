-- Migration: add marks columns to assignments table
-- Run this in your database (Supabase SQL editor, supabase CLI, or psql)

BEGIN;

ALTER TABLE IF EXISTS public.assignments
  ADD COLUMN IF NOT EXISTS marks_obtained integer;

ALTER TABLE IF EXISTS public.assignments
  ADD COLUMN IF NOT EXISTS marks_total integer;

COMMIT;

-- To rollback (manual):
-- ALTER TABLE public.assignments DROP COLUMN IF EXISTS marks_obtained;
-- ALTER TABLE public.assignments DROP COLUMN IF EXISTS marks_total;
