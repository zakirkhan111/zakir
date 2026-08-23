import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Leaf, Users } from 'lucide-react'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-gray-200 bg-white px-6 py-10 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto grid max-w-[1600px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3"><Logo /><p className="max-w-xs text-sm text-gray-500">Turning community effort into measurable, lasting impact.</p></div>
        <div><h2 className="font-bold">Quick Links</h2><div className="mt-3 grid gap-2 text-sm text-gray-500"><Link to="/">Dashboard</Link><Link to="/discover">Discover</Link><Link to="/leaderboard">Leaderboard</Link><Link to="/profile">Profile</Link></div></div>
        <div><h2 className="font-bold">Information</h2><div className="mt-3 grid gap-2 text-sm text-gray-500"><Link to="/about">About Us</Link><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms of Service</Link></div></div>
        <div><h2 className="font-bold">Live Impact Analytics</h2><div className="mt-3 space-y-2 text-sm text-gray-500"><p className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-600" /> Volunteer participation</p><p className="flex items-center gap-2"><Leaf className="h-4 w-4 text-brand-600" /> Community campaigns</p><p className="flex items-center gap-2"><Heart className="h-4 w-4 text-brand-600" /> Measurable local impact</p></div></div>
      </div>
      <p className="mx-auto mt-8 max-w-[1600px] text-xs text-gray-400">© {new Date().getFullYear()} ImpactHub. Community impact, made visible.</p>
    </footer>
  )
}
