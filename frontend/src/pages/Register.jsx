import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { User, Mail, Lock, Phone, MapPin, Sparkles, UploadCloud, GraduationCap, Briefcase, ChevronDown, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'student', label: 'Student / Volunteer', icon: GraduationCap },
  { value: 'project_manager', label: 'Project Manager', icon: Briefcase },
]

const SKILL_OPTIONS = ['Web Development', 'Design', 'Marketing', 'Teamwork', 'Event Management', 'Communication', 'Social Work']

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '', skills: '', role: 'student',
  })
  const [selectedSkills, setSelectedSkills] = useState([])
  const [skillsOpen, setSkillsOpen] = useState(false)

  const toggleSkill = (skill) => {
    const nextSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter((item) => item !== skill)
      : [...selectedSkills, skill]
    setSelectedSkills(nextSkills)
    setForm((current) => ({ ...current, skills: nextSkills.join(', ') }))
  }

  const onPhoto = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
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
    <div className="min-h-screen flex items-start justify-center p-6 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex justify-center"><Logo size="lg" /></div>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold">Create your account</h2>
          <p className="text-sm text-gray-500 mt-1">Join ImpactHub and start making a difference.</p>
        </div>

        <div className="card max-h-[85vh] overflow-y-auto pr-2 scrollbar-thin p-6 pb-12 space-y-5 sm:p-8 sm:pb-12">
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
                {preview ? <img src={preview} className="h-full w-full object-cover" /> : <UploadCloud className="h-5 w-5 text-gray-400" />}
              </label>
              <input id="photo" type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              <div>
                <p className="text-sm font-semibold">Profile picture</p>
                <p className="text-xs text-gray-400">Optional — PNG or JPG</p>
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
                  <input type="password" required minLength={6} className="input pl-10" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
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
                <div>
                  <button type="button" onClick={() => setSkillsOpen((isOpen) => !isOpen)} aria-expanded={skillsOpen} className="input flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 text-left">
                    <span className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-gray-400" />
                      {selectedSkills.length ? `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected` : 'Choose your skills'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${skillsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {skillsOpen && <div className="relative block mt-2 mb-6 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex flex-wrap gap-2">
                      {SKILL_OPTIONS.map((skill) => (
                        <button type="button" key={skill} onClick={() => toggleSkill(skill)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${selectedSkills.includes(skill) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-brand-50 dark:bg-gray-800 dark:text-gray-300'}`}>
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>}
                  {selectedSkills.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSkills.map((skill) => <button key={skill} type="button" onClick={() => toggleSkill(skill)} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-brand-950/40 dark:text-brand-300" title={`Remove ${skill}`}>
                      {skill}<X className="h-3.5 w-3.5" />
                    </button>)}
                  </div>}
                </div>
              </div>
            </div>

            <button disabled={loading} className="btn-primary w-full">{loading ? 'Creating account…' : 'Create Account'}</button>
          </form>
        </div>
        <p className="text-sm text-center text-gray-500">
          Already have an account? <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
