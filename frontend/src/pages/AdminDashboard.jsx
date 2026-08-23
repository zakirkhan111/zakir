import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { DashboardAPI } from '../api/client'
import { Users, FolderKanban, Activity, CheckCircle2, Heart, Clock3 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

const PIE_COLORS = ['#22a56d', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7', '#14b8a6']

export default function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    DashboardAPI.admin().then((res) => setData(res.data?.data)).catch(() => {})
  }, [])

  const stats = data || {}
  const charts = stats.charts || {}
  // API aggregates are keyed objects; Recharts requires an array of data points.
  const toChartData = (source, fallback) => {
    if (Array.isArray(source)) {
      const normalized = source.map((item) => ({
        name: item?.name || item?._id || 'Unspecified',
        value: Number(item?.value ?? item?.count ?? 0) || 0,
      }))
      return normalized.length ? normalized : fallback
    }
    if (source && typeof source === 'object') {
      const normalized = Object.entries(source).map(([name, value]) => ({ name, value: Number(value) || 0 }))
      return normalized.length ? normalized : fallback
    }
    return fallback
  }
  const usersByRole = toChartData(charts.usersByRole ?? stats.usersByRole, [
    { name: 'Students', value: 0 },
    { name: 'Managers', value: 0 },
    { name: 'Admins', value: 0 },
  ])
  const projectsByCategory = toChartData(charts.projectsByCategory ?? stats.projectsByCategory, [{ name: 'No projects', value: 0 }])

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold">Platform Overview</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers ?? 0} accent="brand" />
          <StatCard icon={FolderKanban} label="Total Projects" value={stats.totalProjects ?? 0} accent="blue" />
          <StatCard icon={Activity} label="Active Projects" value={stats.activeProjects ?? 0} accent="pink" />
          <StatCard icon={CheckCircle2} label="Completed Projects" value={stats.completedProjects ?? 0} accent="purple" />
          <StatCard icon={Heart} label="Total Volunteers" value={stats.totalVolunteers ?? 0} accent="amber" />
          <StatCard icon={Clock3} label="Pending Projects" value={stats.pendingProjects ?? 0} accent="brand" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="font-bold mb-4">Users by Role</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={usersByRole} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={3}>
                  {usersByRole.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h2 className="font-bold mb-4">Projects by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectsByCategory}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#22a56d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  )
}
