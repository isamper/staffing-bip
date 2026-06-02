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
  const approved = vacations.filter((v) => v.consultant_id === consultant.id)
  for (const vac of approved) {
    const vs = new Date(vac.start_date)
    const ve = new Date(vac.end_date)
    const ps = new Date(project.start_date)
    const pe = new Date(project.end_date)
    if (vs <= pe && ve >= ps) {
      score -= 20
      vacationWarning = `Vacaciones: ${formatDate(vac.start_date)} – ${formatDate(vac.end_date)}`
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
 * Find replacement candidates for a consultant with riesgo de fatiga on a given project.
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

  // Capacity check — mark unavailable, don't score further
  const usedDedication = totalDedicationDuringProject(consultant.id, project, assignments)
  if (usedDedication >= 100) {
    return {
      consultant,
      score: 0,
      reason: 'No capacity during project period.',
      hasLiked: false,
      unavailable: true,
    }
  }

  // Skills overlap (0–30) — position skills first, fall back to project skills_required
  const skillPool = position.skills.length > 0 ? position.skills : project.skills_required
  if (skillPool.length > 0) {
    const matched = skillPool.filter((s) =>
      consultant.skills.map((cs) => cs.toLowerCase()).includes(s.toLowerCase()),
    )
    const skillScore = Math.round((matched.length / skillPool.length) * 30)
    score += skillScore
    reasons.push(`${matched.length}/${skillPool.length} skills requeridas`)
  }

  // Industry match (0–20)
  if (project.industry && project.industry !== 'Other' && consultant.industry_experience?.length) {
    if (consultant.industry_experience.includes(project.industry)) {
      score += 20
      reasons.push(`Experiencia en ${project.industry}`)
    } else {
      reasons.push(`Sin experiencia en ${project.industry}`)
    }
  }

  // Service area match (0–20)
  if (project.service_area && consultant.kimble_service_areas?.length) {
    if (consultant.kimble_service_areas.includes(project.service_area)) {
      score += 20
      reasons.push(`Área: ${project.service_area}`)
    } else {
      reasons.push(`Área distinta (${project.service_area})`)
    }
  }

  // Availability (0–25)
  if (consultant.available_from) {
    const availDate = new Date(consultant.available_from)
    const startDate = new Date(project.start_date)
    const diffDays = Math.floor((startDate.getTime() - availDate.getTime()) / 86400000)
    if (diffDays >= 0) {
      score += 25
      reasons.push(`Disponible desde ${formatDate(consultant.available_from)}`)
    } else if (diffDays > -30) {
      score += 10
      reasons.push(`Disponible ${formatDate(consultant.available_from)} (leve retraso)`)
    } else {
      reasons.push(`No disponible hasta ${formatDate(consultant.available_from)}`)
    }
  } else {
    score += 25
    reasons.push('Disponible ahora')
  }

  // Seniority match (0–20) — partial credit for adjacent levels
  const neededLevel = SENIORITY_ORDER[position.seniority] ?? 0
  const consultantLevel = SENIORITY_ORDER[consultant.seniority] ?? 0
  const diff = Math.abs(consultantLevel - neededLevel)
  let isStretch = false
  if (diff === 0) {
    score += 20
    reasons.push(`Seniority: ${consultant.seniority}`)
  } else if (diff === 1) {
    score += 10
    isStretch = true
    reasons.push(`Seniority cercano: ${consultant.seniority} (se necesita ${position.seniority})`)
  } else if (diff === 2) {
    score += 5
    isStretch = true
    reasons.push(`Mejor disponible — brecha: ${consultant.seniority} vs. ${position.seniority}`)
  } else {
    isStretch = true
    reasons.push(`Stretch — ${consultant.seniority} vs. ${position.seniority} requerido`)
  }

  // Interest signal (+10)
  const hasLiked = likes.some(
    (l) => l.project_id === project.id && l.consultant_id === consultant.id,
  )
  if (hasLiked) {
    score += 10
    reasons.push('Expresó interés en este proyecto')
  }

  // Vacation conflict (−20)
  let vacationWarning: string | undefined
  const approved = vacations.filter((v) => v.consultant_id === consultant.id)
  for (const vac of approved) {
    const vs = new Date(vac.start_date)
    const ve = new Date(vac.end_date)
    const ps = new Date(project.start_date)
    const pe = new Date(project.end_date)
    if (vs <= pe && ve >= ps) {
      score -= 20
      vacationWarning = `Vacaciones: ${formatDate(vac.start_date)} – ${formatDate(vac.end_date)}`
      break
    }
  }

  return {
    consultant,
    score: Math.max(0, Math.min(100, score)),
    reason: reasons.join('. ') + '.',
    vacationWarning,
    hasLiked,
    isStretch,
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
    .filter((r) => !r.unavailable)  // exclude only truly unavailable (no capacity)
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
