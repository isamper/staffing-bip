# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Bench** is an internal staffing and project-matching web app for **Bip Consulting Colombia**.  
Live app: **https://staffing-bip.vercel.app/**  
GitHub: **https://github.com/isamper/staffing-bip**  
Owner: Isabel Samper — isamper@chicagobooth.edu

The app lets HR Admins manage consultant assignments, import data from Kimble, track availability and fatigue risk, and manage CVs. Consultants can view their own dashboard, edit their CV, and see their team.

## Tech Stack

- **React + TypeScript** — component-based UI
- **Tailwind CSS + shadcn/ui** — styling and component library
- **Vite** — build tool and dev server (port 8080 or 5173)
- **Supabase** — auth, database, Realtime subscriptions
- **Vercel** — deployment (auto-deploys from `main` branch on GitHub)

## Common Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server
npm run build      # production build (always run before pushing to catch TS errors)
npm run lint       # lint
```

## Project Structure

```
src/
  pages/
    AdminDashboard.tsx     # Main admin view — most complex file in the codebase
    EmployeeDashboard.tsx  # Consultant view (Overview, Mi CV, Equipo tabs)
  components/
    PeopleTab.tsx          # Tab inside AdminDashboard — consultant list + CV viewer
    KimbleImportModal.tsx  # Modal for importing Kimble Excel files
    ConsultantCV.tsx       # CV editor/viewer component (used in both dashboards)
    AutoStaffingPlan.tsx   # Automatic staffing plan tab
  lib/
    supabase.ts            # Supabase client + isDemoMode flag
    kimbleParser.ts        # Parses Kimble Excel exports → KimbleImportResult
    mockData.ts            # Static mock consultants/projects (fallback / demo mode)
    types.ts               # All TypeScript interfaces (Profile, Project, ProjectAssignment, etc.)
    constants.ts           # MAX_CARGABILITY per seniority
    fatigue.ts             # computeFatigue() — Índice de Fatiga calculation
    colombianHolidays.ts   # COLOMBIAN_WORK_DAYS_2026 = 243 (used in Kimble dedication %)
  hooks/
    useAuth.tsx            # Auth context — profile, signOut, role detection
scripts/
  migration_supabase_tables.sql   # Run in Supabase SQL Editor to create tables
  migration_add_is_admin_only.sql # Adds is_admin_only column to profiles
  migration_enable_realtime.sql   # Enables Realtime on all tables
docs/
  spec.md                # Product specification
MANUAL_USUARIO.md        # User manual (Spanish) — keep in sync with features
MANUAL_USUARIO.pdf       # Generated from MANUAL_USUARIO.md via: npx md-to-pdf MANUAL_USUARIO.md
```

## Environment Variables

Create a `.env` file at the root (never commit it):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

If these are missing, the app runs in **demo mode** (`isDemoMode = true`) using only localStorage and mock data. No Supabase connection.

## Supabase Tables

All tables are in the `public` schema with RLS enabled (`FOR ALL TO authenticated`).  
Run `scripts/migration_supabase_tables.sql` in the Supabase SQL Editor to create them.

> ⚠️ **IMPORTANT**: All ID columns must be `text`, NOT `uuid`. The app inserts text IDs like `"kimble-e000600-0"`, `"manual-1234567890"`, `"v-1234567890"`. If a table was created with `uuid` columns, inserts will fail silently and data will disappear after the next polling refresh. To fix: DROP and recreate the table with `text` columns.

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `kimble_cache` | Singleton (id=1) storing last Kimble import as JSONB | `data jsonb`, `file_name text`, `imported_at timestamptz` |
| `project_assignments` | All project assignments (Kimble + manual) | `id text PK`, `project_id text`, `consultant_id text`, `dedication_percentage int`, `start_date text`, `end_date text` |
| `beach_assignments` | Internal tasks / beach assignments | `id text PK`, `consultant_id text`, `task_type text`, `description text`, `end_date text`, `dedication_percentage int` |
| `vacation_requests` | Vacation periods per consultant | `id text PK`, `consultant_id text`, `start_date text`, `end_date text`, `note text` |
| `deactivated_consultants` | Tracks deactivated consultants | `consultant_id text PK` |
| `consultant_profiles` | CV data saved by consultants | `consultant_id text PK`, `cv_data jsonb`, `updated_at timestamptz` |
| `profiles` | Supabase auth profiles (created on signup) | managed by Supabase Auth + Edge Functions |

### Realtime
All tables above have Realtime enabled. Run `scripts/migration_enable_realtime.sql` if not already done.

## Architecture: Data Flow

### AdminDashboard.tsx
- On mount: fetches all tables from Supabase → populates React state
- Supabase Realtime subscriptions → refresh state on any change
- 10-second polling fallback (in case Realtime events are missed)
- `refreshFnRef` useRef pattern prevents stale closures in Realtime callbacks
- `lastKimbleTs` useRef tracks last processed Kimble timestamp to prevent infinite loops

### Kimble Import Flow
1. Admin clicks "Importar Kimble" → `KimbleImportModal` opens
2. Excel parsed by `kimbleParser.ts` → `KimbleImportResult`
3. `handleKimbleImport(result, { skipAssignments: false })` called
4. Projects + assignments updated in state
5. `kimble_cache` upserted in Supabase (only on direct imports, NOT on DB refresh callbacks)
6. Realtime fires for other admins → they call `handleKimbleImport(result, { skipAssignments: true })`
   - `skipAssignments: true` = only update projects/consultants, skip assignment upsert
   - This prevents infinite Realtime loops

### Key flag: `opts.skipAssignments`
- `false` (or undefined): direct import by this user → updates everything + upserts to Supabase
- `true`: triggered by DB refresh (Realtime/polling) → only updates local state, never upserts

### EmployeeDashboard.tsx
- Fetches `project_assignments` and `kimble_cache` from Supabase on mount
- Subscribes to Realtime for live updates
- Uses `profile.id` (Supabase UUID) as `consultant_id` to match assignments
- CV saves upsert to `consultant_profiles` table

### CV Sync
- Consultant saves CV → writes to `consultant_profiles` in Supabase
- AdminDashboard fetches `consultant_profiles` on mount → merges into `consultants` state → PeopleTab shows live CV
- EmployeeDashboard fetches `consultant_profiles` → merges into `allConsultants` → Equipo tab shows live CVs

## Key Business Logic

### Dedication % Display
- **Projects tab** (team member row): shows `assignment.dedication_percentage` = dedication to THAT project only
- **People tab** (cargabilidad bar): shows `totalDedication` = sum of ALL active project assignments + beach assignments
  - Uses date-only filter (like beach assignments), no project lookup required, so manual assignments are always included
- **Fatigue risk**: always calculated on `totalDedication`

### getTotalDedication() — AdminDashboard
```ts
function getTotalDedication(consultantId, assignments, today, projects): number
```
Uses live `projects` state (NOT `mockProjects`) to filter active assignments.

### PeopleTab: activeDedicationAssignments
For `projectDedication` total, uses end_date-only filter (no project lookup), matching `beachDedication` behavior. This ensures manually-added project assignments always count toward the total even if their `project_id` isn't resolved.

### Índice de Fatiga
- Pilar 1 (30%): current project + beach dedication / 100
- Pilar 2 (30%): months without vacation / 6 (max 1.0)
- Pilar 3 (40%): `annual_dedication_pct` from Kimble / 100
- Levels: Normal ≤ 0.80 | En vigilancia 0.80–0.90 | Riesgo de fatiga > 0.90

### Project IDs
Kimble exports use IDs like `"e000711"`. The app resolves these to short IDs like `"p711"` using `numericToExistingId` map (numeric suffix matching). New Kimble projects not in mock data keep their raw Kimble ID. This resolution happens in `handleKimbleImport`.

### Consultant IDs
- In Supabase mode: `consultant_id` in assignments = Supabase UUID (from `profile.id`)
- In demo mode: mock IDs like `"c1"`, `"c2"`
- Name matching uses normalized names (NFD, lowercase, trim) via `normName()`

### MAX_CARGABILITY by seniority
Directors: 60%, Partners: 50%, Senior Partners: 40%, all others: 100%

## Roles

| Role | Access |
|------|--------|
| `hr_admin` | Full AdminDashboard + own EmployeeDashboard |
| `consultant` | EmployeeDashboard only |
| Admin-only (`is_admin_only: true`) | AdminDashboard only, no consultant profile |

Admins can promote/revoke other admins from the "Gestión de Admins" panel in PeopleTab.

## Demo Mode vs Supabase Mode

`isDemoMode = !VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY`

- **Demo**: all data from localStorage + mockData. No persistence across devices.
- **Supabase**: all mutations write to Supabase. Realtime + 10s polling syncs all admins.

Storage keys (localStorage fallback):
- `bench_kimble_result_v1` — last Kimble import
- `bench_assignments_v1` — project assignments
- `bench_beach_v1` — beach assignments
- `bench_vacations_v1` — vacation requests
- `bench_deactivated_v1` — deactivated consultant IDs
- `bench_profiles_v1` — CV edits

## Known Patterns & Gotchas

1. **Never use `window.location.reload()`** in Realtime callbacks — causes infinite reload loops (Supabase Realtime replays last WAL event on reconnect).

2. **`CREATE TABLE IF NOT EXISTS` does NOT modify existing tables.** If a table was created with wrong column types (e.g., `uuid` instead of `text`), you must DROP and recreate it manually in the Supabase SQL Editor.

3. **Kimble upsert guard**: The `kimble_cache` upsert ONLY runs when `!opts.skipAssignments`. Without this guard, refresh callbacks would overwrite fresh data with stale data AND trigger infinite Realtime loops.

4. **`refreshFnRef` pattern**: Realtime subscriptions are set up once on mount (empty `[]` dep array). To avoid stale closures, all state-reading logic is in `refreshFnRef.current` which is reassigned every render.

5. **Manual assignments vs Kimble**: IDs starting with `"kimble-"` come from Kimble. IDs starting with `"manual-"` or `"a"` + timestamp are manual. Kimble re-import replaces all Kimble assignments for projects in the file, but keeps manual assignments unless Kimble now covers the same (project, consultant) pair.

6. **`npx md-to-pdf MANUAL_USUARIO.md`** — generates PDF from the markdown manual. Copy to Downloads if needed.

## Deployment

- Push to `main` on GitHub → Vercel auto-deploys
- Never force-push to `main`
- Always run `npm run build` before pushing to catch TypeScript errors

## Files to Never Commit
- `.env` (contains Supabase keys)
- `node_modules/`
- `dist/`
