import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { ProjectAPI } from '../api/client'
import { Plus, X, UploadCloud, Trash2, Edit3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const CATEGORIES = ['Environment', 'Education', 'Health', 'Technology', 'Poverty Relief', 'Disaster Relief']

const empty = {
  title: '', description: '', category: CATEGORIES[0], location: '', startDate: '', endDate: '',
  requiredVolunteers: 10, skillsRequired: '',
}

// Supports legacy string locations and the current MongoDB location object.
const normalizeProject = (project) => {
  if (!project || typeof project !== 'object') return null
  const location = typeof project.location === 'string'
    ? project.location
    : project.location?.city || project.location?.address || 'Location unavailable'
  return { ...project, location }
}

export default function ManagerProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    ProjectAPI.mine()
      .then((res) => {
        const result = res.data?.data?.projects || res.data?.projects || res.data?.data || []
        setProjects(Array.isArray(result) ? result.map(normalizeProject).filter(Boolean) : [])
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const onImage = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImage(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (image) fd.append('projectImage', image)
      await ProjectAPI.create(fd)
      toast.success('Project created — pending admin approval')
      setModal(false)
      setForm(empty)
      setImage(null)
      setPreview(null)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not create project')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this project?')) return
    try { await ProjectAPI.remove(id); load() } catch (err) { toast.error('Delete failed') }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">My Projects</h1>
          <button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> New Project</button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-56 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
        ) : projects.length === 0 ? (
          <div className="card p-16 text-center text-gray-400">No projects yet. Create your first community project!</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p, index) => (
              <div key={p?._id || index} className="card p-4 space-y-3">
                <Link to={`/projects/${p?._id || ''}`}>
                  <p className="font-bold line-clamp-1">{p?.title || 'Untitled project'}</p>
                  <p className="text-xs text-gray-400 mt-1">{p.category} · {p.location}</p>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">{p?.status || 'pending'}</span>
                  <div className="flex gap-1">
                    <Link onClick={(e) => e.stopPropagation()} to={`/projects/${p?._id || ''}`} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><Edit3 className="h-4 w-4" /></Link>
                    <button disabled={!p?._id} onClick={() => p?._id && remove(p._id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Create Project</h2>
              <button onClick={() => setModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <label className="h-32 w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 grid place-items-center cursor-pointer overflow-hidden bg-gray-50 dark:bg-gray-800">
                {preview ? <img src={preview} className="h-full w-full object-cover" /> : <span className="text-gray-400 text-sm flex flex-col items-center gap-1"><UploadCloud className="h-5 w-5" /> Project image</span>}
                <input type="file" accept="image/*" className="hidden" onChange={onImage} />
              </label>
              <div><label className="label">Title</label><input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Clean Rawalpindi Campaign" /></div>
              <div><label className="label">Description</label><textarea required rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Location</label><input required className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div><label className="label">Start Date</label><input type="date" required className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div><label className="label">End Date</label><input type="date" required className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
                <div><label className="label">Required Volunteers</label><input type="number" min={1} required className="input" value={form.requiredVolunteers} onChange={(e) => setForm({ ...form, requiredVolunteers: e.target.value })} /></div>
                <div><label className="label">Skills Required</label><input className="input" placeholder="Marketing, Design" value={form.skillsRequired} onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })} /></div>
              </div>
              <button disabled={saving} className="btn-primary w-full">{saving ? 'Creating…' : 'Create Project'}</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
