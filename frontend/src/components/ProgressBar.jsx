import React from 'react'

export default function ProgressBar({ value = 0, label, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    pink: 'bg-pink-500',
  }
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span className="text-gray-500 dark:text-gray-400">{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${colors[color]} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
