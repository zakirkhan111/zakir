import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { UserAPI, AuthAPI } from '../api/client'
import toast from 'react-hot-toast'
import { User, Lock, Pencil, Camera, ChevronDown, X, Check } from 'lucide-react'
import { imageUrl } from '../utils/imageUrl'
import SkillsSelector from '../components/SkillsSelector'
import AvatarCropModal from '../components/AvatarCropModal'

const toSkillsArray = (skills) => {
  if (Array.isArray(skills)) return skills
  if (typeof skills === 'string') return skills.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', city: user?.city || '',
    skills: toSkillsArray(user?.skills),
  })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(imageUrl(user?.profilePicture))
  const [cropFile, setCropFile] = useState(null)
  const [avatarHover, setAvatarHover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)

  const startEdit = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '', city: user?.city || '', skills: toSkillsArray(user?.skills) })
    setPreview(imageUrl(user?.profilePicture))
    setPhoto(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setPhoto(null)
    setPreview(imageUrl(user?.profilePicture))
  }

  // Intercepts the native file picker and opens the crop/pan modal instead of
  // using the raw file directly — same premium flow as Register.
  const onPickPhoto = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setCropFile(f)
  }
  const onCropSet = (croppedFile) => {
    setPhoto(croppedFile)
    setPreview(URL.createObjectURL(croppedFile))
    setCropFile(null)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('phone', form.phone)
      fd.append('city', form.city)
      fd.append('skills', form.skills.join(', '))
      if (photo) fd.append('profilePicture', photo)
      const res = await UserAPI.updateProfile(fd)
      const u = res.data?.data?.user || res.data?.data
      if (u) updateUser({ ...user, ...u })
      toast.success('Profile updated')
      setEditing(false)
      setPhoto(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwSaving(true)
    try {
      await AuthAPI.updatePassword(pw)
      toast.success('Password updated')
      setPw({ currentPassword: '', newPassword: '' })
      setPwOpen(false)
    } catch (err) {
      // An incorrect current password is a 400 form error from the backend —
      // never a session-ending 401 — so this toast fires without ever logging
      // the user out or bouncing them back to /login.
      toast.error(err?.response?.data?.message || 'Could not update password')
    } finally {
      setPwSaving(false)
    }
  }

  const skillsDisplay = toSkillsArray(user?.skills)

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Your Profile</h1>
          {!editing && (
            <button onClick={startEdit} className="btn-secondary !py-1.5 !px-3">
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={save} className="card p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-800 grid place-items-center border-2 border-dashed border-gray-300 dark:border-gray-700"
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
            >
              {preview ? (
                <img src={preview} className="h-full w-full object-cover" alt="Profile" onError={() => setPreview(null)} />
              ) : (
                <User className="h-6 w-6 text-gray-400" aria-hidden="true" />
              )}
              {editing && (
                <label
                  htmlFor="profile-photo"
                  className={`absolute inset-0 grid place-items-center bg-black/50 cursor-pointer transition-opacity ${avatarHover ? 'opacity-100' : 'opacity-0'}`}
                  title="Change photo"
                >
                  <Camera className="h-5 w-5 text-white" />
                </label>
              )}
              <input id="profile-photo" type="file" accept="image/*" className="hidden" onChange={onPickPhoto} disabled={!editing} />
            </div>
            <div>
              <p className="font-bold">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 mt-1 capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              {editing ? (
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              ) : (
                <p className="py-2 text-sm font-semibold whitespace-pre-wrap break-words">{user?.name || '—'}</p>
              )}
            </div>
            <div>
              <label className="label">Phone</label>
              {editing ? (
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              ) : (
                <p className="py-2 text-sm font-semibold whitespace-pre-wrap break-words">{user?.phone || '—'}</p>
              )}
            </div>
            <div>
              <label className="label">City</label>
              {editing ? (
                <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              ) : (
                <p className="py-2 text-sm font-semibold whitespace-pre-wrap break-words">{user?.city || '—'}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Skills</label>
              {editing ? (
                <SkillsSelector value={form.skills} onChange={(skills) => setForm({ ...form, skills })} />
              ) : skillsDisplay.length ? (
                <div className="flex flex-wrap gap-2 py-1">
                  {skillsDisplay.map((skill) => (
                    <span key={skill} className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-sm text-gray-400">No skills added yet.</p>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={cancelEdit} className="btn-secondary flex-1">Cancel</button>
              <button disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          )}
        </form>

        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setPwOpen((isOpen) => !isOpen)}
            className="flex w-full items-center justify-between p-6"
            aria-expanded={pwOpen}
          >
            <h2 className="font-bold flex items-center gap-2"><Lock className="h-4 w-4" /> Change Security Password 🔑</h2>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${pwOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className={`grid transition-all duration-300 ease-in-out ${pwOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <form onSubmit={changePassword} className="space-y-4 px-6 pb-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="label">Current Password</label><input type="password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
                  <div><label className="label">New Password</label><input type="password" minLength={8} className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
                </div>
                <button disabled={pwSaving} className="btn-secondary"><Check className="h-4 w-4" /> {pwSaving ? 'Updating…' : 'Update Password'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {cropFile && (
        <AvatarCropModal file={cropFile} onClose={() => setCropFile(null)} onSet={onCropSet} />
      )}
    </Layout>
  )
}
