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
export type VacationStatus = 'Pending' | 'Approved' | 'Rejected'
export type UserRole = 'consultant' | 'hr_admin'

export interface Profile {
  id: string
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
  created_at: string
  // CV fields (editable by consultant)
  bio: string | null
  education: string | null
  languages: string | null
  years_of_experience: number | null
  certifications: string[]
  experience: ExperienceEntry[]
}

export interface ExperienceEntry {
  id: string
  title: string        // project / role name
  client: string       // client or company
  period: string       // e.g. "2023 – 2024"
  description: string  // key activities / achievements
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
}

export interface VacationRequest {
  id: string
  consultant_id: string
  start_date: string
  end_date: string
  note?: string
  status: VacationStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export interface ProjectAssignment {
  id: string
  project_id: string
  consultant_id: string
  dedication_percentage: number
  end_date: string | null
  assigned_at: string
  assigned_by?: string
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
