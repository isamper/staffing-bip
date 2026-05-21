// Colombian public holidays per Ley 51 de 1983
// Fixed holidays stay on their calendar date.
// Moveable holidays ("puentes") are transferred to the following Monday.

// ── 2025 ─────────────────────────────────────────────────────────────────────
// Easter 2025: April 20
const HOLIDAYS_2025 = new Set([
  '2025-01-01', // Año Nuevo
  '2025-01-06', // Reyes Magos (already Monday)
  '2025-03-24', // San José (moved from Mar 19 Wed → Mar 24 Mon)
  '2025-04-17', // Jueves Santo
  '2025-04-18', // Viernes Santo
  '2025-05-01', // Día del Trabajo
  '2025-06-02', // Ascensión (39d after Easter May 29 Thu → Jun 2 Mon)
  '2025-06-23', // Corpus Christi (60d after Easter Jun 19 Thu → Jun 23 Mon)
  '2025-06-30', // Sagrado Corazón (68d after Easter Jun 27 Fri → Jun 30 Mon)
  '2025-06-30', // San Pedro y San Pablo (Jun 29 Sun → Jun 30 Mon) — same date
  '2025-07-20', // Independencia (fixed, falls on Sunday — already a non-workday)
  '2025-08-07', // Batalla de Boyacá
  '2025-08-18', // Asunción (moved from Aug 15 Fri → Aug 18 Mon)
  '2025-10-13', // Día de la Raza (moved from Oct 12 Sun → Oct 13 Mon)
  '2025-11-03', // Todos los Santos (moved from Nov 1 Sat → Nov 3 Mon)
  '2025-11-17', // Independencia de Cartagena (moved from Nov 11 Tue → Nov 17 Mon)
  '2025-12-08', // Inmaculada Concepción
  '2025-12-25', // Navidad
])

// ── 2026 ─────────────────────────────────────────────────────────────────────
// Easter 2026: April 5
const HOLIDAYS_2026 = new Set([
  '2026-01-01', // Año Nuevo
  '2026-01-12', // Reyes Magos (moved from Jan 6 Tue → Jan 12 Mon)
  '2026-03-23', // San José (moved from Mar 19 Thu → Mar 23 Mon)
  '2026-04-02', // Jueves Santo
  '2026-04-03', // Viernes Santo
  '2026-05-01', // Día del Trabajo
  '2026-05-18', // Ascensión (39d after Easter May 14 Thu → May 18 Mon)
  '2026-06-08', // Corpus Christi (60d after Easter Jun 4 Thu → Jun 8 Mon)
  '2026-06-15', // Sagrado Corazón (68d after Easter Jun 12 Fri → Jun 15 Mon)
  '2026-06-29', // San Pedro y San Pablo (already Monday)
  '2026-07-20', // Independencia (already Monday)
  '2026-08-07', // Batalla de Boyacá
  '2026-08-17', // Asunción (moved from Aug 15 Sat → Aug 17 Mon)
  '2026-10-12', // Día de la Raza (already Monday)
  '2026-11-02', // Todos los Santos (moved from Nov 1 Sun → Nov 2 Mon)
  '2026-11-16', // Independencia de Cartagena (moved from Nov 11 Wed → Nov 16 Mon)
  '2026-12-08', // Inmaculada Concepción
  '2026-12-25', // Navidad
])

// Combined set for range queries that may span both years
const ALL_HOLIDAYS = new Set([...HOLIDAYS_2025, ...HOLIDAYS_2026])

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function isColombianWorkDay(date: Date): boolean {
  const day = date.getDay()
  if (day === 0 || day === 6) return false
  return !ALL_HOLIDAYS.has(toISODate(date))
}

// Count Colombian working days in [start, end] inclusive.
// Correctly excludes weekends and public holidays for both 2025 and 2026.
export function countColombianWorkDays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()))
  const endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()))
  while (cur <= endUTC) {
    const day = cur.getUTCDay()
    if (day !== 0 && day !== 6) {
      const iso = cur.toISOString().split('T')[0]
      if (!ALL_HOLIDAYS.has(iso)) count++
    }
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return count
}

// Total Colombian working days in 2026: 243
// (365 days − 104 weekend days − 18 public holidays falling on weekdays)
export const COLOMBIAN_WORK_DAYS_2026 = 243
