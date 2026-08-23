import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProgressBar from '../components/ProgressBar'
import { ProjectAPI, ApplicationAPI, CommentAPI, TaskAPI, SkillMatchAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { MapPin, Calendar, Users, Tag, Send, Trash2, Star, Sparkles, CheckCircle2, XCircle, ArrowLeft, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import KanbanBoard from '../components/KanbanBoard'
import { imageUrl } from '../utils/imageUrl'
import ProjectsMap from '../components/ProjectsMap'

const SCROLL_KEY = 'ih_discovery_scroll'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [applying, setApplying] = useState(false)
  const [tasks, setTasks] = useState([])
  const [match, setMatch] = useState(null)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [applications, setApplications] = useState([])
  const [myApplicationStatus, setMyApplicationStatus] = useState(null)
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
      ApplicationAPI.mine().then((res) => {
        const mine = res.data?.data?.applications || res.data?.data || []
        const forThisProject = Array.isArray(mine) ? mine.find((a) => (a.project?._id || a.project) === id) : null
        setMyApplicationStatus(forThisProject?.status || null)
      }).catch(() => {})
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

  // Return to Discover at the exact vertical scroll position the user was
  // browsing, instead of snapping back to the top of the grid.
  const goBackToDiscovery = () => navigate('/discover')

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

  const filled = project.volunteers?.length || project.approvedVolunteersCount || project.currentVolunteersCount || 0
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

  // Programmatically compute the intersection between the user's own skillset
  // and the project's required skills, for a real, animated match percentage.
  const userSkills = (Array.isArray(user?.skills) ? user.skills : typeof user?.skills === 'string' ? user.skills.split(',') : [])
    .map((s) => s.trim().toLowerCase()).filter(Boolean)
  const requiredSkillsNorm = skills.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
  const intersection = requiredSkillsNorm.filter((s) => userSkills.includes(s))
  const computedMatchPct = requiredSkillsNorm.length ? Math.round((intersection.length / requiredSkillsNorm.length) * 100) : 0
  const matchPct = Math.max(0, Math.min(100, match?.score ?? match?.matchScore ?? computedMatchPct))

  // Only an approved member (or the managing PM / admin) may see their
  // assigned tasks and post in the discussion forum.
  const isApprovedStudent = user?.role === 'student' && myApplicationStatus === 'approved'
  const canAccessTaskBoard = canManageTasks || isApprovedStudent
  const canParticipateInForum = canManageTasks || isApprovedStudent

  return (
    <Layout>
      <div className="space-y-6">
        <button
          type="button"
          onClick={goBackToDiscovery}
          className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-md ring-1 ring-brand-100 transition-all hover:-translate-x-0.5 hover:shadow-lg dark:bg-gray-900 dark:text-brand-400 dark:ring-brand-900/50"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Discovery
        </button>

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
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{project.description || 'No project description has been provided.'}</p>
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

            {user?.role === 'student' && requiredSkillsNorm.length > 0 && (
              <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-brand-600 shrink-0" />
                  <span>Skill match</span>
                </div>
                <ProgressBar value={matchPct} label={`${matchPct}% match with this project`} color={matchPct >= 66 ? 'brand' : matchPct >= 33 ? 'amber' : 'pink'} />
              </div>
            )}

            {user?.role === 'student' && (
              <button onClick={apply} disabled={applying || !!myApplicationStatus} className="btn-primary disabled:opacity-60">
                {myApplicationStatus === 'approved' ? 'You joined this project ✓' : myApplicationStatus === 'pending' ? 'Application pending…' : myApplicationStatus === 'rejected' ? 'Application rejected' : applying ? 'Applying…' : 'Apply Now'}
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
            <button onClick={apply} disabled={applying || !!myApplicationStatus} className="btn-primary w-full py-3 shadow-lg shadow-brand-600/25 transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">
              {myApplicationStatus ? `Application ${myApplicationStatus}` : applying ? 'Submitting application…' : 'Apply Now'}
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
                      <p className="text-xs text-gray-400">{a.student?.city} · {a.student?.phone} · {a.student?.email}</p>
                      <p className="text-xs text-gray-400">{Array.isArray(a.student?.skills) ? a.student.skills.join(', ') : a.student?.skills}</p>
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

        {(canManageTasks || user?.role === 'student') && (
          <div className="card p-5 space-y-4 relative">
            <h2 className="font-bold text-lg">Task Board</h2>
            {canAccessTaskBoard ? (
              <KanbanBoard tasks={tasks} setTasks={setTasks} />
            ) : (
              <div className="relative overflow-hidden rounded-2xl">
                <div className="pointer-events-none blur-sm select-none opacity-60">
                  <KanbanBoard tasks={[]} setTasks={() => {}} />
                </div>
                <div className="absolute inset-0 grid place-items-center rounded-2xl bg-white/70 dark:bg-gray-950/70 backdrop-blur-sm">
                  <div className="text-center px-6 py-8">
                    <Lock className="h-6 w-6 mx-auto mb-2 text-brand-600" />
                    <p className="font-semibold text-sm">Join this campaign to access your assigned tasks! 🔒</p>
                  </div>
                </div>
              </div>
            )}
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
              <textarea className="input whitespace-pre-wrap break-words" rows={3} placeholder="Share your experience…" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
              <button className="btn-primary">Submit Review</button>
            </form>
          </div>
        )}

        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-lg">Discussion</h2>
          {canParticipateInForum ? (
            <form onSubmit={postComment} className="flex gap-2">
              <textarea
                rows={1}
                className="input flex-1 resize-none whitespace-pre-wrap break-words"
                placeholder="Share an update with the team…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(e) } }}
              />
              <button className="btn-primary !px-4"><Send className="h-4 w-4" /></button>
            </form>
          ) : (
            <p className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 text-sm text-gray-500 text-center">
              Only approved project members can participate in the discussion forum.
            </p>
          )}
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
                  <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{c.text || c.content}</p>
                  {Array.isArray(c.replies) && c.replies.length > 0 && (
                    <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      {c.replies.map((r) => (
                        <div key={r._id} className="text-sm">
                          <span className="font-semibold">{r.author?.name || 'User'}: </span>
                          <span className="whitespace-pre-wrap break-words">{r.text || r.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
