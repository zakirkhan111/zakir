import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import SkillsSelector from '../components/SkillsSelector'
import AvatarCropModal from '../components/AvatarCropModal'
import { User, Mail, Lock, Phone, MapPin, UploadCloud, GraduationCap, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'student', label: 'Student / Volunteer', icon: GraduationCap },
  { value: 'project_manager', label: 'Project Manager', icon: Briefcase },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [cropFile, setCropFile] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '', role: 'student',
  })
  const [selectedSkills, setSelectedSkills] = useState([])

  // Clicking the avatar placeholder intercepts the native file picker's result
  // and opens the crop/pan modal instead of using the raw file directly.
  const onPickPhoto = (e) => {
    const f = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!f) return
    setCropFile(f)
  }

  const onCropSet = (croppedFile) => {
    setPhoto(croppedFile)
    setPreview(URL.createObjectURL(croppedFile))
    setCropFile(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('skills', selectedSkills.join(', '))
      if (photo) fd.append('profilePicture', photo)
      await register(fd)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex justify-center"><Logo size="lg" /></div>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold">Create your account</h2>
          <p className="text-sm text-gray-500 mt-1">Join ImpactHub and start making a difference.</p>
        </div>

        <div className="card p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(({ value, label, icon: Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => setForm({ ...form, role: value })}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                  form.role === value ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <Icon className={`h-6 w-6 ${form.role === value ? 'text-brand-600' : 'text-gray-400'}`} />
                <span className="text-xs font-bold text-center">{label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center gap-4">
              <label htmlFor="photo" className="h-16 w-16 shrink-0 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 grid place-items-center cursor-pointer overflow-hidden bg-gray-50 dark:bg-gray-800">
                {preview ? <img src={preview} className="h-full w-full object-cover" alt="Profile preview" /> : <UploadCloud className="h-5 w-5 text-gray-400" />}
              </label>
              <input id="photo" type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
              <div>
                <p className="text-sm font-semibold">Profile picture</p>
                <p className="text-xs text-gray-400">Optional — PNG or JPG. You'll be able to crop it.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input required className="input pl-12" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ali Khan" /></div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="email" required className="input pl-12" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="password" required minLength={8} className="input pl-10" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
              </div>
              <div>
                <label className="label">Phone</label>
                <div className="relative"><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input required className="input pl-12" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03xx-xxxxxxx" /></div>
              </div>
              <div>
                <label className="label">City</label>
                <div className="relative"><MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input required className="input pl-12" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Rawalpindi" /></div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Skills</label>
                <SkillsSelector value={selectedSkills} onChange={setSelectedSkills} />
              </div>
            </div>

            <button disabled={loading} className="btn-primary w-full">{loading ? 'Creating account…' : 'Create Account'}</button>
          </form>
        </div>
        <p className="text-sm text-center text-gray-500">
          Already have an account? <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400">Sign in</Link>
        </p>
      </div>

      {cropFile && (
        <AvatarCropModal file={cropFile} onClose={() => setCropFile(null)} onSet={onCropSet} />
      )}
    </div>
  )
}
