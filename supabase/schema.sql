-- ============================================================
-- bench. by Bip Consulting — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database
-- ============================================================

-- 1. Projects (created before profiles to avoid circular FK)
CREATE TABLE IF NOT EXISTS projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  client          text NOT NULL,
  industry        text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'Open'
                    CHECK (status IN ('Open','Partially Staffed','Fully Staffed','Active')),
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  team_size       int NOT NULL,
  skills_required text[] NOT NULL DEFAULT '{}',
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now()
);

-- 2. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name               text NOT NULL,
  role_title         text NOT NULL,
  seniority          text NOT NULL CHECK (seniority IN ('Intern','Consultant','Senior Consultant','Associate','Senior Associate','Manager','Senior Manager','Director','Partner','Senior Partner')),
  practice_area      text,
  skills             text[] NOT NULL DEFAULT '{}',
  available_from     date,
  internship_start_date date,
  internship_end_date   date,
  user_role          text NOT NULL DEFAULT 'consultant'
                       CHECK (user_role IN ('consultant','hr_admin')),
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz DEFAULT now()
);

-- 3. Project assignments
CREATE TABLE IF NOT EXISTS project_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  consultant_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dedication_percentage int NOT NULL DEFAULT 100 CHECK (dedication_percentage > 0 AND dedication_percentage <= 100),
  end_date             date,
  assigned_at          timestamptz DEFAULT now(),
  assigned_by          uuid REFERENCES auth.users(id),
  UNIQUE (project_id, consultant_id)
);

-- 4. Project likes
CREATE TABLE IF NOT EXISTS project_likes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  consultant_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (project_id, consultant_id)
);

-- 5. Vacation requests
CREATE TABLE IF NOT EXISTS vacation_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  note            text,
  status          text NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending','Approved','Rejected')),
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: is current user HR admin?
CREATE OR REPLACE FUNCTION is_hr_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'hr_admin'
  );
$$;

-- profiles
CREATE POLICY "consultants read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "hr reads all profiles" ON profiles
  FOR SELECT USING (is_hr_admin());
CREATE POLICY "consultants update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "hr manages profiles" ON profiles
  FOR ALL USING (is_hr_admin());

-- projects (everyone reads, hr writes)
CREATE POLICY "read projects" ON projects
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hr manages projects" ON projects
  FOR ALL USING (is_hr_admin());

-- project_assignments
CREATE POLICY "read assignments" ON project_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hr manages assignments" ON project_assignments
  FOR ALL USING (is_hr_admin());

-- project_likes (consultant manages own)
CREATE POLICY "read likes" ON project_likes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "consultant manages own likes" ON project_likes
  FOR ALL USING (auth.uid() = consultant_id);

-- vacation_requests
CREATE POLICY "consultant reads own vacations" ON vacation_requests
  FOR SELECT USING (auth.uid() = consultant_id);
CREATE POLICY "hr reads all vacations" ON vacation_requests
  FOR SELECT USING (is_hr_admin());
CREATE POLICY "consultant creates own vacation" ON vacation_requests
  FOR INSERT WITH CHECK (auth.uid() = consultant_id);
CREATE POLICY "hr updates vacation status" ON vacation_requests
  FOR UPDATE USING (is_hr_admin());

-- notifications (own only)
CREATE POLICY "read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Auto-update available_from when all assignments end (pg_cron)
-- Enable pg_cron in Supabase dashboard > Extensions first, then run:
-- ============================================================
-- SELECT cron.schedule(
--   'refresh-available-from',
--   '0 6 * * *',  -- daily at 6am UTC
--   $$
--     UPDATE profiles p
--     SET available_from = (
--       SELECT MAX(COALESCE(a.end_date, proj.end_date))
--       FROM project_assignments a
--       JOIN projects proj ON proj.id = a.project_id
--       WHERE a.consultant_id = p.id
--         AND COALESCE(a.end_date, proj.end_date) >= CURRENT_DATE
--     )
--     WHERE EXISTS (
--       SELECT 1 FROM project_assignments a
--       JOIN projects proj ON proj.id = a.project_id
--       WHERE a.consultant_id = p.id
--     );
--   $$
-- );

-- ============================================================
-- Intern Rolloff Notification (pg_cron)
-- 30 days before internship_end_date, notify HR to confirm rolloff or convert to Consultant
-- Enable pg_cron in Supabase dashboard > Extensions first, then run:
-- ============================================================
-- SELECT cron.schedule(
--   'intern-rolloff-warning',
--   '0 7 * * *',  -- daily at 7am UTC
--   $$
--     INSERT INTO notifications (user_id, type, title, body)
--     SELECT
--       (SELECT id FROM profiles WHERE user_role = 'hr_admin' LIMIT 1),
--       'intern_rolloff_warning',
--       'Intern contract ending: ' || p.name,
--       p.name || ' internship ends on ' || p.internship_end_date::text ||
--       '. Please confirm rolloff or convert to Consultant.'
--     FROM profiles p
--     WHERE p.seniority = 'Intern'
--       AND p.is_active = true
--       AND p.internship_end_date = CURRENT_DATE + INTERVAL '30 days'
--       AND NOT EXISTS (
--         SELECT 1 FROM notifications n
--         WHERE n.body LIKE '%' || p.name || '%'
--           AND n.type = 'intern_rolloff_warning'
--           AND n.created_at > NOW() - INTERVAL '1 day'
--       );
--   $$
-- );

-- ============================================================
-- Seed Data (demo / development)
-- ============================================================

-- To use seed data: create two users in Supabase Auth dashboard first,
-- then insert their profiles below replacing the UUIDs.

-- Example (replace <consultant-uuid> and <hr-uuid> with real auth.users UUIDs):
--
-- INSERT INTO projects (id, name, client, industry, description, status, start_date, end_date, team_size, skills_required) VALUES
--   ('p1', 'Digital Transformation', 'Bancolombia', 'Financial Services', 'End-to-end digital transformation of core banking processes.', 'Partially Staffed', '2026-03-01', '2026-08-31', 4, ARRAY['Business Analysis','Change Management','Process Optimization','Project Management']),
--   ('p2', 'SAP S/4HANA Implementation', 'Ecopetrol', 'Oil & Gas', 'Full SAP S/4HANA implementation across finance and supply chain.', 'Partially Staffed', '2026-02-01', '2026-12-31', 5, ARRAY['SAP','ERP','Business Analysis','Change Management','Project Management']),
--   ('p3', 'Operational Excellence', 'Grupo Nutresa', 'Consumer Goods', 'Efficiency program targeting manufacturing and distribution.', 'Open', '2026-05-01', '2026-09-30', 3, ARRAY['Process Optimization','Data Analytics','Change Management']),
--   ('p4', 'HR Transformation', 'Avianca', 'Aviation', 'HR operating model redesign and talent system implementation.', 'Open', '2026-06-01', '2026-11-30', 3, ARRAY['Organizational Design','Change Management','Project Management']);
--
-- INSERT INTO profiles (id, name, role_title, seniority, skills, available_from, user_role) VALUES
--   ('<consultant-uuid>', 'Ana García', 'Senior Business Analyst', 'Senior', ARRAY['Business Analysis','Process Optimization','Change Management','Excel'], '2026-04-20', 'consultant'),
--   ('<hr-uuid>', 'María Rodríguez', 'HR Manager', 'Manager', ARRAY['HR','Staffing','People Management'], NULL, 'hr_admin');
