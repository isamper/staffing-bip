import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Project, Position, Seniority } from '@/lib/types'

const SENIORITY_OPTIONS: Seniority[] = [
  'Intern', 'Consultant', 'Senior Consultant', 'Associate', 'Senior Associate',
  'Manager', 'Senior Manager', 'Director', 'Partner', 'Senior Partner',
]

const INDUSTRY_OPTIONS = [
  'Financial Services', 'Technology', 'Manufacturing', 'Insurance',
  'Healthcare', 'Retail', 'Automotive', 'Energy', 'Telecommunications', 'Other',
]

interface PositionDraft {
  id: string
  role: string
  seniority: Seniority
  skillsRaw: string  // comma-separated string while editing
}

interface NewProjectDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (project: Project) => void
}

function emptyPosition(): PositionDraft {
  return { id: `pos-${Date.now()}-${Math.random()}`, role: '', seniority: 'Consultant', skillsRaw: '' }
}

export default function NewProjectDialog({ open, onClose, onAdd }: NewProjectDialogProps) {
  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [positions, setPositions] = useState<PositionDraft[]>([emptyPosition()])
  const [errors, setErrors] = useState<string[]>([])

  function reset() {
    setName(''); setClient(''); setIndustry(''); setDescription('')
    setStartDate(''); setEndDate('')
    setPositions([emptyPosition()])
    setErrors([])
  }

  function handleClose() {
    reset()
    onClose()
  }

  function addPosition() {
    setPositions((prev) => [...prev, emptyPosition()])
  }

  function removePosition(id: string) {
    setPositions((prev) => prev.filter((p) => p.id !== id))
  }

  function updatePosition(id: string, field: keyof PositionDraft, value: string) {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    )
  }

  function validate(): boolean {
    const errs: string[] = []
    if (!name.trim()) errs.push('Project name is required')
    if (!client.trim()) errs.push('Client is required')
    if (!industry) errs.push('Industry is required')
    if (!startDate) errs.push('Start date is required')
    if (!endDate) errs.push('End date is required')
    if (startDate && endDate && endDate <= startDate) errs.push('End date must be after start date')
    if (positions.length === 0) errs.push('At least one position is required')
    positions.forEach((p, i) => {
      if (!p.role.trim()) errs.push(`Position ${i + 1}: role title is required`)
      if (!p.skillsRaw.trim()) errs.push(`Position ${i + 1}: at least one skill is required`)
    })
    setErrors(errs)
    return errs.length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    const builtPositions: Position[] = positions.map((p) => ({
      id: p.id,
      role: p.role.trim(),
      seniority: p.seniority,
      skills: p.skillsRaw.split(',').map((s) => s.trim()).filter(Boolean),
    }))

    const allSkills = Array.from(new Set(builtPositions.flatMap((p) => p.skills)))

    const project: Project = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      client: client.trim(),
      industry,
      description: description.trim(),
      status: 'Open',
      start_date: startDate,
      end_date: endDate,
      team_size: positions.length,
      skills_required: allSkills,
      positions: builtPositions,
      created_at: new Date().toISOString(),
    }

    onAdd(project)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-navy-800">Add New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Project Name *</Label>
              <Input placeholder="e.g. Transformación Digital" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Input placeholder="e.g. Bancolombia" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Industry *</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-1" />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-800/20 resize-none"
              rows={2}
              placeholder="Brief description of the project scope and goals"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Positions */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Positions to Fill *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPosition} className="gap-1.5 text-xs h-7">
                <Plus size={12} /> Add Position
              </Button>
            </div>
            <div className="space-y-3">
              {positions.map((pos, i) => (
                <div key={pos.id} className="rounded-md border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Position {i + 1}</p>
                    {positions.length > 1 && (
                      <button onClick={() => removePosition(pos.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Role Title *</Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="e.g. Project Lead"
                        value={pos.role}
                        onChange={(e) => updatePosition(pos.id, 'role', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Seniority *</Label>
                      <Select
                        value={pos.seniority}
                        onValueChange={(v) => updatePosition(pos.id, 'seniority', v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SENIORITY_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Label className="text-xs">Required Skills * <span className="font-normal text-slate-400">(comma-separated)</span></Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="e.g. Digital Transformation, IT Strategy, Change Management"
                      value={pos.skillsRaw}
                      onChange={(e) => updatePosition(pos.id, 'skillsRaw', e.target.value)}
                    />
                    {pos.skillsRaw && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {pos.skillsRaw.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                          <span key={s} className="rounded-full bg-navy-800/10 px-2 py-0.5 text-xs text-navy-800">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <ul className="space-y-0.5">
                {errors.map((e) => (
                  <li key={e} className="text-xs text-red-600">• {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Project</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
