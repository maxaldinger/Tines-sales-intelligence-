'use client'

import { useState, useMemo } from 'react'
import { DollarSign, Plus, Minus, ShoppingCart, Download, Sparkles, RefreshCw, Check, ArrowLeft, Trash2 } from 'lucide-react'

interface PricebookItem {
  id: string
  product_name: string
  category: string
  msrp: number
  unit: string
  notes: string
}

interface QuoteLineItem extends PricebookItem {
  quantity: number
  selected: boolean
}

const TINES_PRICEBOOK: PricebookItem[] = [
  { id: 'tp', product_name: 'Tines Platform License', category: 'Platform', msrp: 120000, unit: '/year', notes: 'Core no-code security automation engine with unlimited workflow runs' },
  { id: 'tc', product_name: 'Tines Cases', category: 'Platform', msrp: 40000, unit: '/year', notes: 'Built-in case management for security teams' },
  { id: 'tpg', product_name: 'Tines Pages', category: 'Platform', msrp: 30000, unit: '/year', notes: 'Custom forms, portals, and self-service interfaces' },
  { id: 'tai', product_name: 'AI Actions Module', category: 'AI', msrp: 50000, unit: '/year', notes: 'LLM-powered workflow steps for intelligent automation' },
  { id: 'tapi', product_name: 'API Access (Premium)', category: 'Integration', msrp: 25000, unit: '/year', notes: 'Full REST API for programmatic workflow management' },
  { id: 'ps-impl', product_name: 'Implementation Services', category: 'Services', msrp: 50000, unit: 'fixed', notes: 'Production deployment, integration, migration from legacy SOAR' },
  { id: 'ps-wf', product_name: 'Workflow Design Services', category: 'Services', msrp: 30000, unit: 'fixed', notes: 'Custom workflow design for top use cases' },
  { id: 'tr-admin', product_name: 'Training - Admin', category: 'Training', msrp: 5000, unit: '/seat', notes: 'Platform administration and operations' },
  { id: 'tr-builder', product_name: 'Training - Story Builder', category: 'Training', msrp: 4000, unit: '/seat', notes: 'Building workflows and integrations' },
  { id: 'tr-analyst', product_name: 'Training - SOC Analyst', category: 'Training', msrp: 2500, unit: '/seat', notes: 'Using Tines Cases and Pages for daily operations' },
]

const CATEGORY_ORDER = ['Platform', 'AI', 'Integration', 'Services', 'Training']

interface Props {
  dealName: string | null
}

export default function SaPricebookBuilder({ dealName }: Props) {
  const [mode, setMode] = useState<'pricebook' | 'quote'>('pricebook')
  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([])
  const [discountPct, setDiscountPct] = useState(0)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')

  const groupedItems = useMemo(() => {
    const groups: Record<string, PricebookItem[]> = {}
    for (const item of TINES_PRICEBOOK) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return CATEGORY_ORDER
      .filter(cat => groups[cat])
      .map(cat => ({ category: cat, items: groups[cat] }))
  }, [])

  const addToQuote = (item: PricebookItem) => {
    const exists = quoteItems.find(qi => qi.id === item.id)
    if (exists) {
      setQuoteItems(prev =>
        prev.map(qi => qi.id === item.id ? { ...qi, quantity: qi.quantity + 1 } : qi)
      )
    } else {
      setQuoteItems(prev => [...prev, { ...item, quantity: 1, selected: true }])
    }
    setMode('quote')
  }

  const removeFromQuote = (id: string) => {
    setQuoteItems(prev => prev.filter(qi => qi.id !== id))
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return
    setQuoteItems(prev =>
      prev.map(qi => qi.id === id ? { ...qi, quantity: qty } : qi)
    )
  }

  const toggleSelected = (id: string) => {
    setQuoteItems(prev =>
      prev.map(qi => qi.id === id ? { ...qi, selected: !qi.selected } : qi)
    )
  }

  const selectedItems = quoteItems.filter(qi => qi.selected)
  const subtotal = selectedItems.reduce((sum, qi) => sum + qi.msrp * qi.quantity, 0)
  const discount = subtotal * (discountPct / 100)
  const total = subtotal - discount

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val)

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'Platform': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'AI': return 'text-tines bg-tines/10 border-tines/15'
      case 'Integration': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'Services': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'Training': return 'text-pink-400 bg-pink-500/10 border-pink-500/20'
      default: return 'text-tines-muted bg-surface-raised border-surface-border'
    }
  }

  const generateSummary = async () => {
    if (selectedItems.length === 0) return
    setLoading(true)
    setError('')
    setSummary('')
    try {
      const r = await fetch('/api/sa-pricebook-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems: selectedItems.map(qi => ({
            product_name: qi.product_name,
            category: qi.category,
            msrp: qi.msrp,
            unit: qi.unit,
            quantity: qi.quantity,
            line_total: qi.msrp * qi.quantity,
          })),
          dealName,
          discountPct,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to generate summary')
      setSummary(d.summary)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Product', 'Category', 'MSRP', 'Unit', 'Qty', 'Line Total']
    const csvRows = selectedItems.map(qi =>
      [qi.product_name, qi.category, qi.msrp, qi.unit, qi.quantity, qi.msrp * qi.quantity]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    csvRows.push(`"","","","","Subtotal","${subtotal}"`)
    if (discountPct > 0) {
      csvRows.push(`"","","","","Discount (${discountPct}%)","${-discount}"`)
    }
    csvRows.push(`"","","","","Total","${total}"`)
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Quote-${dealName || 'draft'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Pricebook & Quote Builder</h2>
        <p className="text-sm text-tines-muted">
          Browse the Tines product catalog and build a quote with discounts.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-raised border border-surface-border w-fit">
        <button
          onClick={() => setMode('pricebook')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'pricebook'
              ? 'bg-white/10 text-white'
              : 'text-tines-muted hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 inline mr-1.5" />
          Pricebook
        </button>
        <button
          onClick={() => setMode('quote')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            mode === 'quote'
              ? 'bg-white/10 text-white'
              : 'text-tines-muted hover:text-white'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 inline mr-1.5" />
          Quote
          {quoteItems.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-tines text-[10px] text-white flex items-center justify-center">
              {quoteItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Pricebook mode */}
      {mode === 'pricebook' && (
        <div className="space-y-6">
          {groupedItems.map(group => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColor(group.category)}`}>
                  {group.category}
                </span>
              </div>
              <div className="rounded-xl border border-surface-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-raised">
                      <th className="text-left px-4 py-2.5 text-tines-muted font-medium">Product</th>
                      <th className="text-right px-4 py-2.5 text-tines-muted font-medium">MSRP</th>
                      <th className="text-left px-4 py-2.5 text-tines-muted font-medium">Unit</th>
                      <th className="text-left px-4 py-2.5 text-tines-muted font-medium">Notes</th>
                      <th className="text-center px-4 py-2.5 text-tines-muted font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {group.items.map(item => (
                      <tr key={item.id} className="hover:bg-surface-raised transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{item.product_name}</td>
                        <td className="px-4 py-3 text-[#C8C0E0] text-right font-mono">{formatCurrency(item.msrp)}</td>
                        <td className="px-4 py-3 text-tines-muted">{item.unit}</td>
                        <td className="px-4 py-3 text-tines-dim text-xs">{item.notes}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => addToQuote(item)}
                            className="p-1.5 rounded-lg bg-tines/10 text-tines hover:bg-tines/15 transition-colors"
                            title="Add to quote"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote mode */}
      {mode === 'quote' && (
        <div className="space-y-5">
          {quoteItems.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface-raised border border-surface-border text-center">
              <ShoppingCart className="w-8 h-8 text-tines-dim mx-auto mb-3" />
              <p className="text-sm text-tines-dim">No items in quote yet.</p>
              <button
                onClick={() => setMode('pricebook')}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-raised border border-surface-border text-[#C8C0E0] text-sm hover:bg-tines/5 transition-colors mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Browse Pricebook
              </button>
            </div>
          ) : (
            <>
              {/* Line items */}
              <div className="rounded-xl border border-surface-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-raised">
                      <th className="text-center px-3 py-2.5 w-10">
                        <input
                          type="checkbox"
                          checked={quoteItems.every(qi => qi.selected)}
                          onChange={e => setQuoteItems(prev => prev.map(qi => ({ ...qi, selected: e.target.checked })))}
                          className="rounded border-tines/15 bg-surface-raised text-tines focus:ring-tines/15"
                        />
                      </th>
                      <th className="text-left px-4 py-2.5 text-tines-muted font-medium">Product</th>
                      <th className="text-left px-4 py-2.5 text-tines-muted font-medium w-20">Category</th>
                      <th className="text-right px-4 py-2.5 text-tines-muted font-medium w-28">MSRP</th>
                      <th className="text-center px-4 py-2.5 text-tines-muted font-medium w-28">Qty</th>
                      <th className="text-right px-4 py-2.5 text-tines-muted font-medium w-28">Line Total</th>
                      <th className="text-center px-3 py-2.5 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {quoteItems.map(qi => (
                      <tr
                        key={qi.id}
                        className={`transition-colors ${qi.selected ? 'hover:bg-surface-raised' : 'opacity-40'}`}
                      >
                        <td className="text-center px-3 py-3">
                          <input
                            type="checkbox"
                            checked={qi.selected}
                            onChange={() => toggleSelected(qi.id)}
                            className="rounded border-tines/15 bg-surface-raised text-tines focus:ring-tines/15"
                          />
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{qi.product_name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${categoryColor(qi.category)}`}>
                            {qi.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#C8C0E0] text-right font-mono">{formatCurrency(qi.msrp)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => updateQuantity(qi.id, qi.quantity - 1)}
                              className="p-1 rounded hover:bg-tines/5 text-tines-muted"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              value={qi.quantity}
                              onChange={e => updateQuantity(qi.id, parseInt(e.target.value) || 1)}
                              className="w-12 text-center px-1 py-1 rounded-lg bg-surface-raised border border-surface-border text-white text-sm focus:outline-none focus:border-tines/40"
                              min={1}
                            />
                            <button
                              onClick={() => updateQuantity(qi.id, qi.quantity + 1)}
                              className="p-1 rounded hover:bg-tines/5 text-tines-muted"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white text-right font-mono font-medium">
                          {formatCurrency(qi.msrp * qi.quantity)}
                        </td>
                        <td className="text-center px-3 py-3">
                          <button
                            onClick={() => removeFromQuote(qi.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-tines-dim hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="p-5 rounded-xl bg-surface-raised border border-surface-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-tines-muted">Subtotal</span>
                  <span className="text-white font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-tines-muted">Discount</span>
                    <input
                      type="number"
                      value={discountPct}
                      onChange={e => setDiscountPct(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-16 text-center px-2 py-1 rounded-lg bg-surface-raised border border-surface-border text-white text-sm focus:outline-none focus:border-tines/40"
                      min={0}
                      max={100}
                    />
                    <span className="text-tines-dim">%</span>
                  </div>
                  <span className="text-red-400 font-mono">-{formatCurrency(discount)}</span>
                </div>
                <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-xl font-bold text-tines font-mono">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={generateSummary}
                  disabled={loading || selectedItems.length === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-tines to-tines-light text-white font-medium text-sm hover:from-tines-hover hover:to-tines transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Summary
                    </>
                  )}
                </button>
                <button
                  onClick={exportCSV}
                  disabled={selectedItems.length === 0}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-surface-raised border border-surface-border text-[#C8C0E0] text-sm hover:bg-tines/5 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
              )}

              {/* AI Summary */}
              {summary && (
                <div className="p-5 rounded-xl bg-surface-raised border border-surface-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-tines" />
                    <h3 className="text-sm font-semibold text-white">Quote Summary</h3>
                  </div>
                  <div className="text-sm text-[#C8C0E0] leading-relaxed whitespace-pre-wrap">{summary}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
