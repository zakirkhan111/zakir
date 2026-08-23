import React, { useEffect, useRef, useState } from 'react'
import { Sparkles, ChevronDown, X } from 'lucide-react'

export const SKILL_PRESETS = [
  'Web Development', 'Design', 'Marketing', 'Teamwork', 'Event Management',
  'Communication', 'Social Work', 'Logistics',
]

/**
 * Premium hybrid multi-select "combobox" for skills.
 * - Click a preset to append it as a color-coded dismissible chip.
 * - Type a custom skill and press Enter or comma (,) to convert it into a chip too.
 * - Selected chips render below the trigger; clicking a chip's X removes it.
 */
export default function SkillsSelector({ value = [], onChange, placeholder = 'Choose or type your skills' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const addSkill = (raw) => {
    const skill = raw.trim().replace(/,+$/, '')
    if (!skill) return
    const exists = value.some((s) => s.toLowerCase() === skill.toLowerCase())
    if (!exists) onChange([...value, skill])
    setQuery('')
  }

  const toggleSkill = (skill) => {
    const exists = value.some((s) => s.toLowerCase() === skill.toLowerCase())
    onChange(exists ? value.filter((s) => s.toLowerCase() !== skill.toLowerCase()) : [...value, skill])
  }

  const removeSkill = (skill) => onChange(value.filter((s) => s !== skill))

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(query)
    } else if (e.key === 'Backspace' && !query && value.length) {
      removeSkill(value[value.length - 1])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((isOpen) => !isOpen); setTimeout(() => inputRef.current?.focus(), 0) }}
        aria-expanded={open}
        className="input flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm text-gray-500">
          <Sparkles className="h-4 w-4 text-gray-400 shrink-0" />
          {value.length ? `${value.length} skill${value.length > 1 ? 's' : ''} selected` : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="relative block mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="relative mb-3">
            <input
              ref={inputRef}
              className="input pr-20"
              placeholder="Type a custom skill, press Enter or , to add"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              type="button"
              onClick={() => addSkill(query)}
              disabled={!query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-950/40"
            >
              + Add
            </button>
          </div>
          {!query.trim() && (
            <div className="flex flex-wrap gap-2">
              {SKILL_PRESETS.map((skill) => {
              const active = value.some((s) => s.toLowerCase() === skill.toLowerCase())
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-brand-50 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {skill}
                </button>
              )
              })}
            </div>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
            >
              {skill}
              <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-600" title={`Remove ${skill}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
