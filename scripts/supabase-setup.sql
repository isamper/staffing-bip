-- ============================================================
-- bench. — Supabase database setup
-- Run this once in the Supabase SQL Editor
-- (Database → SQL Editor → New query → paste → Run)
-- ============================================================

-- 1. Add all needed columns to the profiles table
--    (safe to run multiple times — IF NOT EXISTS prevents errors)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email            text UNIQUE,
  ADD COLUMN IF NOT EXISTS name             text,
  ADD COLUMN IF NOT EXISTS role_title       text DEFAULT 'Consultor',
  ADD COLUMN IF NOT EXISTS seniority        text DEFAULT 'Consultant',
  ADD COLUMN IF NOT EXISTS practice_area    text,
  ADD COLUMN IF NOT EXISTS skills           text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_from   text,
  ADD COLUMN IF NOT EXISTS internship_start_date text,
  ADD COLUMN IF NOT EXISTS internship_end_date   text,
  ADD COLUMN IF NOT EXISTS user_role        text    DEFAULT 'consultant',
  ADD COLUMN IF NOT EXISTS is_active        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS photo_url        text,
  ADD COLUMN IF NOT EXISTS bio              text,
  ADD COLUMN IF NOT EXISTS education        text,
  ADD COLUMN IF NOT EXISTS languages        text,
  ADD COLUMN IF NOT EXISTS years_of_experience integer,
  ADD COLUMN IF NOT EXISTS certifications   text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience       jsonb   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS annual_dedication_pct numeric,
  ADD COLUMN IF NOT EXISTS industry_experience   text[],
  ADD COLUMN IF NOT EXISTS kimble_service_areas  text[],
  ADD COLUMN IF NOT EXISTS kimble_name      text;   -- exact name as it appears in Kimble

-- 2. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read any profile (needed for admin views)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- The trigger function runs as SECURITY DEFINER so it bypasses RLS for inserts
-- No extra insert policy needed.

-- 3. Trigger function — fires when a new Supabase auth user is created
--    (handles both direct sign-up and admin invite)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role_title,
    seniority,
    user_role,
    is_active,
    skills,
    certifications,
    experience,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name',
             initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))),
    COALESCE(NEW.raw_user_meta_data->>'role_title', 'Consultor'),
    COALESCE(NEW.raw_user_meta_data->>'seniority',  'Consultant'),
    'consultant',
    true,
    '{}',
    '{}',
    '[]',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
