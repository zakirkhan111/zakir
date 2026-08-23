import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { UserAPI, AuthAPI } from '../api/client'
import toast from 'react-hot-toast'
import { User, Lock } from 'lucide-react'
import { imageUrl } from '../utils/imageUrl'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', city: user?.city || '', skills: user?.skills || '' })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(imageUrl(user?.profilePicture))
  const [saving, setSaving] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })

  const onPhoto = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(f)
    setPreview(URL.createObjectURL(f))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (photo) fd.append('profilePicture', photo)
      const res = await UserAPI.updateProfile(fd)
      const u = res.data?.data?.user || res.data?.data
      if (u) updateUser({ ...user, ...u })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    try {
      await AuthAPI.updatePassword(pw)
      toast.success('Password updated')
      setPw({ currentPassword: '', newPassword: '' })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update password')
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-extrabold">Your Profile</h1>

        <form onSubmit={save} className="card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <label className="h-20 w-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 grid place-items-center cursor-pointer overflow-hidden bg-gray-50 dark:bg-gray-800">
              {preview ? <img src={preview} className="h-full w-full object-cover" alt="Profile preview" onError={() => setPreview(null)} /> : <User className="h-6 w-6 text-gray-400" aria-hidden="true" />}
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
            <div>
              <p className="font-bold">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 mt-1 capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">City</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="label">Skills</label><input className="input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
          </div>
          <button disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
        </form>

        <form onSubmit={changePassword} className="card p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Current Password</label><input type="password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
            <div><label className="label">New Password</label><input type="password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
          </div>
          <button className="btn-secondary">Update Password</button>
        </form>
      </div>
    </Layout>
  )
}
