-- Enable Supabase Realtime for shared admin tables
-- Run this in the Supabase SQL Editor AFTER running migration_supabase_tables.sql

ALTER PUBLICATION supabase_realtime ADD TABLE public.kimble_cache;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.beach_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vacation_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deactivated_consultants;
