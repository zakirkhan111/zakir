import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { AdminAPI } from '../api/client'
import { Ban, Trash2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { imageUrl } from '../utils/imageUrl'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')

  const load = () => {
    setLoading(true)
    AdminAPI.users(roleFilter ? { role: roleFilter } : {})
      .then((res) => setUsers(res.data?.data?.users || res.data?.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [roleFilter])

  const suspend = async (id) => { try { await AdminAPI.suspendUser(id); toast.success('User status updated'); load() } catch { toast.error('Failed') } }
  const remove = async (id) => { if (!confirm('Delete this user?')) return; try { await AdminAPI.deleteUser(id); load() } catch { toast.error('Failed') } }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-extrabold">Users</h1>
          <select className="input w-48" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="project_manager">Project Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">City</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u._id}>
                  <td className="p-4 flex items-center gap-3">
                    <img src={imageUrl(u.profilePicture) || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(u.name)}`} className="h-8 w-8 rounded-full object-cover" />
                    <div><p className="font-semibold">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                  </td>
                  <td className="p-4 capitalize">{u.role?.replace('_', ' ')}{u.role === 'admin' && <ShieldCheck className="inline h-3.5 w-3.5 ml-1 text-brand-500" />}</td>
                  <td className="p-4">{u.city}</td>
                  <td className="p-4"><span className={`badge ${u.suspended ? 'bg-red-50 text-red-500 dark:bg-red-950/40' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'}`}>{u.suspended ? 'Suspended' : 'Active'}</span></td>
                  <td className="p-4 flex gap-1">
                    <button onClick={() => suspend(u._id)} className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600" title="Toggle suspend"><Ban className="h-4 w-4" /></button>
                    <button onClick={() => remove(u._id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
