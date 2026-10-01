-- Migration: Add manual_projects table for pipeline projects (not in Kimble)
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS manual_projects (
  id             text PRIMARY KEY,
  name           text NOT NULL,
  client         text,
  industry       text,
  description    text,
  service_area   text,
  start_date     text,
  end_date       text,
  team_size      int DEFAULT 1,
  skills_required jsonb DEFAULT '[]',
  positions      jsonb DEFAULT '[]',
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE manual_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manual_projects_all"
  ON manual_projects FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE manual_projects;
