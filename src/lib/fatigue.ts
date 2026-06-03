import type { Profile, BeachAssignment, VacationRequest } from './types'

export type FatigueLevel = 'normal' | 'vigilancia' | 'riesgo'

export interface FatigueResult {
  score: number          // 0–1 composite
  level: FatigueLevel
  pilar1: number         // carga actual (project + beach dedication)
  pilar2: number         // tiempo sin descanso (0 until vacation tracking is ready)
  pilar3: number         // tendencia anual (Kimble annual_dedication_pct)
}

/**
 * Compute the Índice de Fatiga for a consultant.
 *
 * Formula (weights 30 / 30 / 40):
 *   Pilar 1 — Carga actual      (30%): (projectDedication + beachDedication) / 100
 *   Pilar 2 — Sin descanso      (30%): placeholder = 0 until vacation tracking is complete
 *   Pilar 3 — Tendencia anual   (40%): annual_dedication_pct / 100 (0 if not yet imported from Kimble)
 *
 * Thresholds:
 *   > 0.90  → 'riesgo'     (Riesgo de fatiga — red)
 *   > 0.80  → 'vigilancia' (En vigilancia — amber)
 *   ≤ 0.80  → 'normal'
 */
/** Whole-month difference between two dates (floored). */
function monthsBetween(from: Date, to: Date): number {
  return Math.max(0,
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()),
  )
}

export function computeFatigue(
  consultant: Profile,
  projectDedication: number,  // sum of active project assignment dedication %
  beachDedication: number,    // sum of active beach task dedication %
  vacations: VacationRequest[],
): FatigueResult {
  const today = new Date()

  // Pilar 1 — Carga actual (30%)
  const totalDedication = projectDedication + beachDedication
  const pilar1 = Math.min(totalDedication / 100, 1)

  // Pilar 2 — Tiempo sin descanso (30%)
  // If no vacation records exist we assume the consultant has not rested since
  // their hire date (created_at). When real vacation data is added later the
  // score recalculates automatically and will decrease for those who took time off.
  const lastVacation = vacations
    .filter(v => v.consultant_id === consultant.id && new Date(v.end_date) <= today)
    .sort((a, b) => b.end_date.localeCompare(a.end_date))[0]
  const referenceDate = lastVacation
    ? new Date(lastVacation.end_date)
    : new Date(consultant.created_at)
  const monthsNoRest = monthsBetween(referenceDate, today)
  const pilar2 = Math.min(monthsNoRest, 6) / 6

  // Pilar 3 — Tendencia anual (40%): from Kimble annual_dedication_pct; 0 if not yet imported
  const pilar3 = consultant.annual_dedication_pct != null
    ? Math.min(consultant.annual_dedication_pct / 100, 1)
    : 0

  const score = 0.30 * pilar1 + 0.30 * pilar2 + 0.40 * pilar3
  const level: FatigueLevel =
    score > 0.90 ? 'riesgo' : score > 0.80 ? 'vigilancia' : 'normal'

  return { score, level, pilar1, pilar2, pilar3 }
}

/** Helper: get total active beach dedication for a consultant on a given date. */
export function getBeachDedication(
  consultantId: string,
  beachAssignments: BeachAssignment[],
  today: Date,
): number {
  return beachAssignments
    .filter((b) => b.consultant_id === consultantId && new Date(b.end_date) >= today)
    .reduce((sum, b) => sum + b.dedication_percentage, 0)
}
