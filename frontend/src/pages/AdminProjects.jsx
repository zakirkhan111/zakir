import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { AdminAPI } from '../api/client'
import { CheckCircle2, XCircle, Trash2, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const load = () => {
    setLoading(true)
    AdminAPI.projects(statusFilter ? { status: statusFilter } : {})
      .then((res) => {
        const result = res.data?.data?.projects || res.data?.data || []
        setProjects(Array.isArray(result) ? result.map((project) => ({
          ...project,
          location: typeof project?.location === 'string'
            ? project.location
            : project?.location?.city || project?.location?.address || 'Location unavailable',
        })) : [])
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [statusFilter])

  const approve = async (id) => { try { await AdminAPI.approveProject(id); toast.success('Project approved'); load() } catch { toast.error('Failed') } }
  const reject = async (id) => { try { await AdminAPI.rejectProject(id); toast.success('Project rejected'); load() } catch { toast.error('Failed') } }
  const remove = async (id) => { if (!confirm('Remove this project?')) return; try { await AdminAPI.removeProject(id); load() } catch { toast.error('Failed') } }
  const certify = async (id) => { try { await AdminAPI.issueCertificates(id); toast.success('Certificates issued') } catch { toast.error('Failed') } }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-extrabold">All Projects</h1>
          <select className="input w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <p className="p-8 text-center text-gray-400">Loading…</p>
          ) : projects.length === 0 ? (
            <p className="p-8 text-center text-gray-400">No projects found.</p>
          ) : projects.map((p) => (
            <div key={p._id} className="p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Link to={`/projects/${p._id}`} className="font-semibold hover:text-brand-600">{p.title}</Link>
                <p className="text-xs text-gray-400">{p.category} · {p.location} · by {p.manager?.name || p.projectManager?.name || 'Manager'}</p>
              </div>
              <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">{p.status}</span>
              <div className="flex gap-1">
                {p.status === 'pending_approval' && (
                  <>
                    <button onClick={() => approve(p._id)} className="btn-secondary !py-1.5 !px-3 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Approve Project</button>
                    <button onClick={() => reject(p._id)} className="btn-secondary !py-1.5 !px-3 text-red-500"><XCircle className="h-4 w-4" /></button>
                  </>
                )}
                {p.status === 'completed' && (
                  <button onClick={() => certify(p._id)} className="btn-secondary !py-1.5 !px-3 text-amber-600" title="Issue certificates"><Award className="h-4 w-4" /></button>
                )}
                <button onClick={() => remove(p._id)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"><Trash2 className="h-4 w-4" /> Delete Project</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
