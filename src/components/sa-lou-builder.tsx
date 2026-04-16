'use client'

import { useState } from 'react'
import { FileText, Sparkles, RefreshCw, Plus, Trash2, Pencil, Check, X, Download } from 'lucide-react'
import FollowUpChat from './sa-follow-up-chat'
import SaDealPicker from './sa-deal-picker'

interface LouRow {
  id: string
  issue: string
  response: string
  category: string
  priority: string
  timeframe: string
}

const CATEGORIES = ['', 'Security Automation', 'Alert Triage', 'Incident Response', 'Compliance & Governance', 'Tool Consolidation']
const PRIORITIES = ['', 'High', 'Medium', 'Low']
const TIMEFRAMES = ['', 'Q1', 'Q2', 'Q3', 'Q4']

interface Props {
  dealName: string | null
}

export default function SaLouBuilder({ dealName: initialDealName }: Props) {
  const [mode, setMode] = useState<'input' | 'table'>('input')
  const [transcript, setTranscript] = useState('')
  const [dealName, setDealName] = useState<string | null>(initialDealName ?? null)
  const [rows, setRows] = useState<LouRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<LouRow | null>(null)

  const generate = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/sa-lou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, dealName }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to generate LOU')
      setRows(
        (d.rows || []).map((row: any, i: number) => ({
          id: row.id || `row-${i}`,
          issue: row.issue || '',
          response: row.response || '',
          category: row.category || '',
          priority: row.priority || '',
          timeframe: row.timeframe || '',
        }))
      )
      setMode('table')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const addRow = () => {
    const newRow: LouRow = {
      id: `row-${Date.now()}`,
      issue: '',
      response: '',
      category: '',
      priority: '',
      timeframe: '',
    }
    setRows(prev => [...prev, newRow])
    setEditingId(newRow.id)
    setEditDraft(newRow)
  }

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setEditDraft(null)
    }
  }

  const startEdit = (row: LouRow) => {
    setEditingId(row.id)
    setEditDraft({ ...row })
  }

  const saveEdit = () => {
    if (!editDraft) return
    setRows(prev => prev.map(r => (r.id === editDraft.id ? editDraft : r)))
    setEditingId(null)
    setEditDraft(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(null)
  }

  const exportCSV = () => {
    const headers = ['Critical Business Issue', 'Can we help? If so, how?', 'Category', 'Priority', 'Timeframe']
    const csvRows = rows.map(r =>
      [r.issue, r.response, r.category, r.priority, r.timeframe]
        .map(v => `"${(v || '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LOU-${dealName || 'draft'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'text-red-400'
      case 'Medium': return 'text-yellow-400'
      case 'Low': return 'text-emerald-400'
      default: return 'text-tines-dim'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Letter of Understanding Builder</h2>
        <p className="text-sm text-tines-muted">
          Paste meeting notes or a transcript to generate a structured LOU table you can edit and export.
        </p>
      </div>

      {mode === 'input' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <SaDealPicker
              label={dealName ? `Change account (${dealName})` : 'Pull from Signal Feed'}
              onPick={(seed, name) => { setTranscript(seed); setDealName(name) }}
            />
            {dealName && (
              <span className="text-xs text-tines-muted">Seeded from <span className="text-tines">{dealName}</span></span>
            )}
          </div>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder="Paste meeting notes, call transcript, or key discussion points — or pull from Signal Feed above..."
            rows={12}
            className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-surface-border text-white placeholder-tines-dim focus:outline-none focus:border-tines/40 text-sm resize-none leading-relaxed"
          />
          <button
            onClick={generate}
            disabled={loading || !transcript.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-tines text-white font-medium text-sm hover:bg-tines-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating LOU...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate LOU
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
      )}

      {mode === 'table' && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('input')}
              className="px-4 py-2 rounded-xl bg-surface-raised border border-surface-border text-[#C8C0E0] text-sm hover:bg-tines/5 transition-colors"
            >
              Edit Notes
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-raised border border-surface-border text-[#C8C0E0] text-sm hover:bg-tines/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Issue
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tines/10 border border-tines/15 text-tines text-sm hover:bg-tines/15 transition-colors ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-surface-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-raised">
                    <th className="text-left px-4 py-3 text-tines-muted font-medium w-[28%]">Critical Business Issue</th>
                    <th className="text-left px-4 py-3 text-tines-muted font-medium w-[28%]">Can we help? If so, how?</th>
                    <th className="text-left px-4 py-3 text-tines-muted font-medium w-[14%]">Category</th>
                    <th className="text-left px-4 py-3 text-tines-muted font-medium w-[10%]">Priority</th>
                    <th className="text-left px-4 py-3 text-tines-muted font-medium w-[10%]">Timeframe</th>
                    <th className="text-center px-4 py-3 text-tines-muted font-medium w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map(row => (
                    <tr key={row.id} className="hover:bg-surface-raised transition-colors">
                      {editingId === row.id && editDraft ? (
                        <>
                          <td className="px-3 py-2">
                            <textarea
                              value={editDraft.issue}
                              onChange={e => setEditDraft({ ...editDraft, issue: e.target.value })}
                              rows={2}
                              className="w-full px-2 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-white text-xs resize-none focus:outline-none focus:border-tines/40"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <textarea
                              value={editDraft.response}
                              onChange={e => setEditDraft({ ...editDraft, response: e.target.value })}
                              rows={2}
                              className="w-full px-2 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-white text-xs resize-none focus:outline-none focus:border-tines/40"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={editDraft.category}
                              onChange={e => setEditDraft({ ...editDraft, category: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-white text-xs focus:outline-none focus:border-tines/40"
                            >
                              {CATEGORIES.map(c => (
                                <option key={c} value={c} className="bg-[#0D1117]">
                                  {c || 'Select...'}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={editDraft.priority}
                              onChange={e => setEditDraft({ ...editDraft, priority: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-white text-xs focus:outline-none focus:border-tines/40"
                            >
                              {PRIORITIES.map(p => (
                                <option key={p} value={p} className="bg-[#0D1117]">
                                  {p || 'Select...'}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={editDraft.timeframe}
                              onChange={e => setEditDraft({ ...editDraft, timeframe: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-white text-xs focus:outline-none focus:border-tines/40"
                            >
                              {TIMEFRAMES.map(t => (
                                <option key={t} value={t} className="bg-[#0D1117]">
                                  {t || 'Select...'}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-[#C8C0E0]">{row.issue}</td>
                          <td className="px-4 py-3 text-[#C8C0E0]">{row.response}</td>
                          <td className="px-4 py-3 text-tines-muted">{row.category}</td>
                          <td className={`px-4 py-3 font-medium ${priorityColor(row.priority)}`}>{row.priority}</td>
                          <td className="px-4 py-3 text-tines-muted">{row.timeframe}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => startEdit(row)} className="p-1.5 rounded-lg hover:bg-tines/5 text-tines-muted hover:text-white transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => removeRow(row.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-tines-muted hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-tines-dim text-sm">
                        No issues yet. Click "Add Issue" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Follow-up chat */}
          <FollowUpChat
            context={JSON.stringify(rows)}
            tool="lou"
            dealName={dealName}
          />
        </div>
      )}
    </div>
  )
}
