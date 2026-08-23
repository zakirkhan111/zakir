import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Compass, FolderKanban, Users, Trophy, LogOut,
  Sun, Moon, Menu, X, ShieldCheck, ClipboardList, User as UserIcon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import { imageUrl } from '../utils/imageUrl'
import Footer from './Footer'

const navByRole = {
  student: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover Projects', icon: Compass },
    { to: '/my-projects', label: 'Joined Projects', icon: FolderKanban },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ],
  project_manager: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/manager/projects', label: 'My Projects', icon: FolderKanban },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ],
  admin: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/projects', label: 'Projects', icon: ClipboardList },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ],
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  const items = navByRole[user?.role] || navByRole.student
  const roleLabel = { student: 'Student / Volunteer', project_manager: 'Project Manager', admin: 'Administrator' }[user?.role] || ''
  const profilePicture = imageUrl(user?.profilePicture).trim()

  useEffect(() => {
    setAvatarError(false)
  }, [profilePicture])

  const NavItems = () => (
    <nav className="flex-1 flex flex-col gap-1 px-3">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          <Icon className="h-4.5 w-4.5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 py-6 bg-white dark:bg-gray-900 sticky top-0 h-screen">
        <div className="px-5 mb-8"><Logo /></div>
        <NavItems />
        <div className="px-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
          <NavLink to="/profile" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            <UserIcon className="h-4.5 w-4.5" /> Profile
          </NavLink>
          <button onClick={() => { logout(); navigate('/login') }} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
            <LogOut className="h-4.5 w-4.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 py-6 flex flex-col shadow-2xl">
            <div className="px-5 mb-8 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <NavItems />
            <div className="px-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => { logout(); navigate('/login') }} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                <LogOut className="h-4.5 w-4.5" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button className="lg:hidden btn-ghost !p-2" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
            <div className="lg:hidden"><Logo size="sm" /></div>
            <div className="hidden lg:block">
              <p className="text-sm font-bold">Hi {user?.name?.split(' ')[0]} 👋</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                {user?.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                {roleLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost !p-2.5 rounded-full" title="Toggle theme">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <NotificationBell />
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="h-9 w-9 rounded-full ring-2 ring-brand-500/30 overflow-hidden grid place-items-center bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
              aria-label="Open profile"
            >
              {profilePicture && !avatarError ? (
                <img
                  src={profilePicture}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarError(true)}
                  alt={`${user?.name || 'User'}'s avatar`}
                />
              ) : <UserIcon className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
