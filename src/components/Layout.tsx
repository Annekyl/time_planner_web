import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'

export default function Layout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-20 md:pb-8" key={location.pathname}>
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
