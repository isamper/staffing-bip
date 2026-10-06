import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Project, Position, Seniority } from '@/lib/types'

const SENIORITY_OPTIONS: Seniority[] = [
  'Intern', 'Consultant', 'Senior Consultant', 'Associate', 'Senior Associate',
  'Manager', 'Senior Manager', 'Director', 'Partner', 'Senior Partner',
]

const INDUSTRY_OPTIONS = [
  'Banking & Finance', 'Energy & Utilities', 'Government & Public Sector',
  'Healthcare', 'Manufacturing', 'Retail & Consumer', 'Technology',
  'Telecommunications', 'Other',
]

const SERVICE_AREA_OPTIONS = [
  'Strategy & Innovation', 'Digital Transformation', 'Finance & Performance',
  'Supply Chain', 'People & Change', 'Technology', 'Risk & Compliance', 'Other',
]

interface RoleRow {
  id: string
  seniority: Seniority
  headcount: number
}

function positionsToRoles(positions: Position[]): RoleRow[] {
  const groups = new Map<string, number>()
  for (const pos of positions) {
    groups.set(pos.seniority, (groups.get(pos.seniority) ?? 0) + 1)
  }
  return Array.from(groups.entries()).map(([seniority, headcount], i) => ({
    id: `r${i}`,
    seniority: seniority as Seniority,
    headcount,
  }))
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (project: Project) => void
  initialProject?: Project
}

export default function NewManualProjectDialog({ open, onClose, onSave, initialProject }: Props) {
  const isEdit = !!initialProject
  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [industry, setIndustry] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [roles, setRoles] = useState<RoleRow[]>([
    { id: 'r1', seniority: 'Consultant', headcount: 1 },
  ])

  // Populate form when opening in edit mode
  useEffect(() => {
    if (open && initialProject) {
      setName(initialProject.name)
      setClient(initialProject.client || '')
      setIndustry(initialProject.industry || '')
      setServiceArea(initialProject.service_area || '')
      setDescription(initialProject.description || '')
      setStartDate(initialProject.start_date || '')
      setEndDate(initialProject.end_date || '')
      setRoles(
        initialProject.positions && initialProject.positions.length > 0
          ? positionsToRoles(initialProject.positions)
          : [{ id: 'r1', seniority: 'Consultant', headcount: 1 }]
      )
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function addRole() {
    setRoles((prev) => [...prev, { id: `r${Date.now()}`, seniority: 'Consultant', headcount: 1 }])
  }

  function removeRole(id: string) {
    setRoles((prev) => prev.filter((r) => r.id !== id))
  }

  function updateRole(id: string, field: 'seniority' | 'headcount', value: string | number) {
    setRoles((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }

  function handleSave() {
    if (!name.trim() || !startDate || !endDate) return

    const positions: Position[] = roles.flatMap((r) =>
      Array.from({ length: r.headcount }, (_, i) => ({
        id: `pos-${r.id}-${i}`,
        role: r.seniority,
        seniority: r.seniority,
        skills: [],
      }))
    )

    const project: Project = {
      id: initialProject?.id ?? `manual-proj-${Date.now()}`,
      name: name.trim(),
      client: client.trim(),
      industry: industry || 'Other',
      description: description.trim(),
      status: 'Open',
      start_date: startDate,
      end_date: endDate,
      team_size: roles.reduce((sum, r) => sum + r.headcount, 0),
      skills_required: [],
      positions,
      created_at: new Date().toISOString(),
      service_area: serviceArea || undefined,
      is_manual: true,
    }

    onSave(project)
    resetForm()
    onClose()
  }

  function resetForm() {
    setName(''); setClient(''); setIndustry(''); setServiceArea('')
    setDescription(''); setStartDate(''); setEndDate('')
    setRoles([{ id: 'r1', seniority: 'Consultant', headcount: 1 }])
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  const totalHeadcount = roles.reduce((sum, r) => sum + r.headcount, 0)
  const isValid = name.trim() && startDate && endDate && roles.length > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-navy-800 mb-4">
          {isEdit ? 'Editar Proyecto Pipeline' : 'Nuevo Proyecto Pipeline'}
        </h2>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-slate-500 uppercase tracking-wide">Nombre del proyecto *</Label>
            <Input
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Transformación Digital Bancolombia"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Cliente</Label>
              <Input
                className="mt-1"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Industria</Label>
              <select
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {INDUSTRY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500 uppercase tracking-wide">Área de servicio</Label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {SERVICE_AREA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <Label className="text-xs text-slate-500 uppercase tracking-wide">Descripción</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[60px] resize-none outline-none focus:ring-1 focus:ring-navy-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del proyecto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Fecha de inicio *</Label>
              <Input className="mt-1" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Fecha de fin *</Label>
              <Input className="mt-1" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Roles requeridos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Roles requeridos</Label>
              <button
                onClick={addRole}
                className="inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 font-medium"
              >
                <Plus size={12} /> Agregar rol
              </button>
            </div>
            <div className="space-y-2">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <select
                    className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white"
                    value={r.seniority}
                    onChange={(e) => updateRole(r.id, 'seniority', e.target.value as Seniority)}
                  >
                    {SENIORITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="text-xs text-slate-400 shrink-0">×</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="w-14 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-center outline-none focus:ring-1 focus:ring-navy-400"
                    value={r.headcount}
                    onChange={(e) =>
                      updateRole(r.id, 'headcount', Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                  {roles.length > 1 && (
                    <button
                      onClick={() => removeRole(r.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Total: <span className="font-medium text-slate-600">{totalHeadcount}</span> persona{totalHeadcount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button size="sm" disabled={!isValid} onClick={handleSave}>
            {isEdit ? 'Guardar cambios' : 'Crear proyecto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
