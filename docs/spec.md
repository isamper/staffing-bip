# Bench by Bip Consulting — Technical Spec

**App name:** bench. (lowercase, red dot)
**Tagline:** Smart Staffing by Bip Consulting
**Prototype:** https://project-staffing.lovable.app/
**Repo:** https://github.com/isamper/project-matchmaker

---

## Recommended Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Keep from prototype — no migration cost |
| Styling | Tailwind CSS + shadcn/ui | Keep from prototype |
| Routing | react-router-dom v6 | Keep from prototype |
| Server state | TanStack Query | Keep from prototype |
| Forms | react-hook-form + zod | Keep from prototype |
| Charts | recharts | Keep from prototype |
| Auth + DB | **Supabase** | One service: Postgres, Auth, Realtime, Edge Functions, RLS — best fit for solo dev |
| Email | **Resend** | Best DX, free tier (3k/mo), works with any domain including Outlook |
| Deployment | **Vercel** | Zero-config for Vite/React, free tier, auto-deploys from GitHub |

---

## Authentication & Role-Based Access Control

### Provider: Supabase Auth (email + password)

- Two roles: `consultant` | `hr_admin`
- Role stored in `profiles.user_role`, added to JWT via a Postgres function triggered on auth
- **No public signup** — HR creates all consultant accounts from the admin dashboard
- Login page redirects: `hr_admin` → `/admin`, `consultant` → `/employee`

### Row Level Security (RLS) summary

| Table | Consultant can | HR Admin can |
|---|---|---|
| profiles | Read own, update own | Read all, create, update, deactivate |
| projects | Read all | Read all, create, update |
| project_assignments | Read own (with dedication_percentage, end_date) | Read all, create, delete |
| project_likes | Read/write own | Read all |
| vacation_requests | Read/write own | Read all, update status |
| notifications | Read/delete own | — |

---

## Database Schema

```sql
-- Extends auth.users (Supabase manages auth.users)
CREATE TABLE profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  role_title            text NOT NULL,
  seniority             text NOT NULL CHECK (seniority IN (
                          'Intern','Consultant','Senior Consultant','Associate',
                          'Senior Associate','Manager','Senior Manager',
                          'Director','Partner','Senior Partner')),
  practice_area         text,                           -- e.g. 'Implementation', 'IT / Digital'
  skills                text[] NOT NULL DEFAULT '{}',
  available_from        date,                           -- derived: latest assignment end_date
  internship_start_date date,                           -- Interns only
  internship_end_date   date,                           -- Interns only
  user_role             text NOT NULL DEFAULT 'consultant'
                          CHECK (user_role IN ('consultant','hr_admin')),
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE projects (
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

CREATE TABLE project_assignments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  consultant_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dedication_percentage int NOT NULL DEFAULT 100 CHECK (dedication_percentage > 0 AND dedication_percentage <= 100),
  end_date              date,                           -- override project end_date if needed
  assigned_at           timestamptz DEFAULT now(),
  assigned_by           uuid REFERENCES auth.users(id),
  UNIQUE (project_id, consultant_id)
);

CREATE TABLE project_likes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  consultant_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (project_id, consultant_id)
);

CREATE TABLE vacation_requests (
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

CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            text NOT NULL,   -- 'vacation_approved' | 'vacation_rejected' | 'assignment' | 'intern_rolloff_warning'
  title           text NOT NULL,
  body            text NOT NULL,
  read            boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);
```

> **Note:** `profiles` has a circular dependency with `projects` (via `current_project_id`). Create `projects` first without the FK, then add it with `ALTER TABLE` after `profiles` exists.

---

## Pages & Components

### `/login` — Public
- Email + password form (Supabase Auth)
- Role-based redirect on success
- No registration link (HR-managed accounts only)

### `/` — Landing Page (Public)
- Hero: app name, tagline, CTA button → `/login`
- No auth required

### `/employee` — Consultant Dashboard (auth: consultant)

| Component | Purpose |
|---|---|
| `ProfileCard` | Avatar initials, name, role, seniority, skills chips, edit button |
| `CurrentAssignment` | Project name, end date, days remaining |
| `AvailabilityBanner` | "Available from [date]" or "Currently on bench" |
| `ProjectPipeline` | All Open/Partially Staffed projects, heart toggle to like |
| `VacationRequestForm` | Date range picker + optional note → creates Pending request |
| `VacationRequestList` | Own requests with status badges (Pending/Approved/Rejected) |
| `NotificationBell` | Unread count badge, dropdown of recent notifications |

### `/admin` — HR Dashboard (auth: hr_admin)

**Stats bar:** 4 KPI cards
- Total Headcount (active consultants)
- Available Now (`available_from` ≤ today, no active assignment)
- Rolling Off in 30 days (`available_from` between today and today+30)
- Needs Staffing (status = 'Open' or 'Partially Staffed' — upcoming projects only)

**Tab: Projects**

| Component | Purpose |
|---|---|
| `ProjectList` | Left column — two sections: "Needs Staffing" (Open/Partially Staffed, upcoming) and "In Progress" (Active) |
| `MatchPanel` | Right panel — for upcoming projects: ranked consultant matches with scores, reasons, Assign button; for Active projects: read-only team list with dedication % and end dates |
| `ConsultantDirectory` | Right column — searchable/filterable consultant list with availability |
| `AddProjectModal` | HR creates new project |
| `EditProjectModal` | HR edits project details and status |

**Tab: Time Off**

| Component | Purpose |
|---|---|
| `PendingRequests` | Cards with Approve / Reject buttons |
| `AllTimeOff` | Full history table with status filter |

**Tab: Staffing Plan**

| Component | Purpose |
|---|---|
| `HorizonSelector` | Toggle: 30 / 60 / 90 days |
| `AutoStaffButton` | Triggers matching Edge Function |
| `StaffingPlanResults` | Assignments with scores, vacation warnings, gap alerts |
| `AcceptPlanButton` | Commits all assignments to DB |
| `RegenerateButton` | Re-runs the algorithm |

**Consultant management** (accessible from directory or top nav)
- `AddConsultantModal` — HR creates account + profile in one step
- `EditConsultantModal` — edit profile, skills, availability
- `DeactivateConsultantButton` — sets `is_active = false`

### `/admin/analytics` — Analytics (auth: hr_admin)

| Chart | Data |
|---|---|
| Utilization rate bar chart | % days assigned vs available per consultant |
| Bench time histogram | Distribution of days on bench |
| Staffing velocity line | Avg days from project Open → Fully Staffed |
| Skills heatmap | Required skills (projects) vs available skills (consultants) |

### `/project/:id` — Project Detail (auth: both roles)
- Full project info card (name, client, industry, description, dates, team size, skills)
- `AssignedTeam` — list of assigned consultants with remove button (hr_admin only)
- `InterestedConsultants` — consultants who liked the project
- `MatchSuggestions` — ranked list with scores, reasons, Assign button (hr_admin only)
- Like button (consultant only)

---

## Matching Algorithm

Deterministic scoring — no external API call in Phase 1. Reason text generated programmatically.

### Score breakdown (0–100)

| Factor | Max pts | Logic |
|---|---|---|
| Skills overlap | 40 | `(matched_skills / required_skills.length) * 40` |
| Availability | 25 | Available before start date = 25; within 30 days late = 10; unavailable = 0 |
| Seniority match | 20 | Exact match = 20; one level off = 10; two+ levels off = 0 |
| Interest signal | +10 | Consultant has liked the project |
| Vacation conflict | −20 | Any approved vacation overlaps project dates |

### Reason text template
```
"Matches X of Y required skills. Available from [date]. [Seniority note].
[Interest: 'Expressed interest in this project.'] [Warning: 'Vacation overlap: [dates].']"
```

### Seniority order for adjacency
`Intern → Consultant → Senior Consultant → Associate → Senior Associate → Manager → Senior Manager → Director → Partner → Senior Partner`

---

## Edge Functions

| Function | Trigger | Purpose |
|---|---|---|
| `match-consultants` | POST `/match-consultants` | Run algorithm for one project, return ranked results |
| `auto-staff` | POST `/auto-staff` | Greedy assignment across all open projects for a time horizon |
| `notify-vacation` | DB webhook on `vacation_requests` update | Create in-app notification + send Resend email |

### Auto-staff logic (greedy)
1. Filter consultants: active, available within horizon, no blocking vacation
2. For each open project (sorted by start date ASC):
   - Score all eligible unassigned consultants
   - Assign top N (where N = `team_size - assigned_count`)
   - Mark assigned consultants as unavailable for remaining projects
3. Return `StaffingPlan` with assignments, gap alerts, totals

---

## Email Notifications (Resend)

- Trigger: `vacation_requests.status` changes from `Pending` → `Approved` or `Rejected`
- Sender: configure your Outlook domain with Resend DNS records (5-minute setup)
- Template (Approved): "Your vacation request for [start] – [end] has been approved."
- Template (Rejected): "Your vacation request for [start] – [end] was not approved."
- In-app notification always created regardless of email delivery success

---

## Routes

| Route | Auth required | Role |
|---|---|---|
| `/` | No | Public |
| `/login` | No | Public |
| `/employee` | Yes | consultant |
| `/admin` | Yes | hr_admin |
| `/admin/analytics` | Yes | hr_admin |
| `/project/:id` | Yes | Both |

---

## Phase 1 — MVP (Build this first)

- [ ] Supabase project: schema, RLS policies, Auth config
- [ ] Login page + role-based redirect + protected routes
- [ ] Consultant dashboard (profile view/edit, assignment, likes, vacation requests)
- [ ] HR dashboard — Projects tab with match panel and Assign button
- [ ] HR dashboard — Time Off tab (approve/reject)
- [ ] Project detail page
- [ ] `match-consultants` Edge Function
- [ ] HR: add/edit/deactivate consultant profiles (including practice_area field)
- [ ] HR: add/edit projects
- [ ] Vacation approval email via Resend + in-app notifications
- [ ] Intern rolloff warning: pg_cron job notifies HR 30 days before internship_end_date; HR can confirm rolloff or convert to Consultant
- [ ] Analytics page
- [ ] Mobile-responsive layout
- [ ] Deploy to Vercel

## Phase 2 — Nice to Have

- [ ] Staffing Plan tab with `auto-staff` Edge Function
- [ ] LLM-generated match reasons (Claude API)
- [ ] Slack notifications
- [ ] CSV export of staffing plan
- [ ] Calendar view of team availability
- [ ] Audit log of all staffing decisions
- [ ] Multi-tenant support (multiple consulting firms)

---

## Decisions Made

1. **Consultant profile visibility:** Consultants see only their own profile. No peer directory for the consultant role.
2. **Multi-assignment model:** Consultants can be on multiple projects simultaneously, each with a `dedication_percentage` (e.g., 50% + 50%). `current_project_id` was removed from profiles. `available_from` is derived from the latest `end_date` across active assignments and updated daily by pg_cron. Matching algorithm deducts score for any overlap that puts total dedication ≥ 100%.
3. **Analytics:** Individual consultant names shown — HR needs to act on this data (e.g., prioritize staffing for longest-benched consultant).
4. **Seniority levels (10):** Intern → Consultant → Senior Consultant → Associate → Senior Associate → Manager → Senior Manager → Director → Partner → Senior Partner. Maps to Bip's Spanish hierarchy; Partners and Senior Partners are staffable.
5. **Practice area:** Stored as a free-text field on profiles (e.g., "Implementation", "IT / Digital", "Strategy & Technology"). Not a seniority level.
6. **Intern rolloff:** 30 days before `internship_end_date`, HR receives a notification to either confirm rolloff (deactivate profile) or convert the intern to Consultant (update seniority, clear internship dates).
7. **Project status lifecycle:** `Open` → `Partially Staffed` → `Fully Staffed` (all for upcoming, not-yet-started projects). Once a project starts it becomes `Active` — shown as read-only with team info, no staffing actions. Ended projects (end_date < today) are filtered out of main views. HR sets status manually when creating/editing a project.
8. **Headcount:** 61 people total — 3 Senior Partners/Partners, 1 Director, 10 Managers/Senior Managers, 11 Associates/Senior Associates, 15 Senior Consultants, 15 Consultants, 5 Interns (as of April 2026).
