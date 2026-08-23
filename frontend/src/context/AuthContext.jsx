import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthAPI } from '../api/client'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ih_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ih_token')
    if (!token) { setLoading(false); return }
    AuthAPI.me()
      .then((res) => {
        const u = res.data?.data?.user || res.data?.user || res.data?.data
        setUser(u)
        localStorage.setItem('ih_user', JSON.stringify(u))
      })
      .catch(() => {
        localStorage.removeItem('ih_token')
        localStorage.removeItem('ih_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (data) => {
    const res = await AuthAPI.login(data)
    const token = res.data?.token
    const u = res.data?.data?.user || res.data?.user
    localStorage.setItem('ih_token', token)
    localStorage.setItem('ih_user', JSON.stringify(u))
    setUser(u)
    toast.success(`Welcome back, ${u?.name?.split(' ')[0] || 'friend'}!`)
    return u
  }

  const register = async (formData) => {
    const res = await AuthAPI.register(formData)
    const token = res.data?.token
    const u = res.data?.data?.user || res.data?.user
    if (token) {
      localStorage.setItem('ih_token', token)
      localStorage.setItem('ih_user', JSON.stringify(u))
      setUser(u)
    }
    toast.success('Account created! Welcome to ImpactHub 🎉')
    return u
  }

  const logout = () => {
    localStorage.removeItem('ih_token')
    localStorage.removeItem('ih_user')
    setUser(null)
    toast.success('Logged out')
  }

  const updateUser = (u) => {
    setUser(u)
    localStorage.setItem('ih_user', JSON.stringify(u))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
