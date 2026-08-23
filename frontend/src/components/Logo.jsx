import React from 'react'
import { HeartHandshake } from 'lucide-react'

export default function Logo({ size = 'md' }) {
  const sizes = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-12 w-12' }
  return (
    <div className="flex items-center gap-2 select-none">
      <div className={`grid place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-500/30 ${sizes[size]}`}>
        <HeartHandshake className="h-1/2 w-1/2" strokeWidth={2.4} />
      </div>
      <span className="font-extrabold tracking-tight text-lg">Impact<span className="text-brand-600 dark:text-brand-400">Hub</span></span>
    </div>
  )
}
