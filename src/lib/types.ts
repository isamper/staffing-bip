export type Seniority =
  | 'Intern'
  | 'Consultant'
  | 'Senior Consultant'
  | 'Associate'
  | 'Senior Associate'
  | 'Manager'
  | 'Senior Manager'
  | 'Director'
  | 'Partner'
  | 'Senior Partner'
export type ProjectStatus = 'Open' | 'Partially Staffed' | 'Fully Staffed' | 'Active'
export type UserRole = 'consultant' | 'hr_admin'

export interface Profile {
  id: string
  email?: string
  name: string
  role_title: string
  seniority: Seniority
  practice_area: string | null
  skills: string[]
  available_from: string | null
  internship_start_date: string | null
  internship_end_date: string | null
  user_role: UserRole
  is_active: boolean
  is_admin_only?: boolean
  created_at: string
  // CV fields (editable by consultant)
  photo_url?: string | null
  bio: string | null
  education: string | null
  languages: string | null
  years_of_experience: number | null
  certifications: string[]
  experience: ExperienceEntry[]
  cv_versions?: CVVersion[]   // named CV versions with per-language content
  // Kimble-derived fields (set on import)
  annual_dedication_pct?: number   // sum of Kimble usage days / 243 Colombian work days × 100
  industry_experience?: string[]   // from historic Kimble data
  kimble_service_areas?: string[]  // from historic Kimble data
}

export interface ExperienceEntry {
  id: string
  title: string        // project / role name
  client: string       // client or company
  period: string       // e.g. "2023 – 2024"
  description: string  // key activities / achievements
}

/**
 * A named CV version (e.g. "General", "SAP Expert", "Ciberseguridad").
 * bio and experience are stored per language; all other fields are shared
 * across versions (education, languages, skills, certifications).
 */
export interface CVVersion {
  id: string
  label: string                  // display name / tag
  bio_es: string | null
  bio_en: string | null
  experience_es: ExperienceEntry[]
  experience_en: ExperienceEntry[]  // same IDs as experience_es, descriptions translated
  languages_en?: string | null      // translated version of profile.languages
}

export interface Position {
  id: string
  role: string
  seniority: Seniority
  skills: string[]
}

export interface Project {
  id: string
  name: string
  client: string
  industry: string
  description: string
  status: ProjectStatus
  start_date: string
  end_date: string
  team_size: number
  skills_required: string[]
  positions?: Position[]
  created_at: string
  // Kimble-derived fields
  kimble_code?: string    // e.g. "e000720"
  service_area?: string   // Kimble service area (e.g. "Strategy & Innovation")
}

export interface VacationRequest {
  id: string
  consultant_id: string
  start_date: string
  end_date: string
  note?: string
  created_at: string
}

export interface ProjectAssignment {
  id: string
  project_id: string
  consultant_id: string
  dedication_percentage: number
  start_date?: string | null   // when the consultant starts on this project
  end_date: string | null      // when the consultant ends on this project
  assigned_at: string
  assigned_by?: string
}

export type BeachTaskType = 'Propuesta' | 'Actividad Interna' | 'Apoyo a Proyecto' | 'Otro'

export interface BeachAssignment {
  id: string
  consultant_id: string
  task_type: BeachTaskType
  description: string
  end_date: string
  assigned_at: string
}

export interface ProjectLike {
  id: string
  project_id: string
  consultant_id: string
  created_at: string
}

export interface MatchResult {
  consultant: Profile
  score: number
  reason: string
  vacationWarning?: string
  hasLiked: boolean
  isStretch?: boolean      // seniority mismatch — best available, not ideal
  unavailable?: boolean    // no capacity — excluded from suggestions
}

export interface Notification {
  id: string
  user_id: string
  type: 'vacation_approved' | 'vacation_rejected' | 'assignment'
  title: string
  body: string
  read: boolean
  created_at: string
}

export interface StaffingPlanAssignment {
  projectId: string
  consultantId: string
  score: number
  reason: string
  vacationWarning?: string
}

export interface StaffingPlan {
  assignments: StaffingPlanAssignment[]
  gaps: { projectId: string; unfilled: number }[]
  totalSlots: number
  filledSlots: number
}
