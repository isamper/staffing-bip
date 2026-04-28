import type { Profile, Position, Project, ProjectAssignment, ProjectLike, VacationRequest, MatchResult } from './types'
import { formatDate } from './utils'

const SENIORITY_ORDER: Record<string, number> = {
  Intern: 0,
  Consultant: 1,
  'Senior Consultant': 2,
  Associate: 3,
  'Senior Associate': 4,
  Manager: 5,
  'Senior Manager': 6,
  Director: 7,
  Partner: 8,
  'Senior Partner': 9,
}

function totalDedicationDuringProject(
  consultantId: string,
  project: Project,
  assignments: ProjectAssignment[],
): number {
  const ps = new Date(project.start_date)
  const pe = new Date(project.end_date)
  return assignments
    .filter((a) => a.consultant_id === consultantId)
    .filter((a) => {
      const as = new Date(a.assigned_at)
      const ae = a.end_date ? new Date(a.end_date) : pe
      return as <= pe && ae >= ps
    })
    .reduce((sum, a) => sum + a.dedication_percentage, 0)
}

export function scoreConsultant(
  consultant: Profile,
  project: Project,
  likes: ProjectLike[],
  vacations: VacationRequest[],
  assignments: ProjectAssignment[] = [],
): MatchResult {
  let score = 0
  const reasons: string[] = []

  // Skills overlap (0–40)
  const matched = project.skills_required.filter((s) =>
    consultant.skills.map((cs) => cs.toLowerCase()).includes(s.toLowerCase()),
  )
  const skillScore =
    project.skills_required.length > 0
      ? Math.round((matched.length / project.skills_required.length) * 40)
      : 0
  score += skillScore
  reasons.push(`Matches ${matched.length}/${project.skills_required.length} required skills`)

  // Capacity check — if already at 100% dedication during project period, mark unavailable
  const usedDedication = totalDedicationDuringProject(consultant.id, project, assignments)
  if (usedDedication >= 100) {
    reasons.push('No capacity during project period')
    return {
      consultant,
      score: 0,
      reason: reasons.join('. ') + '.',
      hasLiked: false,
    }
  }
  if (usedDedication > 0) {
    reasons.push(`Currently at ${usedDedication}% dedication on other projects`)
  }

  // Availability (0–25)
  if (consultant.available_from) {
    const availDate = new Date(consultant.available_from)
    const startDate = new Date(project.start_date)
    const diffDays = Math.floor((startDate.getTime() - availDate.getTime()) / 86400000)
    if (diffDays >= 0) {
      score += 25
      reasons.push(`Available from ${formatDate(consultant.available_from)}`)
    } else if (diffDays > -30) {
      score += 10
      reasons.push(`Available ${formatDate(consultant.available_from)} (slightly late)`)
    } else {
      reasons.push(`Not available until ${formatDate(consultant.available_from)}`)
    }
  } else {
    score += 25
    reasons.push('Available now')
  }

  // Seniority match (0–20)
  const neededLevel = project.skills_required.length >= 4 ? 1 : 0
  const consultantLevel = SENIORITY_ORDER[consultant.seniority] ?? 0
  const diff = Math.abs(consultantLevel - neededLevel)
  score += diff === 0 ? 20 : diff === 1 ? 10 : 0

  // Interest signal (+10)
  const hasLiked = likes.some(
    (l) => l.project_id === project.id && l.consultant_id === consultant.id,
  )
  if (hasLiked) {
    score += 10
    reasons.push('Expressed interest in this project')
  }

  // Vacation conflict (−20)
  let vacationWarning: string | undefined
  const approved = vacations.filter(
    (v) => v.consultant_id === consultant.id && v.status === 'Approved',
  )
  for (const vac of approved) {
    const vs = new Date(vac.start_date)
    const ve = new Date(vac.end_date)
    const ps = new Date(project.start_date)
    const pe = new Date(project.end_date)
    if (vs <= pe && ve >= ps) {
      score -= 20
      vacationWarning = `Vacation overlap: ${formatDate(vac.start_date)} – ${formatDate(vac.end_date)}`
      break
    }
  }

  return {
    consultant,
    score: Math.max(0, Math.min(100, score)),
    reason: reasons.join('. ') + '.',
    vacationWarning,
    hasLiked,
  }
}

/**
 * Find replacement candidates for an over-dedicated consultant on a given project.
 * Candidates must: be active, not already on the project, have adjacent seniority,
 * and share at least one skill with the consultant being replaced.
 */
export function findReplacements(
  consultant: Profile,
  project: Project,
  allConsultants: Profile[],
  allAssignments: ProjectAssignment[],
  vacations: VacationRequest[],
  likes: ProjectLike[],
): MatchResult[] {
  const consultantLevel = SENIORITY_ORDER[consultant.seniority] ?? 0
  const alreadyOnProject = allAssignments
    .filter((a) => a.project_id === project.id)
    .map((a) => a.consultant_id)

  const candidates = allConsultants.filter(
    (c) =>
      c.is_active &&
      c.id !== consultant.id &&
      !alreadyOnProject.includes(c.id) &&
      Math.abs((SENIORITY_ORDER[c.seniority] ?? 0) - consultantLevel) <= 1 &&
      c.skills.some((s) =>
        consultant.skills.map((cs) => cs.toLowerCase()).includes(s.toLowerCase()),
      ),
  )

  return matchConsultants(project, candidates, likes, vacations, allAssignments)
}

export function scoreConsultantForPosition(
  consultant: Profile,
  position: Position,
  project: Project,
  likes: ProjectLike[],
  vacations: VacationRequest[],
  assignments: ProjectAssignment[] = [],
): MatchResult {
  let score = 0
  const reasons: string[] = []

  // Skills overlap (0–40) against position skills
  const matched = position.skills.filter((s) =>
    consultant.skills.map((cs) => cs.toLowerCase()).includes(s.toLowerCase()),
  )
  const skillScore =
    position.skills.length > 0
      ? Math.round((matched.length / position.skills.length) * 40)
      : 0
  score += skillScore
  reasons.push(`Matches ${matched.length}/${position.skills.length} skills for ${position.role}`)

  // Capacity check
  const usedDedication = totalDedicationDuringProject(consultant.id, project, assignments)
  if (usedDedication >= 100) {
    reasons.push('No capacity during project period')
    return { consultant, score: 0, reason: reasons.join('. ') + '.', hasLiked: false }
  }

  // Availability (0–25)
  if (consultant.available_from) {
    const availDate = new Date(consultant.available_from)
    const startDate = new Date(project.start_date)
    const diffDays = Math.floor((startDate.getTime() - availDate.getTime()) / 86400000)
    if (diffDays >= 0) {
      score += 25
      reasons.push(`Available from ${formatDate(consultant.available_from)}`)
    } else if (diffDays > -30) {
      score += 10
      reasons.push(`Available ${formatDate(consultant.available_from)} (slightly late)`)
    } else {
      reasons.push(`Not available until ${formatDate(consultant.available_from)}`)
    }
  } else {
    score += 25
    reasons.push('Available now')
  }

  // Seniority match (0–20) against position seniority directly
  const neededLevel = SENIORITY_ORDER[position.seniority] ?? 0
  const consultantLevel = SENIORITY_ORDER[consultant.seniority] ?? 0
  const diff = Math.abs(consultantLevel - neededLevel)
  if (diff === 0) {
    score += 20
    reasons.push(`Seniority match: ${consultant.seniority}`)
  } else if (diff === 1) {
    score += 10
    reasons.push(`Near seniority: ${consultant.seniority} (role needs ${position.seniority})`)
  } else {
    reasons.push(`Seniority gap: ${consultant.seniority} (role needs ${position.seniority})`)
  }

  // Interest signal (+10)
  const hasLiked = likes.some(
    (l) => l.project_id === project.id && l.consultant_id === consultant.id,
  )
  if (hasLiked) {
    score += 10
    reasons.push('Expressed interest in this project')
  }

  // Vacation conflict (−20)
  let vacationWarning: string | undefined
  const approved = vacations.filter(
    (v) => v.consultant_id === consultant.id && v.status === 'Approved',
  )
  for (const vac of approved) {
    const vs = new Date(vac.start_date)
    const ve = new Date(vac.end_date)
    const ps = new Date(project.start_date)
    const pe = new Date(project.end_date)
    if (vs <= pe && ve >= ps) {
      score -= 20
      vacationWarning = `Vacation overlap: ${formatDate(vac.start_date)} – ${formatDate(vac.end_date)}`
      break
    }
  }

  return {
    consultant,
    score: Math.max(0, Math.min(100, score)),
    reason: reasons.join('. ') + '.',
    vacationWarning,
    hasLiked,
  }
}

export function matchConsultantsForPosition(
  position: Position,
  project: Project,
  consultants: Profile[],
  likes: ProjectLike[],
  vacations: VacationRequest[],
  assignments: ProjectAssignment[] = [],
): MatchResult[] {
  return consultants
    .filter((c) => c.is_active)
    .map((c) => scoreConsultantForPosition(c, position, project, likes, vacations, assignments))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function matchConsultants(
  project: Project,
  consultants: Profile[],
  likes: ProjectLike[],
  vacations: VacationRequest[],
  assignments: ProjectAssignment[] = [],
): MatchResult[] {
  return consultants
    .filter((c) => c.is_active)
    .map((c) => scoreConsultant(c, project, likes, vacations, assignments))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
}
