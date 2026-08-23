import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'
import ProjectCard from '../components/ProjectCard'
import { DashboardAPI, ApplicationAPI, SkillMatchAPI } from '../api/client'
import { FolderKanban, CheckCircle2, Clock3, Trophy, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StudentDashboard() {
  const [data, setData] = useState(null)
  const [joined, setJoined] = useState([])
  const [recommended, setRecommended] = useState([])

  useEffect(() => {
    DashboardAPI.student().then((res) => setData(res.data?.data || {})).catch(() => setData({}))
    ApplicationAPI.mine().then((res) => {
      const applications = res.data?.data?.applications || res.data?.data
      const joinedProjects = Array.isArray(applications)
        ? applications
          .filter((application) => application?.status === 'approved' && application?.project)
          .map((application) => application.project)
        : []
      setJoined(joinedProjects)
    }).catch(() => setJoined([]))
    SkillMatchAPI.recommended().then((res) => {
      const result = res.data?.data?.projects || res.data?.data
      setRecommended(Array.isArray(result) ? result : [])
    }).catch(() => setRecommended([]))
  }, [])

  const stats = data && typeof data === 'object' ? data : {}
  const taskCompletionRate = Number(stats?.charts?.taskCompletionRate ?? stats?.taskCompletionRate) || 0
  const projectCompletionRate = Number(stats?.charts?.projectCompletionRate ?? stats?.projectCompletionRate) || 0

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold">Your Impact Overview</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FolderKanban} label="Projects Joined" value={stats.projectsJoined ?? joined.length ?? 0} accent="brand" />
          <StatCard icon={CheckCircle2} label="Tasks Completed" value={stats.tasksCompleted ?? 0} accent="blue" />
          <StatCard icon={Clock3} label="Hours Contributed" value={stats.hoursContributed ?? 0} accent="amber" />
          <StatCard icon={Trophy} label="Projects Completed" value={stats.projectsCompleted ?? 0} accent="pink" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5 space-y-4">
            <h2 className="font-bold">Task Completion</h2>
            <ProgressBar value={taskCompletionRate} color="brand" />
          </div>
          <div className="card p-5 space-y-4">
            <h2 className="font-bold">Project Progress</h2>
            <ProgressBar value={projectCompletionRate} color="blue" />
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-500" /> Recommended for your skills</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommended.slice(0, 3).map((p) => <ProjectCard key={p._id} project={p} />)}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">My Projects</h2>
            <Link to="/discover" className="text-sm font-semibold text-brand-600 dark:text-brand-400">Discover more →</Link>
          </div>
          {joined.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">You haven't joined any projects yet. <Link to="/discover" className="text-brand-600 font-semibold">Browse projects</Link></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {joined.map((p) => <ProjectCard key={p._id} project={p} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
