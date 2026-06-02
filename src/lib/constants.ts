/**
 * Maximum billable dedication % by seniority.
 * Senior roles need time for proposals, business development, and commercial tasks.
 * Adjust these thresholds to match Bip's actual targets.
 */
export const MAX_CARGABILITY: Record<string, number> = {
  'Intern': 100,
  'Consultant': 100,
  'Senior Consultant': 100,
  'Associate': 100,
  'Senior Associate': 100,
  'Manager': 100,
  'Senior Manager': 100,
  'Director': 60,
  'Partner': 50,
  'Senior Partner': 40,
}
