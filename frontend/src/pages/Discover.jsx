import React, { useEffect, useState, useCallback, useRef } from 'react'
import Layout from '../components/Layout'
import ProjectCard from '../components/ProjectCard'
import ProjectsMap from '../components/ProjectsMap'
import { ProjectAPI } from '../api/client'
import { Search, SlidersHorizontal, MapIcon, LayoutGrid, X } from 'lucide-react'

// Remembers where the user was scrolled to on Discover so returning from a
// project's detail page via the "Back to Discovery" button lands them back
// at the exact same spot instead of snapping to the top.
const SCROLL_KEY = 'ih_discovery_scroll'

const CATEGORIES = ['Environment', 'Education', 'Health', 'Technology', 'Poverty Relief', 'Disaster Relief']
const STATUSES = ['approved', 'active', 'pending', 'completed']
const SORTS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'createdAt', label: 'Oldest' },
  { value: '-volunteersCount', label: 'Most Volunteers' },
  { value: 'endDate', label: 'Nearest Deadline' },
]

export default function Discover() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid')
  const [filters, setFilters] = useState({ search: '', category: '', location: '', status: '', skills: '', sort: '-createdAt' })
  const [showFilters, setShowFilters] = useState(false)

  const fetchProjects = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.category) params.category = filters.category
    if (filters.location) params.location = filters.location
    if (filters.status) params.status = filters.status
    if (filters.skills) params.skills = filters.skills
    if (filters.sort) params.sort = filters.sort
    ProjectAPI.list(params)
      .then((res) => setProjects(res.data?.data?.projects || res.data?.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    const t = setTimeout(fetchProjects, 350)
    return () => clearTimeout(t)
  }, [fetchProjects])

  // Restore the exact scroll position we were at before navigating into a
  // project's detail page, once the grid has finished rendering.
  useEffect(() => {
    if (loading) return
    const saved = sessionStorage.getItem(SCROLL_KEY)
    if (saved) {
      requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10) || 0))
    }
  }, [loading])

  const rememberScrollPosition = () => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
  }

  const clear = () => setFilters({ search: '', category: '', location: '', status: '', skills: '', sort: '-createdAt' })
  const activeCount = Object.entries(filters).filter(([k, v]) => k !== 'sort' && v).length

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Discover Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">Find causes near you and start volunteering today.</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button onClick={() => setView('grid')} className={`p-2 rounded-lg ${view === 'grid' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView('map')} className={`p-2 rounded-lg ${view === 'map' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}><MapIcon className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input className="input pl-10" placeholder="Search project title…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <select className="input sm:w-52" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={() => setShowFilters((s) => !s)} className="btn-secondary sm:w-auto">
              <SlidersHorizontal className="h-4 w-4" /> Filters {activeCount > 0 && <span className="badge bg-brand-600 text-white !px-1.5">{activeCount}</span>}
            </button>
          </div>

          {showFilters && (
            <div className="grid sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <select className="input" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="input" placeholder="Location" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} />
              <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">Any Status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="input" placeholder="Skills e.g. Marketing" value={filters.skills} onChange={(e) => setFilters({ ...filters, skills: e.target.value })} />
              {activeCount > 0 && (
                <button onClick={clear} className="btn-ghost text-red-500 sm:col-span-4 justify-start !px-2">
                  <X className="h-3.5 w-3.5" /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {view === 'map' ? (
          <ProjectsMap projects={projects} height={520} />
        ) : loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-72 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="card p-16 text-center text-gray-400">No projects match your filters.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" onClickCapture={rememberScrollPosition}>
            {projects.map((p) => <ProjectCard key={p._id} project={p} />)}
          </div>
        )}
      </div>
    </Layout>
  )
}
