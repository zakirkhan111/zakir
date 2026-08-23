import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Users, Clock, Tag } from 'lucide-react'
import ProgressBar from './ProgressBar'
import { imageUrl } from '../utils/imageUrl'

const statusStyles = {
  approved: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  pending: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  active: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  completed: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
  rejected: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
}

export default function ProjectCard({ project: inputProject }) {
  const sourceProject = inputProject && typeof inputProject === 'object' ? inputProject : {}
  const location = typeof sourceProject.location === 'string'
    ? sourceProject.location
    : sourceProject.location?.city || sourceProject.location?.address || 'Location unavailable'
  const project = { ...sourceProject, location }
  const projectImage = imageUrl(project?.image) || imageUrl(project?.projectImage)
  const filled = project?.volunteers?.length || project?.approvedVolunteersCount || project?.currentVolunteersCount || 0
  const required = project?.requiredVolunteers || project?.volunteersNeeded || project?.volunteersRequired || 1
  const pct = Math.round((filled / required) * 100) || 0
  const status = String(project?.status || 'pending').toLowerCase()

  return (
    <Link to={`/projects/${project?._id || ''}`} className="card group overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <div className="h-40 w-full bg-gradient-to-br from-brand-400 to-brand-700 relative overflow-hidden">
        {projectImage ? (
          <img src={projectImage} alt={project.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="h-full w-full grid place-items-center text-white/80 text-5xl font-black">{project.title?.[0] || 'I'}</div>
        )}
        <span className={`absolute top-3 right-3 badge ${statusStyles[status] || statusStyles.pending} backdrop-blur`}>
          {status}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-base line-clamp-1">{project.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{project.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{project.category}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{project.location}</span>
          {project.endDate && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(project.endDate).toLocaleDateString()}</span>
          )}
        </div>
        <ProgressBar value={pct} label={`${filled}/${required} volunteers`} />
      </div>
    </Link>
  )
}
