import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}
