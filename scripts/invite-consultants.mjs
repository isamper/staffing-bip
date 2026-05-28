/**
 * bench. — one-time invite script
 *
 * Generates a Supabase invite link for every consultant and sends it via
 * Resend (bypasses Supabase's unreliable built-in email service).
 *
 * Usage:
 *   SERVICE_ROLE_KEY=eyJ... RESEND_API_KEY=re_... node scripts/invite-consultants.mjs
 *
 * To invite only specific emails:
 *   EMAILS=isabel.samper@bip-group.com SERVICE_ROLE_KEY=eyJ... RESEND_API_KEY=re_... node scripts/invite-consultants.mjs
 *
 * Safe to re-run — existing users get a fresh invite link.
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const SUPABASE_URL = 'https://hndooobymqxkaymktbzz.supabase.co'
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Set SERVICE_ROLE_KEY env var:')
  console.error('   SERVICE_ROLE_KEY=eyJ... RESEND_API_KEY=re_... node scripts/invite-consultants.mjs')
  process.exit(1)
}
if (!RESEND_API_KEY) {
  console.error('❌  Set RESEND_API_KEY env var:')
  console.error('   SERVICE_ROLE_KEY=eyJ... RESEND_API_KEY=re_... node scripts/invite-consultants.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const resend = new Resend(RESEND_API_KEY)

// ── Consultant list ──────────────────────────────────────────────────────────
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
  { name: 'Maria Camila Coronado',    email: 'camila.coronado@bip-group.com' },
  { name: 'Maria Carolina De Lima',   email: 'maria.delima@bip-group.com' },
  { name: 'Nathalia Vélez',           email: 'nathalia.velez@bip-group.com' },
  { name: 'Juan David Alarcón',       email: 'juan.alarcon@bip-group.com' },
  { name: 'María Crissien',           email: 'maria.crissien@bip-group.com' },
  { name: 'Fabian Becerra',           email: 'fabian.becerra@bip-group.com' },
  { name: 'Nicolas Velez',            email: 'nicolas.velez@bip-group.com' },
  { name: 'Mateo Pimentel',           email: 'mateo.pimentel@bip-group.com' },
  { name: 'Diego Campos',             email: 'diego.campos@bip-group.com' },
  { name: 'Juan Felipe Patiño',       email: 'felipe.patino@bip-group.com' },
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
  { name: 'Juan Manuel Perez',        email: 'manuel.perez@bip-group.com' },
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
  // ── New hires 2026 ───────────────────────────────────────────────────────
  { name: 'Melissa Almeida',          email: 'melissa.almeida@bip-group.com' },
  { name: 'Sara Lopez',               email: 'sara.lopez@bip-group.com' },
  { name: 'Mateo Zarama',             email: 'mateo.zarama@bip-group.com' },
  { name: 'Alejandro Abdel',          email: 'alejandro.abdel@bip-group.com' },
  // HR admins
  { name: 'Martha Martinez',          email: 'martha.martinez@bip-group.com' },
]

function inviteEmailHtml(name, inviteLink) {
  const firstName = name.split(' ')[0]
  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f8fafc;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:12px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
    <p style="font-size:28px;font-weight:700;color:#1e3a5f;margin:0 0 4px">bench<span style="color:#e53e3e">.</span></p>
    <p style="color:#64748b;margin:0 0 24px;font-size:13px">Smart Staffing by Bip Consulting</p>
    <h2 style="color:#1e3a5f;margin:0 0 12px">Hola, ${firstName} 👋</h2>
    <p style="color:#334155;line-height:1.6">
      Has sido invitado/a a <strong>bench.</strong>, la plataforma de staffing de Bip Consulting Colombia.
      Haz clic en el botón para crear tu contraseña y acceder a tu perfil.
    </p>
    <div style="text-align:center;margin:32px 0">
      <a href="${inviteLink}"
         style="background:#1e3a5f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
        Crear mi contraseña →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
      Este enlace expira en 24 horas. Si no esperabas esta invitación, puedes ignorar este correo.
    </p>
  </div>
</body>
</html>`
}

async function main() {
  // Optional: filter to specific emails via EMAILS env var
  const emailFilter = process.env.EMAILS
    ? process.env.EMAILS.split(',').map(e => e.trim().toLowerCase())
    : null

  const targets = emailFilter
    ? consultants.filter(c => emailFilter.includes(c.email.toLowerCase()))
    : consultants

  if (emailFilter && targets.length === 0) {
    console.error('❌  No matching consultants found for the EMAILS filter.')
    process.exit(1)
  }

  console.log(`Inviting ${targets.length} user(s) to bench.\n`)
  let ok = 0, fail = 0

  for (const c of targets) {
    // 1. Generate invite link via Supabase Admin (creates/updates the user)
    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: c.email,
      options: {
        redirectTo: 'https://staffing-bip.vercel.app/login',
        data: { name: c.name },
      },
    })

    if (linkError) {
      console.error(`  ✗  ${c.email}: ${linkError.message}`)
      fail++
      continue
    }

    const inviteLink = data?.properties?.action_link
    if (!inviteLink) {
      console.error(`  ✗  ${c.email}: no action_link returned`)
      fail++
      continue
    }

    // 2. Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'bench. <onboarding@resend.dev>',
      to: c.email,
      subject: 'Tu invitación a bench. (Bip Consulting)',
      html: inviteEmailHtml(c.name, inviteLink),
    })

    if (emailError) {
      console.error(`  ✗  ${c.email} (email failed): ${emailError.message}`)
      fail++
    } else {
      console.log(`  ✓  ${c.email}`)
      ok++
    }

    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\nDone. ${ok} sent, ${fail} errors.`)
  if (fail > 0) process.exit(1)
}

main()
