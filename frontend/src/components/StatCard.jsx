import React from 'react'

export default function StatCard({ icon: Icon, label, value, accent = 'brand', suffix = '' }) {
  const accents = {
    brand: 'from-brand-400 to-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40',
    blue: 'from-blue-400 to-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
    amber: 'from-amber-400 to-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    pink: 'from-pink-400 to-pink-600 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40',
    purple: 'from-purple-400 to-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40',
  }
  return (
    <div className="card p-5 flex items-center justify-between hover:shadow-lg transition-shadow">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-2xl font-extrabold mt-1">{value}{suffix}</p>
      </div>
      {Icon && (
        <div className={`h-12 w-12 rounded-2xl grid place-items-center ${accents[accent].split(' ').slice(2).join(' ')}`}>
          <Icon className={`h-6 w-6 ${accents[accent].split(' ')[2] || ''}`} />
        </div>
      )}
    </div>
  )
}
