import { useRef, useState } from 'react'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { parseKimbleExcel, type KimbleImportResult } from '@/lib/kimbleParser'
import { COLOMBIAN_WORK_DAYS_2026 } from '@/lib/colombianHolidays'
import type { Profile } from '@/lib/types'

interface KimbleImportModalProps {
  open: boolean
  onClose: () => void
  consultants: Profile[]
  onConfirm: (result: KimbleImportResult) => void
}

export default function KimbleImportModal({
  open,
  onClose,
  consultants,
  onConfirm,
}: KimbleImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<KimbleImportResult | null>(null)

  function reset() {
    setResult(null)
    setError(null)
    setParsing(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleFile(file: File) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please select an Excel file (.xlsx or .xls)')
      return
    }
    setParsing(true)
    setError(null)
    setResult(null)
    try {
      const knownNames = consultants.map((c) => c.name)
      const parsed = await parseKimbleExcel(file, knownNames)
      setResult(parsed)
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setParsing(false)
    }
  }

  function handleConfirm() {
    if (!result) return
    onConfirm(result)
    handleClose()
  }

  // Summary stats
  const matchedCount = result
    ? result.rawAssignments.filter((a) =>
        consultants.some((c) => c.name.toLowerCase() === a.consultantName.toLowerCase()),
      ).length
    : 0

  const topDedicated = result
    ? Object.entries(result.consultantDedications)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet size={18} className="text-navy-800" />
            <h2 className="font-semibold text-navy-800">Import Kimble Data</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Drop zone */}
          {!result && !parsing && (
            <div
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-10 cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors"
            >
              <Upload size={28} className="text-slate-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">Click to select Kimble Excel file</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  .xlsx export from Kimble · P1+P2 filter
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>
          )}

          {/* Parsing spinner */}
          {parsing && (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
              <Loader2 size={28} className="animate-spin text-navy-600" />
              <p className="text-sm">Parsing file with Colombian working days…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Parse result preview */}
          {result && (
            <div className="space-y-3">
              {/* File info */}
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <FileSpreadsheet size={14} className="text-slate-400" />
                <span className="text-xs text-slate-600 font-medium truncate">{result.fileName}</span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Projects', value: result.projects.length },
                  { label: 'Assignments', value: result.rawAssignments.length },
                  { label: 'Consultants', value: Object.keys(result.consultantDedications).length },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-slate-100 bg-white p-3 text-center">
                    <p className="text-lg font-bold text-navy-800">{value}</p>
                    <p className="text-xs text-slate-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Denominator note */}
              <div className="rounded-lg bg-navy-50 border border-navy-100 px-3 py-2">
                <p className="text-xs text-navy-700">
                  Annual dedication uses <span className="font-semibold">{COLOMBIAN_WORK_DAYS_2026} Colombian working days</span> as denominator (weekends + public holidays excluded).
                </p>
              </div>

              {/* Top dedicated consultants */}
              {topDedicated.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Top annual dedication</p>
                  <div className="space-y-1">
                    {topDedicated.map(([name, pct]) => (
                      <div key={name} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-slate-700 truncate">{name}</span>
                            <span className="text-xs font-semibold text-navy-800 ml-2">{pct}%</span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${pct > 80 ? 'bg-bip-red' : 'bg-navy-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmatched names warning */}
              {result.unmatchedNames.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle size={13} className="text-amber-600" />
                    <p className="text-xs font-medium text-amber-700">
                      {result.unmatchedNames.length} name(s) not found in the system
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result.unmatchedNames.map((n) => (
                      <span key={n} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                        {n}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-amber-600">
                    Their projects will be imported but assignments won't be linked until profiles are created.
                  </p>
                </div>
              )}

              {/* Match confirmation */}
              <div className="flex items-center gap-1.5 text-xs text-green-700">
                <CheckCircle size={13} />
                <span>{matchedCount} assignments matched to existing consultant profiles</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 bg-slate-50">
          {result ? (
            <>
              <button
                onClick={reset}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Choose different file
              </button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-navy-800 hover:bg-navy-700 text-white"
                  onClick={handleConfirm}
                >
                  Apply Import
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleClose} className="ml-auto">
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
