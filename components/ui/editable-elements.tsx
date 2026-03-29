'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Check, X, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Editable Title ───────────────────────────────────────────────────────────

export function EditableTitle({
  value,
  onSave,
  className,
}: {
  value: string
  onSave: (v: string) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = () => {
    const trimmed = draft.trim()
    if (trimmed) onSave(trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 inline-flex">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="bg-muted border border-primary/50 rounded px-2 py-0.5 text-sm font-semibold outline-none w-40"
        />
        <button onClick={save} className="text-emerald-400 hover:text-emerald-300 transition-colors">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true) }}
      className={cn('group flex items-center gap-1.5 hover:text-foreground transition-colors text-left', className)}
    >
      <span className="font-semibold">{value}</span>
      <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
    </button>
  )
}

// ─── Card Stock Picker ───────────────────────────────────────────────────────

export function CardStockPicker({
  value,
  onSave,
  className,
  placeholder = "Select stock..."
}: {
  value: string
  onSave: (symbol: string, name: string) => void
  className?: string
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [searchQ, setSearchQ] = useState(value)
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/markets/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch { 
      setResults([])
    } finally { 
      setSearching(false) 
    }
  }, [])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      setSearchQ(value)
      if (value) doSearch(value)
    }
  }, [editing, doSearch, value])

  const onType = (q: string) => {
    setSearchQ(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(q), 400)
  }

  return (
    <div className="relative inline-block">
      {editing ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 relative z-50">
            <input
              ref={inputRef}
              value={searchQ}
              onChange={e => onType(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="bg-muted border border-primary/50 rounded px-2 py-1 text-xs font-bold outline-none w-32 pr-8"
              placeholder="Symbol..."
            />
            {searching && <RefreshCw className="absolute right-8 w-3 h-3 animate-spin text-muted-foreground" />}
            <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
          
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-2xl z-[101] max-h-52 overflow-hidden flex flex-col"
              >
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  {results.map(r => (
                    <button
                      key={r.symbol}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        onSave(r.symbol, r.name || r.symbol)
                        setEditing(false)
                        setIsFocused(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-[11px] flex flex-col border-b border-border/50 last:border-0 group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{r.symbol}</span>
                        {r.exchange && <span className="text-[8px] bg-muted px-1 rounded opacity-60">{r.exchange}</span>}
                      </div>
                      <span className="text-muted-foreground truncate opacity-80">{r.name}</span>
                    </button>
                  ))}
                  
                  {results.length === 0 && !searching && searchQ.length > 0 && (
                    <div className="p-4 text-center text-[10px] text-muted-foreground flex flex-col items-center gap-2">
                      <AlertCircle className="w-4 h-4 opacity-20" />
                      No matches found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={cn('group flex items-center gap-1.5 hover:text-foreground transition-colors text-left', className)}
        >
          <span className="font-bold truncate max-w-[150px]">{value || placeholder}</span>
          <Edit2 className="w-3 h-3 opacity-40 group-hover:opacity-100 shrink-0" />
        </button>
      )}
    </div>
  )
}
