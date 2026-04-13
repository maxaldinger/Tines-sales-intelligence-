'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
  shortLabel: string
  description: string
}

interface Props {
  value: string
  options: Option[]
  onChange: (value: string) => void
  label: string
}

export default function DescriptionSelect({ value, options, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <span className="block text-[10px] uppercase tracking-wider text-tines-dim mb-1">
        {label}
      </span>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-border bg-transparent
                   text-sm text-tines-muted hover:border-tines/15 transition-colors cursor-pointer"
      >
        <span>{selected?.shortLabel ?? value}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-72 rounded-xl border border-surface-border bg-surface-overlay
                     shadow-lg shadow-black/40 overflow-hidden"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-3 transition-colors cursor-pointer
                  ${isSelected ? 'bg-tines/10' : 'hover:bg-tines/5'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isSelected ? 'text-tines' : 'text-[#C8C0E0]'}`}>
                    {opt.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-tines" />}
                </div>
                <p className="text-xs text-tines-dim mt-0.5 leading-relaxed">
                  {opt.description}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
