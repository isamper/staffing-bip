import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const mockNames = [
  'Hernando Baquero','John Jairo Romero','Juan Fernando Forero','Henry Jaimes',
  'Andrés Cubillos','Jaime Barco','Carla Villaverde','Felipe Estrada','Iván Melo',
  'Magda Patiño','Alejandro Manrique','John Casallas','Felipe Mediorreal','Santiago Serna',
  'Angélica Tarazona','Andrea Rosales','Guillermo Ferro','Diego Castro','Raúl Aular',
  'Lina Gutiérrez','Juan David Figueroa','Antonio Pérez','Santiago Restrepo',
  'Ixtli Yolot Barbosa','Juan David Yara','Violeta Rodríguez','Maria Camila González',
  'Maria Camila Coronado','Maria Carolina De Lima','Nathalia Vélez','Juan David Alarcón',
  'María Crissien','Fabian Becerra','Nicolas Velez','Mateo Pimentel','Diego Campos',
  'Juan Felipe Patiño','David Rincón','Daniel Ángel','Gabriela García','Laura Forero',
  'Lina María Gómez','Juan Felipe Sánchez','Nathalia Quiroga','Sebastian Gomez',
  'Andrés Villota','Juan Currea','Julián Cardenas','Emilio Baquerizo','Santiago Arevalo',
  'Matias Bermudez','Juana Mejia','Sophie Tobias','Manuela Lizcano','Giuliana Volpi',
  'Juan Felipe Puig','Juan Manuel Perez','Maria Fernanda Amador','Amalia Carbonell',
  'Santiago Celis','Sofia Correa'
]

const SKIP = new Set(['Bip Iberia','Bip Italia','Bip UK','Bip Brasil',
  'Consultor Externo Negocios/IT','Open Knowledge','Advantis Consultoría'])
const isGeneric = n => n.startsWith('#Generic') || SKIP.has(n)

// Normalize: lowercase + strip accents + strip non-alphanumeric
function norm(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'').trim()
}

const mockNormMap = new Map(mockNames.map(n => [norm(n), n]))

const files = [
  { path: 'C:/Users/isabe/OneDrive/Documents/3. Spring2026/AI Prototyping Bootcamp/BIP Engagement with Proposal Historic.xlsx', label: 'HISTORIC' },
  { path: 'C:/Users/isabe/OneDrive/Documents/3. Spring2026/AI Prototyping Bootcamp/BIP Engagement with Proposal P1+P2-2026-05-11-09-03-52 1.xlsx', label: '2026' },
]

const kimble2026 = new Set()
const kimbleHist = new Set()

for (const { path, label } of files) {
  const wb = XLSX.readFile(path)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
  data.slice(12).filter(r => r[1] === 'Firm (100%)' && r[3]).forEach(r => {
    const n = String(r[3]).trim()
    if (!isGeneric(n)) (label === 'HISTORIC' ? kimbleHist : kimble2026).add(n)
  })
}

console.log('=== 2026 KIMBLE: NOT MATCHED IN MOCK ===')
const missing2026 = []
const accentMismatch = []
;[...kimble2026].sort().forEach(n => {
  const mockExact = mockNames.includes(n)
  const mockNorm  = mockNormMap.get(norm(n))
  if (!mockExact && !mockNorm) missing2026.push(n)
  else if (!mockExact && mockNorm) accentMismatch.push({ kimble: n, mock: mockNorm })
})
accentMismatch.forEach(({ kimble, mock }) =>
  console.log(`  ACCENT/SPELLING  Kimble: "${kimble}"  →  Mock: "${mock}"`)
)
missing2026.forEach(n => console.log(`  MISSING FROM MOCK: "${n}"`))

console.log('\n=== MOCK: NOT IN 2026 KIMBLE (bench / no active 2026 project) ===')
mockNames.forEach(n => {
  const inK = [...kimble2026].some(k => k === n || norm(k) === norm(n))
  if (!inK) console.log(`  "${n}"`)
})

console.log('\n=== HISTORIC KIMBLE: NOT IN MOCK (former staff / externals) ===')
;[...kimbleHist].sort().forEach(n => {
  if (!mockNormMap.has(norm(n))) console.log(`  "${n}"`)
})
