import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'
import { DashboardAPI, ProjectAPI } from '../api/client'
import { FolderKanban, Activity, Users, ClipboardList, CheckCircle2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ManagerDashboard() {
  const [data, setData] = useState(null)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    DashboardAPI.manager().then((res) => setData(res.data?.data || {})).catch(() => setData({}))
    ProjectAPI.mine().then((res) => {
      const result = res.data?.data?.projects || res.data?.data
      setProjects(Array.isArray(result) ? result.map((project) => ({
        ...project,
        location: typeof project?.location === 'string'
          ? project.location
          : project?.location?.city || project?.location?.address || 'Location unavailable',
      })) : [])
    }).catch(() => setProjects([]))
  }, [])

  const stats = data && typeof data === 'object' ? data : {}
  const progressProjects = Array.isArray(stats?.projectProgress) ? stats.projectProgress : projects

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Manager Overview</h1>
          <Link to="/manager/projects" className="btn-primary"><Plus className="h-4 w-4" /> New Project</Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={FolderKanban} label="Total Projects" value={stats.totalProjects ?? projects.length ?? 0} accent="brand" />
          <StatCard icon={Activity} label="Active Projects" value={stats.activeProjects ?? 0} accent="blue" />
          <StatCard icon={Users} label="Total Volunteers" value={stats.totalVolunteers ?? 0} accent="pink" />
          <StatCard icon={ClipboardList} label="Pending Applications" value={stats.pendingApplications ?? 0} accent="amber" />
          <StatCard icon={CheckCircle2} label="Completed Tasks" value={stats.completedTasks ?? 0} accent="purple" />
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-lg">Project Progress</h2>
          <div className="space-y-4">
            {progressProjects.map((p, index) => (
              <ProgressBar key={p?._id || p?.title || index} value={Number(p?.progress ?? p?.completionPercentage) || 0} label={p?.title || 'Untitled project'} color="brand" />
            ))}
            {progressProjects.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No projects yet — create your first one.</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Your Projects</h2>
            <Link to="/manager/projects" className="text-sm font-semibold text-brand-600 dark:text-brand-400">Manage all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((p) => (
              <Link to={`/projects/${p._id}`} key={p._id} className="card p-4 hover:shadow-lg transition-shadow">
                <p className="font-bold line-clamp-1">{p.title}</p>
                <p className="text-xs text-gray-400 mt-1">{p.category} · {p.location}</p>
                <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 mt-3">{p.status}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
