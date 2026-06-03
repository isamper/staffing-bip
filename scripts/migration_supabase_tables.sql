-- Supabase migration: shared admin data tables
-- Run this in the Supabase SQL Editor (Database → SQL Editor → New query → Run)

-- ── kimble_cache ─────────────────────────────────────────────────────────────
-- Singleton row (id=1) storing the last Kimble import result JSON.
CREATE TABLE IF NOT EXISTS public.kimble_cache (
  id          int         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data        jsonb       NOT NULL,
  file_name   text,
  imported_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kimble_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kimble_cache_all" ON public.kimble_cache;
CREATE POLICY "kimble_cache_all" ON public.kimble_cache FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── project_assignments ───────────────────────────────────────────────────────
-- All project assignments (Kimble-generated and manual).
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id                    text        PRIMARY KEY,
  project_id            text        NOT NULL,
  consultant_id         text        NOT NULL,
  dedication_percentage int         NOT NULL DEFAULT 100,
  start_date            text,
  end_date              text,
  assigned_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_assignments_all" ON public.project_assignments;
CREATE POLICY "project_assignments_all" ON public.project_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── beach_assignments ─────────────────────────────────────────────────────────
-- Beach / internal task assignments for consultants.
CREATE TABLE IF NOT EXISTS public.beach_assignments (
  id                    text        PRIMARY KEY,
  consultant_id         text        NOT NULL,
  task_type             text        NOT NULL,
  description           text        NOT NULL DEFAULT '',
  end_date              text        NOT NULL,
  dedication_percentage int         NOT NULL DEFAULT 100,
  assigned_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.beach_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "beach_assignments_all" ON public.beach_assignments;
CREATE POLICY "beach_assignments_all" ON public.beach_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── vacation_requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id            text        PRIMARY KEY,
  consultant_id text        NOT NULL,
  start_date    text        NOT NULL,
  end_date      text        NOT NULL,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vacation_requests_all" ON public.vacation_requests;
CREATE POLICY "vacation_requests_all" ON public.vacation_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── deactivated_consultants ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deactivated_consultants (
  consultant_id  text        PRIMARY KEY,
  deactivated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deactivated_consultants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deactivated_consultants_all" ON public.deactivated_consultants;
CREATE POLICY "deactivated_consultants_all" ON public.deactivated_consultants FOR ALL TO authenticated USING (true) WITH CHECK (true);
