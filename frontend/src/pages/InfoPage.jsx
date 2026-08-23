import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'

const content = {
  '/about': { title: 'About ImpactHub', text: 'ImpactHub connects volunteers, project leaders, and communities around causes that matter. We help teams coordinate action and show the impact they create.' },
  '/privacy': { title: 'Privacy Policy', text: 'We use account and project data only to deliver the platform experience, manage participation, and keep the community safe. We do not sell personal information.' },
  '/terms': { title: 'Terms of Service', text: 'Use ImpactHub respectfully, provide accurate project information, and comply with applicable community standards. Project managers remain responsible for their campaigns.' },
}

export default function InfoPage() {
  const page = content[useLocation().pathname] || content['/about']
  return <main className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950"><div className="mx-auto max-w-2xl space-y-8"><Logo /><article className="card p-8 sm:p-10"><h1 className="text-3xl font-extrabold">{page.title}</h1><p className="mt-5 leading-8 text-gray-600 dark:text-gray-300">{page.text}</p><Link className="btn-primary mt-8 inline-flex" to="/">Back to ImpactHub</Link></article></div></main>
}
