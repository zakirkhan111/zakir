import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { UserAPI, DashboardAPI } from '../api/client'
import { Trophy, Medal, Star } from 'lucide-react'
import { imageUrl } from '../utils/imageUrl'

const rankColor = ['text-amber-400', 'text-gray-400', 'text-amber-700']
const demoContributors = [
  { _id: 'demo-zakir', name: 'Zakir Khan', city: 'Rawalpindi', volunteerPoints: 240 },
  { _id: 'demo-ali', name: 'Ali Ahmed', city: 'Islamabad', volunteerPoints: 180 },
  { _id: 'demo-sana', name: 'Sana Malik', city: 'Lahore', volunteerPoints: 145 },
]
const demoImpact = [
  { _id: 'demo-cleanup', title: 'Clean City Campaign', category: 'Environment', impactScore: 92 },
  { _id: 'demo-literacy', title: 'Community Literacy Drive', category: 'Education', impactScore: 84 },
  { _id: 'demo-health', title: 'Health Access Week', category: 'Health', impactScore: 76 },
]

export default function Leaderboard() {
  const [contributors, setContributors] = useState([])
  const [impact, setImpact] = useState([])
  const [tab, setTab] = useState('points')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([UserAPI.leaderboard(), DashboardAPI.impactLeaderboard()])
      .then(([usersResult, impactResult]) => {
        const users = usersResult.status === 'fulfilled' ? usersResult.value.data?.data?.users : []
        const projects = impactResult.status === 'fulfilled' ? impactResult.value.data?.data?.leaderboard : []
        setContributors(Array.isArray(users) ? users : [])
        setImpact(Array.isArray(projects) ? projects : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const liveList = Array.isArray(tab === 'points' ? contributors : impact) ? (tab === 'points' ? contributors : impact) : []
  const list = liveList.length ? liveList : (tab === 'points' ? demoContributors : demoImpact)

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><Trophy className="h-6 w-6 text-amber-500" /> Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-1">Top contributors making the biggest difference.</p>
        </div>

        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          <button onClick={() => setTab('points')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'points' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}>Top Contributors</button>
          <button onClick={() => setTab('impact')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'impact' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}>Impact Score Projects</button>
        </div>

        <div className="card divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {loading && <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>}
          {!loading && liveList.length === 0 && <p className="px-4 pt-4 text-xs font-semibold text-brand-600 dark:text-brand-400">Sample leaderboard preview</p>}
          {!loading && list.map((item, i) => (
            <div key={item._id || i} className="flex items-center gap-4 p-4">
              <div className={`w-8 text-center font-black text-lg ${rankColor[i] || 'text-gray-300'}`}>
                {i < 3 ? <Medal className="h-6 w-6 mx-auto" /> : i + 1}
              </div>
              {tab === 'points' ? (
                <>
                  <img src={imageUrl(item.profilePicture) || `https://ui-avatars.com/api/?background=22a56d&color=fff&name=${encodeURIComponent(item.name)}`} className="h-10 w-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.city}</p>
                  </div>
                  <span className="font-extrabold text-brand-600 dark:text-brand-400">{item.points ?? item.volunteerPoints ?? 0} pts</span>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.category}</p>
                  </div>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400 inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current" /> {item.impactScore ?? 0}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
