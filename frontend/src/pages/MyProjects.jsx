import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import Layout from '../components/Layout'
import ProjectCard from '../components/ProjectCard'
import { ApplicationAPI } from '../api/client'

export default function MyProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ApplicationAPI.mine()
      .then((res) => {
        const applications = res.data?.data?.applications || []
        setProjects(Array.isArray(applications)
          ? applications.filter((application) => application?.project).map((application) => ({ ...application.project, applicationStatus: application.status }))
          : [])
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  return <Layout><div className="space-y-6">
    <div><h1 className="text-2xl font-extrabold">Joined Projects</h1><p className="mt-1 text-sm text-gray-500">Track every campaign you have applied to or joined.</p></div>
    {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((key) => <div key={key} className="card h-72 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
      : projects.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <ProjectCard key={project._id} project={project} />)}</div>
        : <div className="card px-6 py-16 text-center"><FolderKanban className="mx-auto h-10 w-10 text-brand-500" /><h2 className="mt-4 text-lg font-bold">You haven't joined any projects yet</h2><p className="mt-2 text-sm text-gray-500">Explore local campaigns and send your first volunteer application.</p><Link to="/discover" className="btn-primary mt-6 inline-flex">Discover projects</Link></div>}
  </div></Layout>
}
