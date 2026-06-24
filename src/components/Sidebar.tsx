import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, CheckSquare, Calendar, Target, Clock, BarChart3, ListChecks, LogOut } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/todos', icon: ListChecks, label: '待办' },
  { to: '/tasks', icon: CheckSquare, label: '任务' },
  { to: '/calendar', icon: Calendar, label: '日历' },
  { to: '/goals', icon: Target, label: '目标' },
  { to: '/timeblocks', icon: Clock, label: '时间块' },
  { to: '/stats', icon: BarChart3, label: '统计' },
]

export default function Sidebar() {
  const { signOut } = useAuth()
  const location = useLocation()

  return (
    <>
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-screen fixed left-0 top-0 z-30">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-600">时间规划</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-indigo-600 rounded-r-full" />
                )}
                <item.icon size={20} className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-all duration-200 btn-press"
          >
            <LogOut size={20} />
            退出登录
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200/60 z-30 safe-area-pb">
        <div className="flex justify-around items-center h-16 px-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all duration-200 min-w-0 ${
                  isActive ? 'text-indigo-600 scale-105' : 'text-gray-400 active:scale-95'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
