import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [liveNotifications, setLiveNotifications] = useState([])

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setConnected(false)
      return
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined
    const token = localStorage.getItem('ih_token')
    const socket = io(SOCKET_URL, {
      auth: { token, userId: user._id || user.id },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // Backend may emit a generic 'notification' event with the created doc
    socket.on('notification', (payload) => {
      setLiveNotifications((prev) => [payload, ...prev].slice(0, 50))
      toast(payload?.message || 'New notification', { icon: '🔔' })
    })

    socket.on('notification:new', (payload) => {
      setLiveNotifications((prev) => [payload, ...prev].slice(0, 50))
      toast(payload?.message || 'New notification')
    })
    socket.on('new-project', (payload) => {
      setLiveNotifications((prev) => [payload, ...prev].slice(0, 50))
      toast(payload?.message || 'A new campaign has been posted!')
    })

    if (user._id || user.id) {
      socket.emit('join', user._id || user.id)
    }

    return () => socket.disconnect()
  }, [user?._id, user?.id])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, liveNotifications, setLiveNotifications }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
