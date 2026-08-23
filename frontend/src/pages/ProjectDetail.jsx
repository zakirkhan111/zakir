import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import ProgressBar from '../components/ProgressBar'
import { ProjectAPI, ApplicationAPI, CommentAPI, TaskAPI, SkillMatchAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { MapPin, Calendar, Users, Tag, Send, Trash2, Star, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import KanbanBoard from '../components/KanbanBoard'
import { imageUrl } from '../utils/imageUrl'
import ProjectsMap from '../components/ProjectsMap'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [applying, setApplying] = useState(false)
  const [tasks, setTasks] = useState([])
  const [match, setMatch] = useState(null)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [applications, setApplications] = useState([])
  const [showMap, setShowMap] = useState(false)

  const load = () => {
    ProjectAPI.get(id)
      .then((res) => {
        const result = res.data?.data?.project || res.data?.data
        setProject(result && typeof result === 'object' ? result : null)
      })
      .catch(() => setProject(null))
    CommentAPI.forProject(id).then((res) => {
      const result = res.data?.data?.comments || res.data?.data
      setComments(Array.isArray(result) ? result : [])
    }).catch(() => setComments([]))
    if (user?.role !== 'admin') {
      TaskAPI.forProject(id).then((res) => {
        const result = res.data?.data?.tasks || res.data?.data
        setTasks(Array.isArray(result) ? result : [])
      }).catch(() => setTasks([]))
    }
    if (user?.role === 'student') {
      SkillMatchAPI.matchMe(id).then((res) => setMatch(res.data?.data)).catch(() => {})
    }
    if (user?.role === 'project_manager' || user?.role === 'admin') {
      ApplicationAPI.forProject(id).then((res) => {
        const result = res.data?.data?.applications || res.data?.data
        setApplications(Array.isArray(result) ? result : [])
      }).catch(() => setApplications([]))
    }
  }

  const decide = async (appId, decision) => {
    try {
      await ApplicationAPI.decide(appId, decision)
      toast.success(`Application ${decision}`)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update application')
    }
  }

  useEffect(() => { load() }, [id])

  const apply = async () => {
    setApplying(true)
    try {
      await ApplicationAPI.apply({ projectId: id, project: id })
      toast.success('Application submitted!')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not apply')
    } finally {
      setApplying(false)
    }
  }

  const postComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      await CommentAPI.create({ projectId: id, project: id, text: commentText, content: commentText })
      setCommentText('')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not post comment')
    }
  }

  const removeComment = async (cid) => {
    try { await CommentAPI.remove(cid); load() } catch {}
  }

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      await ProjectAPI.addReview(id, review)
      toast.success('Thanks for your review!')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit review')
    }
  }

  if (!project) {
    return <Layout><div className="card h-64 animate-pulse bg-gray-100 dark:bg-gray-800" /></Layout>
  }

  const filled = project.volunteers?.length || project.approvedVolunteersCount || 0
  const required = project.requiredVolunteers || project.volunteersRequired || 1
  const canManageTasks = user?.role === 'project_manager' || user?.role === 'admin'
  const isManagerOfThis = user?._id === (project.manager?._id || project.manager) || user?._id === (project.projectManager?._id || project.projectManager)
  const projectImage = imageUrl(project.image) || imageUrl(project.projectImage)
  const locationLabel = typeof project?.location === 'string'
    ? project.location
    : project?.location?.city || project?.location?.address || 'Location unavailable'
  const skills = Array.isArray(project?.skillsRequired)
    ? project.skillsRequired
    : typeof project?.skillsRequired === 'string'
      ? project.skillsRequired.split(',')
      : []

  return (
    <Layout>
      <div className="space-y-6">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card overflow-hidden">
          <div className="h-56 sm:h-72 bg-gradient-to-br from-brand-500 to-brand-800 relative">
            {projectImage && (
              <img src={projectImage} className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <span className="badge bg-white/20 backdrop-blur mb-2">{project.status}</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{project.title}</h1>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">{project.category || 'Community project'}</p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{project.description || 'No project description has been provided.'}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5"><Tag className="h-4 w-4" /> {project.category}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {locationLabel}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(project.startDate).toLocaleDateString()} – {new Date(project.endDate).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {filled}/{required} volunteers</span>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.filter(Boolean).map((skill, index) => (
                  <span key={`${skill}-${index}`} className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">{String(skill).trim()}</span>
                ))}
              </div>
            )}
            <ProgressBar value={Math.round((filled / required) * 100) || 0} label="Volunteer capacity" />

            {match && (
              <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 p-3.5 flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-brand-600 shrink-0" />
                <span>Skill match score: <strong>{match.score ?? match.matchScore ?? '—'}</strong>{match.message ? ` — ${match.message}` : ''}</span>
              </div>
            )}

            {user?.role === 'student' && (
              <button onClick={apply} disabled={applying} className="btn-primary">
                {applying ? 'Applying…' : 'Apply Now'}
              </button>
            )}
          </div>
        </div>

        <aside className="card sticky top-24 overflow-hidden p-5 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Volunteer opportunity</p>
            <h2 className="mt-1 text-xl font-extrabold">Make an impact</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-gray-500">Volunteer capacity</span><strong>{filled}/{required}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Starts</span><strong>{project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBA'}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Ends</span><strong>{project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBA'}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Location</span><strong className="text-right">{locationLabel}</strong></div>
          </div>
          <button type="button" onClick={() => setShowMap((visible) => !visible)} className="btn-secondary w-full">{showMap ? 'Hide location map' : 'Show location map'}</button>
          {showMap && <ProjectsMap projects={[project]} height={220} />}
          {user?.role === 'student' && (
            <button onClick={apply} disabled={applying} className="btn-primary w-full py-3 shadow-lg shadow-brand-600/25 transition-transform hover:-translate-y-0.5">
              {applying ? 'Submitting application…' : 'Apply Now'}
            </button>
          )}
        </aside>
        </div>

        {canManageTasks && (
          <div className="card p-5 space-y-3">
            <h2 className="font-bold text-lg">Volunteer Applications</h2>
            {applications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No applications yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {applications.map((a) => (
                  <div key={a._id} className="flex items-center gap-3 py-3">
                    <img src={imageUrl(a.student?.profilePicture) || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(a.student?.name || 'U')}`} className="h-9 w-9 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{a.student?.name || 'Student'}</p>
                      <p className="text-xs text-gray-400">{a.student?.city} · {a.student?.skills}</p>
                    </div>
                    {(a.status === 'pending' || !a.status) ? (
                      <div className="flex gap-2">
                        <button onClick={() => decide(a._id, 'approved')} className="btn-secondary !py-1.5 !px-3 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Approve</button>
                        <button onClick={() => decide(a._id, 'rejected')} className="btn-secondary !py-1.5 !px-3 text-red-500"><XCircle className="h-4 w-4" /> Reject</button>
                      </div>
                    ) : (
                      <span className={`badge ${a.status === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-red-50 text-red-500 dark:bg-red-950/40'}`}>{a.status}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(canManageTasks || user?.role === 'student') && tasks.length >= 0 && (
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-lg">Task Board</h2>
            <KanbanBoard tasks={tasks} setTasks={setTasks} />
          </div>
        )}

        {user?.role === 'student' && project.status === 'completed' && (
          <div className="card p-5 space-y-3">
            <h2 className="font-bold text-lg flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" /> Rate this project</h2>
            <form onSubmit={submitReview} className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setReview({ ...review, rating: n })}>
                    <Star className={`h-6 w-6 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              <textarea className="input" rows={3} placeholder="Share your experience…" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
              <button className="btn-primary">Submit Review</button>
            </form>
          </div>
        )}

        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-lg">Discussion</h2>
          <form onSubmit={postComment} className="flex gap-2">
            <input className="input flex-1" placeholder="Share an update with the team…" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <button className="btn-primary !px-4"><Send className="h-4 w-4" /></button>
          </form>
          <div className="space-y-3">
            {comments.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No comments yet — start the conversation.</p>}
            {comments.map((c) => (
              <div key={c._id} className="flex items-start gap-3">
                <img src={imageUrl(c.author?.profilePicture) || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(c.author?.name || 'U')}`} className="h-8 w-8 rounded-full object-cover" />
                <div className="flex-1 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{c.author?.name || 'User'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}</span>
                      {(c.author?._id === user?._id || user?.role === 'admin') && (
                        <button onClick={() => removeComment(c._id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm mt-0.5">{c.text || c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
