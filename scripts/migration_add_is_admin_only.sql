-- ============================================================
-- Migration: add is_admin_only column and update DB trigger
-- Run this ONCE in the Supabase SQL Editor:
--   Database → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. Add the column (safe to run multiple times)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin_only boolean DEFAULT false;

-- 2. Fix Manuela's existing row (and any other admin-only users already in DB)
--    Mark them correctly based on their user_metadata.
--    This updates existing rows whose auth.users metadata has is_admin_only = true.
UPDATE public.profiles p
SET
  is_admin_only = true,
  user_role     = 'hr_admin'
WHERE p.id IN (
  SELECT id FROM auth.users
  WHERE (raw_user_meta_data->>'is_admin_only')::boolean = true
);

-- 3. Update the trigger so future admin-only sign-ups are handled correctly
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
    is_admin_only,
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
    CASE WHEN (NEW.raw_user_meta_data->>'is_admin_only')::boolean THEN 'hr_admin' ELSE 'consultant' END,
    true,
    COALESCE((NEW.raw_user_meta_data->>'is_admin_only')::boolean, false),
    '{}',
    '{}',
    '[]',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
