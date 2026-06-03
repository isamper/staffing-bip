-- Supabase migration: shared admin data tables
-- Run this in the Supabase SQL editor to enable cross-admin data sharing.

-- ── kimble_cache ────────────────────────────────────────────────────────────
-- Stores the last Kimble import result (singleton row, id always = 1).
CREATE TABLE IF NOT EXISTS public.kimble_cache (
  id          int         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data        jsonb       NOT NULL,
  file_name   text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kimble_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can read kimble_cache"
  ON public.kimble_cache FOR SELECT
  TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can upsert kimble_cache"
  ON public.kimble_cache FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ── project_assignments ──────────────────────────────────────────────────────
-- Mirrors the ProjectAssignment type: Kimble-generated and manual assignments.
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id                   text        PRIMARY KEY,
  project_id           text        NOT NULL,
  consultant_id        text        NOT NULL,
  dedication_percentage int        NOT NULL DEFAULT 100,
  start_date           text,
  end_date             text,
  assigned_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can read project_assignments"
  ON public.project_assignments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can modify project_assignments"
  ON public.project_assignments FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ── beach_assignments ────────────────────────────────────────────────────────
-- Beach/internal task assignments for consultants on the bench.
CREATE TABLE IF NOT EXISTS public.beach_assignments (
  id                   text        PRIMARY KEY,
  consultant_id        text        NOT NULL,
  task_type            text        NOT NULL,
  description          text        NOT NULL DEFAULT '',
  end_date             text        NOT NULL,
  dedication_percentage int        NOT NULL DEFAULT 100,
  assigned_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beach_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can read beach_assignments"
  ON public.beach_assignments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can modify beach_assignments"
  ON public.beach_assignments FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ── vacation_requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id            text        PRIMARY KEY,
  consultant_id text        NOT NULL,
  start_date    text        NOT NULL,
  end_date      text        NOT NULL,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can read vacation_requests"
  ON public.vacation_requests FOR SELECT
  TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can modify vacation_requests"
  ON public.vacation_requests FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ── deactivated_consultants ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deactivated_consultants (
  consultant_id  text        PRIMARY KEY,
  deactivated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deactivated_consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can read deactivated_consultants"
  ON public.deactivated_consultants FOR SELECT
  TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can modify deactivated_consultants"
  ON public.deactivated_consultants FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
