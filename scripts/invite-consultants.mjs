/**
 * bench. — one-time invite script
 *
 * Sends a Supabase invite email to every consultant so they can set their
 * own password and log in.
 *
 * Usage:
 *   1. Find your service_role key:
 *      Supabase dashboard → Settings → API → "service_role secret" → Reveal
 *   2. Run:
 *      SERVICE_ROLE_KEY=eyJ... node scripts/invite-consultants.mjs
 *
 * Safe to re-run — already-invited users get a new invite link (harmless).
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hndooobymqxkaymktbzz.supabase.co'
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Set SERVICE_ROLE_KEY env var first:')
  console.error('   SERVICE_ROLE_KEY=eyJ... node scripts/invite-consultants.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Consultant list ──────────────────────────────────────────────────────────
// Email derivation: first + last name, lowercase, no accents, @bip-group.com
const consultants = [
  { name: 'Hernando Baquero',         email: 'hernando.baquero@bip-group.com' },
  { name: 'John Jairo Romero',        email: 'john.romero@bip-group.com' },
  { name: 'Juan Fernando Forero',     email: 'juan.forero@bip-group.com' },
  { name: 'Henry Jaimes',             email: 'henry.jaimes@bip-group.com' },
  { name: 'Andrés Cubillos',          email: 'andres.cubillos@bip-group.com' },
  { name: 'Jaime Barco',              email: 'jaime.barco@bip-group.com' },
  { name: 'Carla Villaverde',         email: 'carla.villaverde@bip-group.com' },
  { name: 'Felipe Estrada',           email: 'felipe.estrada@bip-group.com' },
  { name: 'Iván Melo',                email: 'ivan.melo@bip-group.com' },
  { name: 'Magda Patiño',             email: 'magda.patino@bip-group.com' },
  { name: 'Alejandro Manrique',       email: 'alejandro.manrique@bip-group.com' },
  { name: 'John Casallas',            email: 'john.casallas@bip-group.com' },
  { name: 'Felipe Mediorreal',        email: 'felipe.mediorreal@bip-group.com' },
  { name: 'Santiago Serna',           email: 'santiago.serna@bip-group.com' },
  { name: 'Angélica Tarazona',        email: 'angelica.tarazona@bip-group.com' },
  { name: 'Andrea Rosales',           email: 'andrea.rosales@bip-group.com' },
  { name: 'Guillermo Ferro',          email: 'guillermo.ferro@bip-group.com' },
  { name: 'Diego Castro',             email: 'diego.castro@bip-group.com' },
  { name: 'Raúl Aular',               email: 'raul.aular@bip-group.com' },
  { name: 'Lina Gutiérrez',           email: 'lina.gutierrez@bip-group.com' },
  { name: 'Juan David Figueroa',      email: 'juan.figueroa@bip-group.com' },
  { name: 'Antonio Pérez',            email: 'antonio.perez@bip-group.com' },
  { name: 'Santiago Restrepo',        email: 'santiago.restrepo@bip-group.com' },
  { name: 'Ixtli Yolot Barbosa',      email: 'ixtli.barbosa@bip-group.com' },
  { name: 'Juan David Yara',          email: 'juan.yara@bip-group.com' },
  { name: 'Violeta Rodríguez',        email: 'violeta.rodriguez@bip-group.com' },
  { name: 'Maria Camila González',    email: 'maria.gonzalez@bip-group.com' },
  { name: 'Maria Camila Coronado',    email: 'maria.coronado@bip-group.com' },
  { name: 'Maria Carolina De Lima',   email: 'maria.lima@bip-group.com' },
  { name: 'Nathalia Vélez',           email: 'nathalia.velez@bip-group.com' },
  { name: 'Juan David Alarcón',       email: 'juan.alarcon@bip-group.com' },
  { name: 'María Crissien',           email: 'maria.crissien@bip-group.com' },
  { name: 'Fabian Becerra',           email: 'fabian.becerra@bip-group.com' },
  { name: 'Nicolas Velez',            email: 'nicolas.velez@bip-group.com' },
  { name: 'Mateo Pimentel',           email: 'mateo.pimentel@bip-group.com' },
  { name: 'Diego Campos',             email: 'diego.campos@bip-group.com' },
  { name: 'Juan Felipe Patiño',       email: 'juan.patino@bip-group.com' },
  { name: 'David Rincón',             email: 'david.rincon@bip-group.com' },
  { name: 'Daniel Ángel',             email: 'daniel.angel@bip-group.com' },
  { name: 'Gabriela García',          email: 'gabriela.garcia@bip-group.com' },
  { name: 'Laura Forero',             email: 'laura.forero@bip-group.com' },
  { name: 'Lina María Gómez',         email: 'lina.gomez@bip-group.com' },
  { name: 'Juan Felipe Sánchez',      email: 'juan.sanchez@bip-group.com' },
  { name: 'Nathalia Quiroga',         email: 'nathalia.quiroga@bip-group.com' },
  { name: 'Sebastian Gomez',          email: 'sebastian.gomez@bip-group.com' },
  { name: 'Andrés Villota',           email: 'andres.villota@bip-group.com' },
  { name: 'Juan Currea',              email: 'juan.currea@bip-group.com' },
  { name: 'Julián Cardenas',          email: 'julian.cardenas@bip-group.com' },
  { name: 'Emilio Baquerizo',         email: 'emilio.baquerizo@bip-group.com' },
  { name: 'Santiago Arevalo',         email: 'santiago.arevalo@bip-group.com' },
  { name: 'Matias Bermudez',          email: 'matias.bermudez@bip-group.com' },
  { name: 'Juana Mejia',              email: 'juana.mejia@bip-group.com' },
  { name: 'Sophie Tobias',            email: 'sophie.tobias@bip-group.com' },
  { name: 'Manuela Lizcano',          email: 'manuela.lizcano@bip-group.com' },
  { name: 'Giuliana Volpi',           email: 'giuliana.volpi@bip-group.com' },
  { name: 'Juan Felipe Puig',         email: 'juan.puig@bip-group.com' },
  { name: 'Juan Manuel Perez',        email: 'juan.perez@bip-group.com' },
  { name: 'Maria Fernanda Amador',    email: 'maria.amador@bip-group.com' },
  { name: 'Amalia Carbonell',         email: 'amalia.carbonell@bip-group.com' },
  { name: 'Santiago Celis',           email: 'santiago.celis@bip-group.com' },
  { name: 'Sofia Correa',             email: 'sofia.correa@bip-group.com' },
  { name: 'Andres Felipe Sopo',       email: 'andres.sopo@bip-group.com' },
  { name: 'Catalina Bernal',          email: 'catalina.bernal@bip-group.com' },
  { name: 'Daniel Cortes',            email: 'daniel.cortes@bip-group.com' },
  { name: 'Ernesto Duarte',           email: 'ernesto.duarte@bip-group.com' },
  { name: 'Hernan Sanchez',           email: 'hernan.sanchez@bip-group.com' },
  { name: 'Juan Andres Martinez',     email: 'juan.martinez@bip-group.com' },
  { name: 'Juan Carlos Cárdenas',     email: 'juan.cardenas@bip-group.com' },
  { name: 'Juan Felipe Quintero',     email: 'juan.quintero@bip-group.com' },
  { name: 'Juan Pablo Linares',       email: 'juan.linares@bip-group.com' },
  { name: 'María Constanza Cabrera',  email: 'maria.cabrera@bip-group.com' },
  { name: 'Santiago Luengas',         email: 'santiago.luengas@bip-group.com' },
  { name: 'Jaime Aragón',             email: 'jaime.aragon@bip-group.com' },
  // HR admins (not in mockConsultants but need access)
  { name: 'Martha Martinez',          email: 'martha.martinez@bip-group.com' },
]

async function main() {
  console.log(`Inviting ${consultants.length} users to bench.\n`)
  let ok = 0, fail = 0

  for (const c of consultants) {
    const { error } = await supabase.auth.admin.inviteUserByEmail(c.email, {
      data: { name: c.name },
      redirectTo: 'https://staffing-bip.vercel.app/login',
    })

    if (error) {
      // "User already registered" is not a real error — they'll get a new link
      const msg = error.message ?? ''
      if (msg.includes('already')) {
        console.log(`  ↩  ${c.email} (already registered, re-invited)`)
      } else {
        console.error(`  ✗  ${c.email}: ${msg}`)
        fail++
      }
    } else {
      console.log(`  ✓  ${c.email}`)
      ok++
    }

    // Respect Supabase rate limits
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\nDone. ${ok} invited, ${fail} errors.`)
  if (fail > 0) process.exit(1)
}

main()
