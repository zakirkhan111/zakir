import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ih_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('ih_token')
      localStorage.removeItem('ih_user')
      if (!location.pathname.startsWith('/login')) location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export const AuthAPI = {
  register: (formData) => api.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updatePassword: (data) => api.patch('/auth/update-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
}

export const UserAPI = {
  leaderboard: (params) => api.get('/users/leaderboard/contributors', { params }),
  updateProfile: (formData) => api.patch('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  myStats: () => api.get('/users/me/stats'),
  getById: (id) => api.get(`/users/${id}`),
}

export const ProjectAPI = {
  list: (params) => api.get('/projects', { params }),
  mine: () => api.get('/projects/manager/mine'),
  joined: () => api.get('/projects/student/joined'),
  create: (formData) => api.post('/projects', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, formData) => api.patch(`/projects/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/projects/${id}`),
  addUpdate: (id, data) => api.post(`/projects/${id}/updates`, data),
  analytics: (id) => api.get(`/projects/${id}/analytics`),
  addReview: (id, data) => api.post(`/projects/${id}/reviews`, data),
  uploadEvidence: (id, formData) => api.post(`/projects/${id}/completion-evidence`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const ApplicationAPI = {
  apply: (data) => api.post('/applications', data),
  mine: () => api.get('/applications/mine'),
  forProject: (projectId) => api.get(`/applications/project/${projectId}`),
  decide: (id, decision) => api.patch(`/applications/${id}/decision`, { decision }),
}

export const TaskAPI = {
  create: (data) => api.post('/tasks', data),
  mine: () => api.get('/tasks/mine'),
  forProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  remove: (id) => api.delete(`/tasks/${id}`),
}

export const CommentAPI = {
  create: (data) => api.post('/comments', data),
  forProject: (projectId) => api.get(`/comments/project/${projectId}`),
  remove: (id) => api.delete(`/comments/${id}`),
}

export const NotificationAPI = {
  list: () => api.get('/notifications'),
  markAllRead: () => api.patch('/notifications/read-all'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  remove: (id) => api.delete(`/notifications/${id}`),
}

export const AdminAPI = {
  users: (params) => api.get('/admin/users', { params }),
  suspendUser: (id) => api.patch(`/admin/users/${id}/suspend`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  projects: (params) => api.get('/admin/projects', { params }),
  approveProject: (id) => api.patch(`/admin/projects/${id}/approve`),
  rejectProject: (id) => api.patch(`/admin/projects/${id}/reject`),
  removeProject: (id) => api.delete(`/admin/projects/${id}`),
  issueCertificates: (id) => api.post(`/admin/projects/${id}/issue-certificates`),
  stats: () => api.get('/admin/stats'),
  reports: () => api.get('/admin/reports'),
}

export const DashboardAPI = {
  student: () => api.get('/dashboard/student'),
  manager: () => api.get('/dashboard/manager'),
  admin: () => api.get('/dashboard/admin'),
  impactLeaderboard: () => api.get('/dashboard/leaderboard/impact'),
}

export const SkillMatchAPI = {
  matchMe: (projectId) => api.get(`/skill-match/project/${projectId}`),
  recommended: () => api.get('/skill-match/recommended-projects'),
  candidates: (projectId) => api.get(`/skill-match/project/${projectId}/candidates`),
}
