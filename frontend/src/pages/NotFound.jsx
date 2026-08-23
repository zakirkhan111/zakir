import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="h-screen grid place-items-center text-center px-4">
      <div>
        <p className="text-7xl font-black text-brand-500">404</p>
        <p className="text-gray-500 mt-2">Page not found.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    </div>
  )
}
