import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Discover from './pages/Discover'
import ProjectDetail from './pages/ProjectDetail'
import StudentDashboard from './pages/StudentDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ManagerProjects from './pages/ManagerProjects'
import AdminUsers from './pages/AdminUsers'
import AdminProjects from './pages/AdminProjects'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import InfoPage from './pages/InfoPage'
import MyProjects from './pages/MyProjects'

function RoleDashboard() {
  const { user } = useAuth()
  if (user?.role === 'admin') return <AdminDashboard />
  if (user?.role === 'project_manager') return <ManagerDashboard />
  return <StudentDashboard />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<InfoPage />} />
      <Route path="/privacy" element={<InfoPage />} />
      <Route path="/terms" element={<InfoPage />} />

      <Route path="/" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="/my-projects" element={<ProtectedRoute roles={['student']}><MyProjects /></ProtectedRoute>} />
      <Route path="/manager/projects" element={<ProtectedRoute roles={['project_manager', 'admin']}><ManagerProjects /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute roles={['admin']}><AdminProjects /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
