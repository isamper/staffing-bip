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
import nodemailer from 'nodemailer'

const SUPABASE_URL = 'https://hndooobymqxkaymktbzz.supabase.co'
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY
const GMAIL_USER = process.env.GMAIL_USER       // your.email@gmail.com
const GMAIL_PASS = process.env.GMAIL_PASS       // 16-char Gmail App Password

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Set SERVICE_ROLE_KEY env var')
  process.exit(1)
}
if (!GMAIL_USER || !GMAIL_PASS) {
  console.error('❌  Set GMAIL_USER and GMAIL_PASS env vars')
  console.error('   GMAIL_USER=you@gmail.com GMAIL_PASS=xxxx xxxx xxxx xxxx')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
})

// ── Consultant list ──────────────────────────────────────────────────────────
const consultants = [
  { name: 'Hernando Baquero',         email: 'hernando.baquero@bip-group.com',  seniority: 'Senior Partner' },
  { name: 'John Jairo Romero',        email: 'john.romero@bip-group.com',       seniority: 'Partner' },
  { name: 'Juan Fernando Forero',     email: 'juan.forero@bip-group.com',       seniority: 'Partner' },
  { name: 'Henry Jaimes',             email: 'henry.jaimes@bip-group.com',      seniority: 'Director' },
  { name: 'Andrés Cubillos',          email: 'andres.cubillos@bip-group.com',   seniority: 'Senior Manager' },
  { name: 'Jaime Barco',              email: 'jaime.barco@bip-group.com',       seniority: 'Senior Manager' },
  { name: 'Carla Villaverde',         email: 'carla.villaverde@bip-group.com',  seniority: 'Senior Manager' },
  { name: 'Felipe Estrada',           email: 'felipe.estrada@bip-group.com',    seniority: 'Senior Manager' },
  { name: 'Iván Melo',                email: 'ivan.melo@bip-group.com',         seniority: 'Senior Manager' },
  { name: 'Magda Patiño',             email: 'magda.patino@bip-group.com',      seniority: 'Manager' },
  { name: 'Alejandro Manrique',       email: 'alejandro.manrique@bip-group.com', seniority: 'Manager' },
  { name: 'John Casallas',            email: 'john.casallas@bip-group.com',     seniority: 'Manager' },
  { name: 'Felipe Mediorreal',        email: 'felipe.mediorreal@bip-group.com', seniority: 'Manager' },
  { name: 'Santiago Serna',           email: 'santiago.serna@bip-group.com',    seniority: 'Manager' },
  { name: 'Angélica Tarazona',        email: 'angelica.tarazona@bip-group.com', seniority: 'Manager' },
  { name: 'Andrea Rosales',           email: 'andrea.rosales@bip-group.com',    seniority: 'Senior Associate' },
  { name: 'Guillermo Ferro',          email: 'guillermo.ferro@bip-group.com',   seniority: 'Senior Associate' },
  { name: 'Diego Castro',             email: 'diego.castro@bip-group.com',      seniority: 'Senior Associate' },
  { name: 'Raúl Aular',               email: 'raul.aular@bip-group.com',        seniority: 'Associate' },
  { name: 'Lina Gutiérrez',           email: 'lina.gutierrez@bip-group.com',    seniority: 'Senior Associate' },
  { name: 'Juan David Figueroa',      email: 'juan.figueroa@bip-group.com',     seniority: 'Senior Associate' },
  { name: 'Antonio Pérez',            email: 'antonio.perez@bip-group.com',     seniority: 'Associate' },
  { name: 'Santiago Restrepo',        email: 'santiago.restrepo@bip-group.com', seniority: 'Associate' },
  { name: 'Ixtli Yolot Barbosa',      email: 'ixtli.barbosa@bip-group.com',     seniority: 'Associate' },
  { name: 'Juan David Yara',          email: 'juan.yara@bip-group.com',         seniority: 'Associate' },
  { name: 'Violeta Rodríguez',        email: 'violeta.rodriguez@bip-group.com', seniority: 'Associate' },
  { name: 'Maria Camila González',    email: 'maria.gonzalez@bip-group.com',    seniority: 'Senior Consultant' },
  { name: 'Maria Camila Coronado',    email: 'camila.coronado@bip-group.com',   seniority: 'Senior Consultant' },
  { name: 'Maria Carolina De Lima',   email: 'maria.delima@bip-group.com',      seniority: 'Senior Consultant' },
  { name: 'Nathalia Vélez',           email: 'nathalia.velez@bip-group.com',    seniority: 'Senior Consultant' },
  { name: 'Juan David Alarcón',       email: 'juan.alarcon@bip-group.com',      seniority: 'Senior Consultant' },
  { name: 'María Crissien',           email: 'maria.crissien@bip-group.com',    seniority: 'Senior Consultant' },
  { name: 'Fabian Becerra',           email: 'fabian.becerra@bip-group.com',    seniority: 'Senior Consultant' },
  { name: 'Nicolas Velez',            email: 'nicolas.velez@bip-group.com',     seniority: 'Senior Consultant' },
  { name: 'Mateo Pimentel',           email: 'mateo.pimentel@bip-group.com',    seniority: 'Senior Consultant' },
  { name: 'Diego Campos',             email: 'diego.campos@bip-group.com',      seniority: 'Senior Consultant' },
  { name: 'Juan Felipe Patiño',       email: 'felipe.patino@bip-group.com',     seniority: 'Senior Consultant' },
  { name: 'David Rincón',             email: 'david.rincon@bip-group.com',      seniority: 'Senior Consultant' },
  { name: 'Daniel Ángel',             email: 'daniel.angel@bip-group.com',      seniority: 'Senior Consultant' },
  { name: 'Gabriela García',          email: 'gabriela.garcia@bip-group.com',   seniority: 'Senior Consultant' },
  { name: 'Laura Forero',             email: 'laura.forero@bip-group.com',      seniority: 'Senior Consultant' },
  { name: 'Lina María Gómez',         email: 'lina.gomez@bip-group.com',        seniority: 'Consultant' },
  { name: 'Juan Felipe Sánchez',      email: 'juan.sanchez@bip-group.com',      seniority: 'Consultant' },
  { name: 'Nathalia Quiroga',         email: 'nathalia.quiroga@bip-group.com',  seniority: 'Consultant' },
  { name: 'Sebastian Gomez',          email: 'sebastian.gomez@bip-group.com',   seniority: 'Consultant' },
  { name: 'Andrés Villota',           email: 'andres.villota@bip-group.com',    seniority: 'Consultant' },
  { name: 'Juan Currea',              email: 'juan.currea@bip-group.com',       seniority: 'Consultant' },
  { name: 'Julián Cardenas',          email: 'julian.cardenas@bip-group.com',   seniority: 'Consultant' },
  { name: 'Emilio Baquerizo',         email: 'emilio.baquerizo@bip-group.com',  seniority: 'Consultant' },
  { name: 'Santiago Arevalo',         email: 'santiago.arevalo@bip-group.com',  seniority: 'Consultant' },
  { name: 'Matias Bermudez',          email: 'matias.bermudez@bip-group.com',   seniority: 'Consultant' },
  { name: 'Juana Mejia',              email: 'juana.mejia@bip-group.com',       seniority: 'Consultant' },
  { name: 'Sophie Tobias',            email: 'sophie.tobias@bip-group.com',     seniority: 'Consultant' },
  { name: 'Manuela Lizcano',          email: 'manuela.lizcano@bip-group.com',   seniority: 'Consultant' },
  { name: 'Giuliana Volpi',           email: 'giuliana.volpi@bip-group.com',    seniority: 'Consultant' },
  { name: 'Juan Felipe Puig',         email: 'juan.puig@bip-group.com',         seniority: 'Consultant' },
  { name: 'Juan Manuel Perez',        email: 'manuel.perez@bip-group.com',      seniority: 'Intern' },
  { name: 'Maria Fernanda Amador',    email: 'maria.amador@bip-group.com',      seniority: 'Intern' },
  { name: 'Amalia Carbonell',         email: 'amalia.carbonell@bip-group.com',  seniority: 'Intern' },
  { name: 'Santiago Celis',           email: 'santiago.celis@bip-group.com',    seniority: 'Intern' },
  { name: 'Sofia Correa',             email: 'sofia.correa@bip-group.com',      seniority: 'Intern' },
  { name: 'Andres Felipe Sopo',       email: 'andres.sopo@bip-group.com',       seniority: 'Consultant' },
  { name: 'Catalina Bernal',          email: 'catalina.bernal@bip-group.com',   seniority: 'Consultant' },
  { name: 'Daniel Cortes',            email: 'daniel.cortes@bip-group.com',     seniority: 'Consultant' },
  { name: 'Ernesto Duarte',           email: 'ernesto.duarte@bip-group.com',    seniority: 'Consultant' },
  { name: 'Hernan Sanchez',           email: 'hernan.sanchez@bip-group.com',    seniority: 'Consultant' },
  { name: 'Juan Andres Martinez',     email: 'juan.martinez@bip-group.com',     seniority: 'Consultant' },
  { name: 'Juan Carlos Cárdenas',     email: 'juan.cardenas@bip-group.com',     seniority: 'Consultant' },
  { name: 'Juan Felipe Quintero',     email: 'juan.quintero@bip-group.com',     seniority: 'Consultant' },
  { name: 'Juan Pablo Linares',       email: 'juan.linares@bip-group.com',      seniority: 'Consultant' },
  { name: 'María Constanza Cabrera',  email: 'maria.cabrera@bip-group.com',     seniority: 'Consultant' },
  { name: 'Santiago Luengas',         email: 'santiago.luengas@bip-group.com',  seniority: 'Consultant' },
  { name: 'Jaime Aragón',             email: 'jaime.aragon@bip-group.com',      seniority: 'Senior Manager' },
  // ── New hires 2026 ───────────────────────────────────────────────────────
  { name: 'Melissa Almeida',          email: 'melissa.almeida@bip-group.com',   seniority: 'Consultant' },
  { name: 'Sara Lopez',               email: 'sara.lopez@bip-group.com',        seniority: 'Consultant' },
  { name: 'Mateo Zarama',             email: 'mateo.zarama@bip-group.com',      seniority: 'Consultant' },
  { name: 'Alejandro Abdel',          email: 'alejandro.abdel@bip-group.com',   seniority: 'Consultant' },
  // HR admins
  { name: 'Martha Martinez',          email: 'martha.martinez@bip-group.com',   seniority: 'Manager' },
  { name: 'Isabel Samper',            email: 'isabel.samper@bip-group.com',     seniority: 'Senior Manager' },
]

const TEMP_PASSWORD = 'Bip2026!'

function inviteEmailHtml(name) {
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
      Ya tienes tu cuenta lista. Ingresa con tus credenciales:
    </p>
    <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px;color:#64748b;font-size:13px">URL</p>
      <p style="margin:0 0 16px;font-weight:600;color:#1e3a5f">staffing-bip.vercel.app</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px">Correo</p>
      <p style="margin:0 0 16px;font-weight:600;color:#1e3a5f">${name.split(' ')[0].toLowerCase()}.${name.split(' ').pop().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@bip-group.com</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px">Contraseña temporal</p>
      <p style="margin:0;font-weight:700;color:#1e3a5f;font-size:18px;letter-spacing:1px">${TEMP_PASSWORD}</p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="https://staffing-bip.vercel.app/login"
         style="background:#1e3a5f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
        Ingresar a bench. →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
      Puedes cambiar tu contraseña desde la plataforma usando "¿Olvidaste tu contraseña?".
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
    // 1. Create user with temporary password — no magic links, avoids corporate email scanner issues
    const { error: createError } = await supabase.auth.admin.createUser({
      email: c.email,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: { name: c.name, seniority: c.seniority ?? 'Consultant', must_change_pw: true },
    })

    if (createError && !createError.message.includes('already been registered')) {
      console.error(`  ✗  ${c.email}: ${createError.message}`)
      fail++
      continue
    }

    if (createError?.message?.includes('already been registered')) {
      console.log(`  ↩  ${c.email} (already exists — skipping account creation, re-sending email)`)
    }

    // 2. Send email via Gmail with temporary password
    const recipient = process.env.TEST_RECIPIENT || c.email
    try {
      await transporter.sendMail({
        from: `"bench. Bip Consulting" <${GMAIL_USER}>`,
        to: recipient,
        subject: 'Tu acceso a bench. (Bip Consulting)',
        html: inviteEmailHtml(c.name),
      })
      console.log(`  ✓  ${c.email}`)
      ok++
    } catch (emailErr) {
      console.error(`  ✗  ${c.email} (email failed): ${emailErr.message}`)
      fail++
    }

    await new Promise(r => setTimeout(r, 300))
  }

  transporter.close()
  console.log(`\nDone. ${ok} sent, ${fail} errors.`)
  if (fail > 0) process.exit(1)
}

main()
