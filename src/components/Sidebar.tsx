import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, CheckSquare, Calendar, Target, Clock, BarChart3, LogOut } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/tasks', icon: CheckSquare, label: '任务' },
  { to: '/calendar', icon: Calendar, label: '日历' },
  { to: '/goals', icon: Target, label: '目标' },
  { to: '/timeblocks', icon: Clock, label: '时间块' },
  { to: '/stats', icon: BarChart3, label: '统计' },
]

export default function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-indigo-600">时间规划</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition"
        >
          <LogOut size={20} />
          退出登录
        </button>
      </div>
    </aside>
  )
}
