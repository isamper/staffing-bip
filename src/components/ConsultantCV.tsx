import { useState, useRef, useCallback } from 'react'
import {
  Pencil, X, Check, Download, FileText, Presentation,
  GraduationCap, Globe, Briefcase, Award, Wrench, Plus, Camera, ZoomIn, ZoomOut,
  Languages, Loader2,
} from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { SUGGESTED_SKILLS } from '@/lib/skills'

const ROLE_TITLES = [
  'Socio Senior',
  'Socio',
  'Director',
  'Gerente Senior',
  'Gerente',
  'Asociado Senior',
  'Asociado',
  'Consultor Senior',
  'Consultor',
  'Practicante',
]

// Maps Spanish display title → Kimble English seniority value
const TITLE_TO_SENIORITY: Record<string, Profile['seniority']> = {
  'Socio Senior': 'Senior Partner',
  'Socio': 'Partner',
  'Director': 'Director',
  'Gerente Senior': 'Senior Manager',
  'Gerente': 'Manager',
  'Asociado Senior': 'Senior Associate',
  'Asociado': 'Associate',
  'Consultor Senior': 'Senior Consultant',
  'Consultor': 'Consultant',
  'Practicante': 'Intern',
}
import type { Profile, ProjectAssignment, Project, ExperienceEntry, CVVersion } from '@/lib/types'

// ── helpers ───────────────────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2 border-b border-slate-100 pb-1">
        <span className="text-navy-600">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function EditableText({
  value, placeholder, onSave, multiline = false, className = '', inputClassName = '',
}: {
  value: string; placeholder: string; onSave: (v: string) => void
  multiline?: boolean; className?: string; inputClassName?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const inputCls = inputClassName || 'bg-white text-slate-800'

  // Auto-save when focus leaves the field (e.g. user clicks "Guardar CV").
  // The cancel button uses onMouseDown + preventDefault to suppress blur so
  // the cancel path can restore the original value without triggering a save.
  const commit = () => { onSave(draft); setEditing(false) }
  const cancel  = () => { setDraft(value); setEditing(false) }

  if (editing) {
    return (
      <div className="flex gap-1 items-start">
        {multiline ? (
          <textarea
            className={`flex-1 rounded border border-navy-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-navy-400 resize-none ${inputCls}`}
            value={draft}
            rows={4}
            autoFocus
            onChange={e => { setDraft(e.target.value); onSave(e.target.value) }}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); cancel() } }}
          />
        ) : (
          <input
            className={`flex-1 rounded border border-navy-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-navy-400 ${inputCls}`}
            value={draft}
            autoFocus
            onChange={e => { setDraft(e.target.value); onSave(e.target.value) }}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.preventDefault(); commit() }
              if (e.key === 'Escape') { e.preventDefault(); cancel() }
            }}
          />
        )}
        {/* onMouseDown preventDefault stops blur from firing before the click */}
        <button onMouseDown={e => e.preventDefault()} onClick={commit}  className="text-green-400 hover:text-green-300 mt-1"><Check size={14} /></button>
        <button onMouseDown={e => e.preventDefault()} onClick={cancel}  className="text-slate-400 hover:text-slate-300 mt-1"><X size={14} /></button>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-1 cursor-text" onClick={() => { setDraft(value); setEditing(true) }}>
      <span className={`flex-1 text-sm ${className}`}>
        {value || <span className="italic opacity-40">{placeholder}</span>}
      </span>
      <Pencil size={11} className="shrink-0 mt-0.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

function TagEditor({
  tags, onUpdate, placeholder, suggestions,
}: {
  tags: string[]; onUpdate: (t: string[]) => void; placeholder: string; suggestions?: string[]
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const add = (value: string) => {
    const t = value.trim()
    if (t && !tags.includes(t)) onUpdate([...tags, t])
    setDraft('')
    setAdding(false)
  }

  const filtered = suggestions
    ? suggestions.filter(s => !tags.includes(s) && s.toLowerCase().includes(draft.toLowerCase()))
    : []

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map(t => (
        <span
          key={t}
          className="group inline-flex items-center gap-1 rounded-full bg-navy-50 border border-navy-100 px-2.5 py-0.5 text-xs text-navy-700"
        >
          {t}
          <button
            onClick={() => onUpdate(tags.filter(x => x !== t))}
            className="text-navy-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          ><X size={9} /></button>
        </span>
      ))}
      {adding ? (
        <div className="relative">
          <span className="inline-flex items-center gap-1">
            <input
              className="w-40 rounded-full border border-navy-300 px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-navy-400"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') add(draft)
                if (e.key === 'Escape') { setDraft(''); setAdding(false) }
              }}
              autoFocus
              placeholder={placeholder}
            />
            <button onClick={() => add(draft)} className="text-green-600 hover:text-green-700"><Check size={12} /></button>
            <button onClick={() => { setDraft(''); setAdding(false) }} className="text-slate-400"><X size={12} /></button>
          </span>
          {filtered.length > 0 && (
            <div className="absolute top-full left-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
              {filtered.slice(0, 20).map(s => (
                <button
                  key={s}
                  onMouseDown={e => { e.preventDefault(); add(s) }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-navy-50 hover:text-navy-700"
                >
                  {s}
                </button>
              ))}
              {draft.trim() && !suggestions?.includes(draft.trim()) && (
                <button
                  onMouseDown={e => { e.preventDefault(); add(draft) }}
                  className="w-full border-t border-slate-100 px-3 py-1.5 text-left text-xs text-slate-400 hover:bg-slate-50 italic"
                >
                  + Agregar "{draft.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400 hover:border-navy-400 hover:text-navy-600 transition-colors"
        >
          <Plus size={10} /> Agregar
        </button>
      )}
    </div>
  )
}

// ── Experience Editor ─────────────────────────────────────────────────────────

// Defined at module level so its identity is stable across renders — avoids
// React unmounting/remounting the inputs on every keystroke (focus loss bug).
function EntryForm({
  draft, setDraft, onSave, onCancel,
}: {
  draft: ExperienceEntry
  setDraft: React.Dispatch<React.SetStateAction<ExperienceEntry>>
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="rounded-lg border border-navy-200 bg-navy-50/40 p-3 space-y-2">
      <input
        className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-navy-400"
        placeholder="Nombre del proyecto o rol *"
        value={draft.title}
        onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-navy-400"
          placeholder="Cliente / Empresa"
          value={draft.client}
          onChange={e => setDraft(d => ({ ...d, client: e.target.value }))}
        />
        <input
          className="rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-navy-400"
          placeholder="Período (ej. 2022 – 2024)"
          value={draft.period}
          onChange={e => setDraft(d => ({ ...d, period: e.target.value }))}
        />
      </div>
      <textarea
        className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-navy-400 resize-none"
        placeholder="Descripción de actividades y logros"
        rows={3}
        value={draft.description}
        onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded px-3 py-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200">Cancelar</button>
        <button onClick={onSave} className="rounded bg-navy-800 px-3 py-1 text-xs text-white hover:bg-navy-700">Guardar</button>
      </div>
    </div>
  )
}

function ExperienceEditor({
  entries, onUpdate,
}: {
  entries: ExperienceEntry[]; onUpdate: (e: ExperienceEntry[]) => void
}) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const blank = (): ExperienceEntry => ({ id: `exp-${Date.now()}`, title: '', client: '', period: '', description: '' })
  const [draft, setDraft] = useState<ExperienceEntry>(blank())

  const save = (entry: ExperienceEntry) => {
    if (!entry.title.trim()) return
    const exists = entries.find(e => e.id === entry.id)
    onUpdate(exists ? entries.map(e => e.id === entry.id ? entry : e) : [...entries, entry])
    setAdding(false)
    setEditingId(null)
    setDraft(blank())
  }

  const remove = (id: string) => onUpdate(entries.filter(e => e.id !== id))

  const startEdit = (entry: ExperienceEntry) => { setDraft({ ...entry }); setEditingId(entry.id) }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id}>
          {editingId === entry.id ? (
            <EntryForm draft={draft} setDraft={setDraft} onSave={() => save(draft)} onCancel={() => setEditingId(null)} />
          ) : (
            <div className="group flex gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
              <div className="w-1 shrink-0 rounded-full bg-navy-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-800 leading-snug">{entry.title}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => startEdit(entry)} className="text-slate-400 hover:text-navy-600"><Pencil size={12} /></button>
                    <button onClick={() => remove(entry.id)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                </div>
                {(entry.client || entry.period) && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[entry.client, entry.period].filter(Boolean).join(' · ')}
                  </p>
                )}
                {entry.description && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{entry.description}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <EntryForm draft={draft} setDraft={setDraft} onSave={() => save(draft)} onCancel={() => { setAdding(false); setDraft(blank()) }} />
      ) : (
        <button
          onClick={() => { setDraft(blank()); setAdding(true) }}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-400 hover:border-navy-400 hover:text-navy-600 transition-colors w-full"
        >
          <Plus size={14} /> Agregar experiencia
        </button>
      )}
    </div>
  )
}

// ── Photo crop ───────────────────────────────────────────────────────────────

async function getCroppedImg(imageSrc: string, cropArea: Area): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = cropArea.width
  canvas.height = cropArea.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height)
  return canvas.toDataURL('image/jpeg', 0.9)
}

function PhotoCropModal({ src, onConfirm, onCancel }: { src: string; onConfirm: (url: string) => void; onCancel: () => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedArea) return
    const url = await getCroppedImg(src, croppedArea)
    onConfirm(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Ajustar foto</p>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="relative h-64 bg-slate-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-4 py-3 flex items-center gap-2">
          <ZoomOut size={14} className="text-slate-400 shrink-0" />
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-navy-800"
          />
          <ZoomIn size={14} className="text-slate-400 shrink-0" />
        </div>
        <div className="px-4 pb-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={handleConfirm} className="rounded-lg bg-navy-800 px-4 py-1.5 text-xs text-white hover:bg-navy-700">Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ── PDF print styles injected once ───────────────────────────────────────────

const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #cv-print-area, #cv-print-area * { visibility: visible !important; }
  #cv-print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 32px 40px; background: white; }
  .cv-no-print { display: none !important; }
  .cv-print-header { display: flex !important; }
}
`

// ── Translation (MyMemory free API — no key required) ────────────────────────

async function myMemoryTranslate(text: string, from: 'es' | 'en' = 'es', to: 'es' | 'en' = 'en'): Promise<string> {
  if (!text?.trim()) return text ?? ''
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    const res = await fetch(url)
    const json = await res.json() as { responseData?: { translatedText?: string } }
    return json.responseData?.translatedText ?? text
  } catch {
    return text
  }
}

// ── PPTX export (pptxgenjs) ───────────────────────────────────────────────────

async function exportToPptx(profile: Profile, versionLabel?: string) {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'

  const NAVY = '003366'
  const LIGHT = 'F0F4F8'
  const WHITE = 'FFFFFF'
  const GRAY = '64748B'

  const slide = pptx.addSlide()

  // Left panel background
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 3.2, h: 7.5, fill: { color: NAVY } })

  // Avatar circle placeholder
  slide.addShape(pptx.ShapeType.ellipse, { x: 0.7, y: 0.35, w: 1.8, h: 1.8, fill: { color: '1a4f8f' }, line: { color: WHITE, width: 2 } })
  slide.addText(getInitials(profile.name), {
    x: 0.7, y: 0.35, w: 1.8, h: 1.8, align: 'center', valign: 'middle',
    fontSize: 28, bold: true, color: WHITE,
  })

  // Name + title on left panel
  slide.addText(profile.name, {
    x: 0.15, y: 2.3, w: 2.9, h: 0.45,
    fontSize: 15, bold: true, color: WHITE, align: 'center', wrap: true,
  })
  slide.addText(profile.role_title, {
    x: 0.15, y: 2.75, w: 2.9, h: 0.35,
    fontSize: 10, color: 'A8C4E0', align: 'center', italic: true, wrap: true,
  })

  // Divider
  slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.2, w: 2.6, h: 0.02, fill: { color: '1a4f8f' } })

  // Left panel info blocks
  let leftY = 3.35
  const addLeftRow = (icon: string, label: string, val: string | null) => {
    if (!val) return
    slide.addText(icon + ' ' + label, { x: 0.2, y: leftY, w: 2.8, h: 0.22, fontSize: 7.5, bold: true, color: 'A8C4E0' })
    leftY += 0.22
    slide.addText(val, { x: 0.2, y: leftY, w: 2.8, h: 0.3, fontSize: 8.5, color: WHITE, wrap: true })
    leftY += 0.35
  }

  addLeftRow('🎓', 'EDUCACIÓN', profile.education)
  addLeftRow('🌐', 'IDIOMAS', profile.languages)
  if (profile.years_of_experience) addLeftRow('💼', 'EXPERIENCIA', profile.years_of_experience + ' años')
  if (profile.certifications?.length) addLeftRow('🏆', 'CERTIFICACIONES', profile.certifications.join(', '))

  // Right panel — main content
  const RX = 3.5

  // Bio
  if (profile.bio) {
    slide.addText('RESUMEN PROFESIONAL', { x: RX, y: 0.3, w: 6, h: 0.28, fontSize: 9, bold: true, color: NAVY })
    slide.addShape(pptx.ShapeType.rect, { x: RX, y: 0.58, w: 6, h: 0.025, fill: { color: NAVY } })
    slide.addText(profile.bio, {
      x: RX, y: 0.65, w: 6, h: 0.9, fontSize: 9, color: '334155', wrap: true, valign: 'top',
    })
  }

  // Skills
  if (profile.skills.length) {
    let skillY = profile.bio ? 1.65 : 0.65
    slide.addText('COMPETENCIAS', { x: RX, y: skillY, w: 6, h: 0.28, fontSize: 9, bold: true, color: NAVY })
    skillY += 0.28
    slide.addShape(pptx.ShapeType.rect, { x: RX, y: skillY, w: 6, h: 0.025, fill: { color: NAVY } })
    skillY += 0.1

    // Render skill chips in rows
    let chipX = RX
    let chipY = skillY
    for (const skill of profile.skills.slice(0, 12)) {
      const chipW = Math.min(skill.length * 0.085 + 0.3, 2.2)
      if (chipX + chipW > 9.4) { chipX = RX; chipY += 0.32 }
      slide.addShape(pptx.ShapeType.roundRect, { x: chipX, y: chipY, w: chipW, h: 0.24, fill: { color: 'EFF6FF' }, line: { color: 'BFDBFE', width: 0.5 } })
      slide.addText(skill, { x: chipX, y: chipY, w: chipW, h: 0.24, fontSize: 7.5, color: '1E40AF', align: 'center', valign: 'middle' })
      chipX += chipW + 0.1
    }
    skillY = chipY + 0.35

    // Experience
    const experience = profile.experience ?? []
    if (experience.length) {
      skillY += 0.1
      slide.addText('EXPERIENCIA PROFESIONAL', { x: RX, y: skillY, w: 6, h: 0.28, fontSize: 9, bold: true, color: NAVY })
      skillY += 0.28
      slide.addShape(pptx.ShapeType.rect, { x: RX, y: skillY, w: 6, h: 0.025, fill: { color: NAVY } })
      skillY += 0.12
      for (const exp of experience.slice(0, 4)) {
        if (skillY > 6.6) break
        slide.addShape(pptx.ShapeType.rect, { x: RX, y: skillY, w: 0.05, h: 0.2, fill: { color: NAVY } })
        const header = [exp.title, exp.client, exp.period].filter(Boolean).join(' · ')
        slide.addText(header, { x: RX + 0.15, y: skillY, w: 5.8, h: 0.2, fontSize: 8.5, bold: true, color: '1E293B', wrap: true })
        skillY += 0.22
        if (exp.description) {
          slide.addText(exp.description, { x: RX + 0.15, y: skillY, w: 5.8, h: 0.3, fontSize: 7.5, color: GRAY, wrap: true })
          skillY += 0.35
        }
      }
    }
  }

  // Footer
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.1, w: 10, h: 0.4, fill: { color: NAVY } })
  slide.addText('bench. — Bip Consulting', { x: 0.3, y: 7.15, w: 5, h: 0.3, fontSize: 8, color: WHITE })

  const suffix = versionLabel && versionLabel !== 'General' ? `_${versionLabel.replace(/\s+/g, '_')}` : ''
  await pptx.writeFile({ fileName: `CV_${profile.name.replace(/\s+/g, '_')}${suffix}.pptx` })
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ConsultantCVProps {
  profile: Profile
  assignments?: ProjectAssignment[]
  projects?: Project[]
  onUpdate?: (updated: Profile) => void
  readOnly?: boolean
}

export default function ConsultantCV({ profile, onUpdate, readOnly = false }: ConsultantCVProps) {
  const [data, setData] = useState<Profile>(profile)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── CV Versions ─────────────────────────────────────────────────────────────
  const [cvVersions, setCvVersions] = useState<CVVersion[]>(() => {
    const existing = profile.cv_versions ?? []
    if (existing.length > 0) return existing
    // Auto-create "General" version from existing profile fields
    return [{
      id: 'v-general',
      label: 'General',
      bio_es: profile.bio ?? null,
      bio_en: null,
      experience_es: profile.experience ?? [],
      experience_en: [],
    }]
  })
  const [activeVersionId, setActiveVersionId] = useState<string>(
    () => (profile.cv_versions ?? [])[0]?.id ?? 'v-general',
  )
  const [activeLang, setActiveLang] = useState<'es' | 'en'>('es')
  const [translating, setTranslating] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

  const activeVersion = cvVersions.find(v => v.id === activeVersionId) ?? cvVersions[0]
  const hasEnContent = !!(activeVersion?.bio_en || activeVersion?.experience_en?.length)

  // Merge active version + language into displayData for rendering
  const displayBio =
    activeLang === 'en' && activeVersion?.bio_en != null
      ? activeVersion.bio_en
      : activeVersion?.bio_es ?? data.bio
  const displayExperience =
    activeLang === 'en' && (activeVersion?.experience_en?.length ?? 0) > 0
      ? activeVersion!.experience_en
      : activeVersion?.experience_es ?? data.experience ?? []
  const displayData: Profile = { ...data, bio: displayBio ?? null, experience: displayExperience }

  // ── Version management helpers ────────────────────────────────────────────
  function saveVersionsAndNotify(versions: CVVersion[], sharedPatch?: Partial<Profile>) {
    setCvVersions(versions)
    const updated = { ...data, ...sharedPatch, cv_versions: versions }
    setData(updated)
    onUpdate?.(updated)
  }

  function addVersion() {
    const label = window.prompt('Nombre de la nueva versión (ej. SAP Expert, Ciberseguridad):')
    if (!label?.trim()) return
    const base = cvVersions.find(v => v.id === activeVersionId)
    const newV: CVVersion = {
      id: `v-${Date.now()}`,
      label: label.trim(),
      bio_es: base?.bio_es ?? data.bio ?? null,
      bio_en: null,
      experience_es: base?.experience_es ?? data.experience ?? [],
      experience_en: [],
    }
    const updated = [...cvVersions, newV]
    setCvVersions(updated)
    setActiveVersionId(newV.id)
    setActiveLang('es')
    saveVersionsAndNotify(updated)
  }

  function deleteVersion(id: string) {
    if (cvVersions.length <= 1) return
    const updated = cvVersions.filter(v => v.id !== id)
    if (id === activeVersionId) setActiveVersionId(updated[0].id)
    saveVersionsAndNotify(updated)
  }

  function commitRename(id: string) {
    if (!renameDraft.trim()) { setRenamingId(null); return }
    const updated = cvVersions.map(v => v.id === id ? { ...v, label: renameDraft.trim() } : v)
    setRenamingId(null)
    saveVersionsAndNotify(updated)
  }

  // ── Translation ───────────────────────────────────────────────────────────
  async function handleTranslate(direction: 'es→en' | 'en→es') {
    if (!activeVersion || translating) return
    setTranslating(true)
    try {
      const [from, to] = direction === 'es→en' ? ['es', 'en'] as const : ['en', 'es'] as const
      const srcBio = direction === 'es→en' ? activeVersion.bio_es : activeVersion.bio_en
      const srcExp = direction === 'es→en' ? activeVersion.experience_es : activeVersion.experience_en

      const translatedBio = srcBio ? await myMemoryTranslate(srcBio, from, to) : null
      const translatedExp: ExperienceEntry[] = await Promise.all(
        (srcExp ?? []).map(async (exp) => ({
          ...exp,
          description: exp.description
            ? await myMemoryTranslate(exp.description, from, to)
            : exp.description,
        }))
      )
      const patch: Partial<CVVersion> =
        direction === 'es→en'
          ? { bio_en: translatedBio, experience_en: translatedExp }
          : { bio_es: translatedBio, experience_es: translatedExp }

      const updated = cvVersions.map(v => v.id === activeVersionId ? { ...v, ...patch } : v)
      setCvVersions(updated)
      setActiveLang(to)
      saveVersionsAndNotify(updated)
    } catch (err) {
      console.error('Translation error:', err)
    } finally {
      setTranslating(false)
    }
  }

  // ── Photo ─────────────────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Update — routes bio/experience to the active CV version ──────────────
  const update = (patch: Partial<Profile>) => {
    const versionPatch: Partial<CVVersion> = {}
    const profilePatch: Partial<Profile> = {}

    for (const [key, value] of Object.entries(patch)) {
      if (key === 'bio') {
        if (activeLang === 'es') versionPatch.bio_es = value as string | null
        else versionPatch.bio_en = value as string | null
      } else if (key === 'experience') {
        if (activeLang === 'es') versionPatch.experience_es = value as ExperienceEntry[]
        else versionPatch.experience_en = value as ExperienceEntry[]
      } else {
        (profilePatch as Record<string, unknown>)[key] = value
      }
    }

    let updatedVersions = cvVersions
    if (Object.keys(versionPatch).length > 0) {
      updatedVersions = cvVersions.map(v =>
        v.id === activeVersionId ? { ...v, ...versionPatch } : v,
      )
      setCvVersions(updatedVersions)
    }

    const updated = { ...data, ...profilePatch, cv_versions: updatedVersions }
    setData(updated)
    onUpdate?.(updated)
  }

  const handlePrint = () => {
    if (!document.getElementById('cv-print-style')) {
      const s = document.createElement('style')
      s.id = 'cv-print-style'
      s.textContent = PRINT_STYLE
      document.head.appendChild(s)
    }
    window.print()
  }

  return (
    <>
    {cropSrc && (
      <PhotoCropModal
        src={cropSrc}
        onConfirm={(url) => { update({ photo_url: url }); setCropSrc(null) }}
        onCancel={() => setCropSrc(null)}
      />
    )}
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* CV Version tabs */}
      <div className="cv-no-print flex items-center gap-1 px-4 pt-3 pb-0 overflow-x-auto">
        {cvVersions.map((v, i) => (
          <div
            key={v.id}
            onClick={() => { setActiveVersionId(v.id); setActiveLang('es') }}
            className={`group relative flex items-center gap-1 rounded-t-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors select-none ${
              v.id === activeVersionId
                ? 'bg-navy-800 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-navy-800'
            }`}
          >
            {renamingId === v.id ? (
              <input
                className="w-28 bg-transparent outline-none text-xs font-medium"
                value={renameDraft}
                autoFocus
                onChange={e => setRenameDraft(e.target.value)}
                onBlur={() => commitRename(v.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename(v.id)
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                onDoubleClick={!readOnly ? (e) => { e.stopPropagation(); setRenamingId(v.id); setRenameDraft(v.label) } : undefined}
                title={!readOnly ? 'Doble clic para renombrar' : undefined}
              >
                {v.label}
              </span>
            )}
            {/* Delete button (hidden for first tab, only in edit mode) */}
            {!readOnly && i > 0 && renamingId !== v.id && (
              <button
                onClick={e => { e.stopPropagation(); deleteVersion(v.id) }}
                className={`ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                  v.id === activeVersionId ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-red-500'
                }`}
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <button
            onClick={addVersion}
            className="flex items-center gap-1 rounded-t-lg px-2.5 py-1.5 text-xs text-slate-400 hover:text-navy-600 hover:bg-slate-100 transition-colors"
          >
            <Plus size={11} /> Nueva versión
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="cv-no-print flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-1.5 flex-wrap">
          <FileText size={14} className="text-navy-600" />
          <span className="text-sm font-medium text-slate-700">Hoja de Vida</span>
          {!readOnly && (
            <span className="text-xs text-slate-400 ml-1">
              · haz clic en cualquier campo para editar
              {activeLang === 'en' && <span className="ml-1 text-navy-500 font-medium">(EN)</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Language toggle — clicking EN translates if no EN content exists yet */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            <button
              onClick={() => setActiveLang('es')}
              className={`px-2.5 py-1.5 font-medium transition-colors ${activeLang === 'es' ? 'bg-navy-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ES
            </button>
            <button
              onClick={() => hasEnContent ? setActiveLang('en') : (!readOnly ? handleTranslate('es→en') : undefined)}
              disabled={translating}
              title={!hasEnContent && !readOnly ? 'Haz clic para traducir al inglés' : undefined}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 font-medium transition-colors disabled:opacity-60 ${
                activeLang === 'en' ? 'bg-navy-800 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {translating
                ? <><Loader2 size={10} className="animate-spin" /> EN</>
                : hasEnContent
                  ? <>EN <span className="opacity-50 text-[10px]">✓</span></>
                  : <>EN {!readOnly && <Languages size={10} className="opacity-50" />}</>
              }
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <Download size={12} /> PDF
          </button>
          <button
            onClick={() => exportToPptx(displayData, activeVersion?.label)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-700 transition-colors"
          >
            <Presentation size={12} /> PowerPoint
          </button>
        </div>
      </div>

      <div id="cv-print-area" ref={printRef} className="flex min-h-[560px]">
        {/* Left panel */}
        <div className="w-56 shrink-0 bg-navy-800 text-white p-5 flex flex-col">
          <div className="flex flex-col items-center mb-5">
            <div className="relative mb-3 group/avatar">
              <Avatar className="h-20 w-20 ring-2 ring-white/30">
                {data.photo_url ? (
                  <img src={data.photo_url} alt={data.name} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-navy-600 text-white text-xl font-bold">
                    {getInitials(data.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              {!readOnly && (
                <>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                  >
                    <Camera size={18} className="text-white" />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </>
              )}
            </div>
            <h2 className="text-base font-bold text-center leading-tight">{data.name}</h2>
            {!readOnly ? (
              <div className="mt-1 text-center">
                <select
                  value={data.role_title}
                  onChange={e => {
                    const title = e.target.value
                    const seniority = TITLE_TO_SENIORITY[title]
                    update({ role_title: title, ...(seniority ? { seniority } : {}) })
                  }}
                  className="w-full rounded bg-navy-700 border border-navy-500 px-2 py-1 text-xs text-navy-100 italic text-center outline-none focus:border-navy-300"
                >
                  {ROLE_TITLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-navy-200 mt-0.5 text-center italic">{data.role_title}</p>
            )}
            <Badge variant="secondary" className="mt-2 bg-navy-600 text-navy-100 border-navy-500 text-xs">
              {data.seniority}
            </Badge>
            {data.practice_area && (
              <p className="text-xs text-navy-300 mt-1 text-center">{data.practice_area}</p>
            )}
          </div>

          <div className="space-y-4 text-xs">
            {/* Education */}
            <div>
              <div className="flex items-center gap-1 text-navy-300 mb-1 uppercase tracking-wider" style={{ fontSize: '9px' }}>
                <GraduationCap size={10} /> Educación
              </div>
              {!readOnly ? (
                <EditableText
                  value={data.education ?? ''}
                  placeholder="Agregar educación..."
                  onSave={v => update({ education: v || null })}
                  multiline
                  className="text-white/90 text-xs leading-snug"
                  inputClassName="bg-navy-700 text-white border-navy-500 text-xs"
                />
              ) : (
                <p className="text-white/90 leading-snug">{data.education || '—'}</p>
              )}
            </div>

            {/* Languages */}
            <div>
              <div className="flex items-center gap-1 text-navy-300 mb-1 uppercase tracking-wider" style={{ fontSize: '9px' }}>
                <Globe size={10} /> Idiomas
              </div>
              {!readOnly ? (
                <EditableText
                  value={data.languages ?? ''}
                  placeholder="Ej. Español, Inglés"
                  onSave={v => update({ languages: v || null })}
                  className="text-white/90 text-xs"
                  inputClassName="bg-navy-700 text-white border-navy-500 text-xs"
                />
              ) : (
                <p className="text-white/90">{data.languages || '—'}</p>
              )}
            </div>

            {/* Experience */}
            <div>
              <div className="flex items-center gap-1 text-navy-300 mb-1 uppercase tracking-wider" style={{ fontSize: '9px' }}>
                <Briefcase size={10} /> Experiencia
              </div>
              {!readOnly ? (
                <EditableText
                  value={data.years_of_experience ? String(data.years_of_experience) : ''}
                  placeholder="Ej. 8"
                  onSave={v => update({ years_of_experience: v ? parseInt(v) || null : null })}
                  className="text-white/90 text-xs"
                  inputClassName="bg-navy-700 text-white border-navy-500 text-xs"
                />
              ) : (
                <p className="text-white/90">
                  {data.years_of_experience ? data.years_of_experience + ' años' : '—'}
                </p>
              )}
            </div>

            {/* Certifications */}
            {(data.certifications?.length > 0 || !readOnly) && (
              <div>
                <div className="flex items-center gap-1 text-navy-300 mb-1 uppercase tracking-wider" style={{ fontSize: '9px' }}>
                  <Award size={10} /> Certificaciones
                </div>
                {!readOnly ? (
                  <TagEditor
                    tags={data.certifications ?? []}
                    onUpdate={t => update({ certifications: t })}
                    placeholder="Agregar certificación..."
                  />
                ) : (
                  <p className="text-white/90">{data.certifications?.join(', ') || '—'}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Bio */}
          <Section icon={<FileText size={13} />} title="Resumen Profesional">
            {!readOnly ? (
              <EditableText
                value={displayData.bio ?? ''}
                placeholder="Escribe un resumen profesional..."
                onSave={v => update({ bio: v || null })}
                multiline
                className="text-slate-700 leading-relaxed"
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">{displayData.bio || '—'}</p>
            )}
          </Section>

          {/* Industry & service area experience from Kimble historic */}
          {/* Read from `profile` prop directly (not `data` state) so these read-only
              fields always reflect the latest enrichedProfile even if data was
              initialized before Kimble enrichment was available. */}
          {(profile.industry_experience?.length || profile.kimble_service_areas?.length) ? (
            <Section icon={<Briefcase size={13} />} title="Experiencia por Industria y Área (Kimble)">
              {profile.industry_experience?.length ? (
                <div className="mb-2">
                  <p className="text-xs text-slate-400 mb-1">Industrias</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.industry_experience.map(ind => (
                      <span key={ind} className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs text-blue-700">{ind}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {profile.kimble_service_areas?.length ? (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Áreas de Servicio</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.kimble_service_areas.map(area => (
                      <span key={area} className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs text-bip-red">{area}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </Section>
          ) : null}

          {/* Skills */}
          <Section icon={<Wrench size={13} />} title="Competencias">
            {!readOnly ? (
              <TagEditor
                tags={data.skills}
                onUpdate={t => update({ skills: t })}
                placeholder="Buscar o escribir competencia..."
                suggestions={SUGGESTED_SKILLS.flatMap(g => g.skills)}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map(s => (
                  <span key={s} className="rounded-full bg-navy-50 border border-navy-100 px-2.5 py-0.5 text-xs text-navy-700">{s}</span>
                ))}
              </div>
            )}
          </Section>

          {/* Experience */}
          <Section icon={<Briefcase size={13} />} title="Experiencia Profesional">
            {!readOnly ? (
              <ExperienceEditor
                entries={displayData.experience ?? []}
                onUpdate={exp => update({ experience: exp })}
              />
            ) : (
              <div className="space-y-2.5">
                {(displayData.experience ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Sin experiencia registrada.</p>
                ) : (
                  (displayData.experience ?? []).map(exp => (
                    <div key={exp.id} className="flex gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div className="w-1 shrink-0 rounded-full bg-navy-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-navy-800 leading-snug">{exp.title}</p>
                        {(exp.client || exp.period) && (
                          <p className="text-xs text-slate-500 mt-0.5">{[exp.client, exp.period].filter(Boolean).join(' · ')}</p>
                        )}
                        {exp.description && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
    </>
  )
}
