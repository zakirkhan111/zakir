import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form)
      const from = location.state?.from?.pathname
      navigate(from || '/', { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-950 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <Logo size="lg" />
        <div className="relative z-10 space-y-4 max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">Turn community effort into measurable impact.</h1>
          <p className="text-brand-100">Create projects, recruit volunteers, manage tasks, and track your impact score — all in one platform.</p>
        </div>
        <p className="relative z-10 text-sm text-brand-200">© {new Date().getFullYear()} ImpactHub · Saylani Community Impact Platform</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden"><Logo /></div>
          <div>
            <h2 className="text-2xl font-extrabold">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Log in to continue making an impact.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" required className="input pl-12" placeholder="you@example.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type={show ? 'text' : 'password'} required className="input pl-10 pr-10" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
          <p className="text-sm text-center text-gray-500">
            Don't have an account? <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-400">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
