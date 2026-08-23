import React, { useEffect, useState, useRef } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { NotificationAPI } from '../api/client'
import { useSocket } from '../context/SocketContext'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)
  const { liveNotifications } = useSocket()

  const load = () => {
    setLoading(true)
    NotificationAPI.list()
      .then((res) => setItems(res.data?.data?.notifications || res.data?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (liveNotifications.length) load() }, [liveNotifications.length])

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = items.filter((n) => !n.read && !n.isRead).length

  const markAll = async () => { await NotificationAPI.markAllRead(); load() }
  const remove = async (id) => { await NotificationAPI.remove(id); load() }
  const markOne = async (id) => { await NotificationAPI.markRead(id); load() }

  return (
    <div className="relative" ref={ref}>
      <button onClick={async () => {
        const nextOpen = !open
        setOpen(nextOpen)
        if (nextOpen && unread > 0) {
          setItems((current) => current.map((item) => ({ ...item, isRead: true })))
          try { await NotificationAPI.markAllRead() } catch { load() }
        }
      }} className="relative btn-ghost !px-2.5 !py-2.5 rounded-full">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[10px] grid place-items-center rounded-full bg-red-500 text-white font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto card p-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="font-bold text-sm">Notifications</p>
            <button onClick={markAll} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">Mark all read</button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400 px-2 py-4 text-center">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 px-2 py-6 text-center">You're all caught up 🎉</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((n) => (
                <li key={n._id} className={`p-2.5 rounded-lg text-sm flex items-start justify-between gap-2 ${!(n.read || n.isRead) ? 'bg-brand-50/60 dark:bg-brand-950/30' : ''}`}>
                  <div>
                    <p className="font-medium leading-snug">{n.message || n.title}</p>
                    {n.createdAt && <p className="text-[11px] text-gray-400 mt-0.5">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!(n.read || n.isRead) && (
                      <button onClick={() => markOne(n._id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Mark read"><Check className="h-3.5 w-3.5" /></button>
                    )}
                    <button onClick={() => remove(n._id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
