// Colombian public holidays for 2026
// Fixed holidays + moveable holidays per Ley 51 de 1983 (moved to nearest Monday)
// Easter 2026: April 5
const HOLIDAYS_2026 = new Set([
  '2026-01-01', // Año Nuevo
  '2026-01-12', // Reyes Magos (moved from Jan 6 Tue → Jan 12 Mon)
  '2026-03-23', // San José (moved from Mar 19 Thu → Mar 23 Mon)
  '2026-04-02', // Jueves Santo
  '2026-04-03', // Viernes Santo
  '2026-05-01', // Día del Trabajo
  '2026-05-18', // Ascensión (39d after Easter, moved Thu May 14 → Mon May 18)
  '2026-06-08', // Corpus Christi (60d after Easter, moved Thu Jun 4 → Mon Jun 8)
  '2026-06-15', // Sagrado Corazón (68d after Easter, moved Fri Jun 12 → Mon Jun 15)
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

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function isColombianWorkDay(date: Date): boolean {
  const day = date.getDay()
  if (day === 0 || day === 6) return false
  return !HOLIDAYS_2026.has(toISODate(date))
}

// Count Colombian working days in [start, end] inclusive
export function countColombianWorkDays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()))
  const endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()))
  while (cur <= endUTC) {
    const day = cur.getUTCDay()
    if (day !== 0 && day !== 6) {
      const iso = cur.toISOString().split('T')[0]
      if (!HOLIDAYS_2026.has(iso)) count++
    }
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return count
}

// Total Colombian working days in the calendar year 2026: 243
// (365 days − 104 weekend days − 18 public holidays falling on weekdays)
export const COLOMBIAN_WORK_DAYS_2026 = 243
