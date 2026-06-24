import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../lib/theme'
import { LayoutDashboard, CheckSquare, Calendar, Target, BarChart3, ListChecks, CalendarDays, LogOut, Sun, Moon } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/planner', icon: CalendarDays, label: '每日规划' },
  { to: '/todos', icon: ListChecks, label: '待办' },
  { to: '/tasks', icon: CheckSquare, label: '任务' },
  { to: '/calendar', icon: Calendar, label: '日历' },
  { to: '/goals', icon: Target, label: '目标' },
  { to: '/stats', icon: BarChart3, label: '统计' },
]

export default function Sidebar() {
  const { signOut } = useAuth()
  const location = useLocation()
  const { theme, toggle } = useTheme()

  return (
    <>
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col h-screen fixed left-0 top-0 z-30 transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">时间规划</h1>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-gray-500 dark:text-gray-400 btn-press"
            title={theme === 'light' ? '切换到夜间模式' : '切换到日间模式'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
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
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
                )}
                <item.icon size={20} className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200 w-full transition-all duration-200 btn-press"
          >
            <LogOut size={20} />
            退出登录
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200/60 dark:border-gray-700/60 z-30 safe-area-pb transition-colors">
        <div className="flex justify-around items-center h-16 px-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all duration-200 min-w-0 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400 scale-105' : 'text-gray-400 dark:text-gray-500 active:scale-95'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </NavLink>
            )
          })}
          <button
            onClick={toggle}
            className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-gray-400 dark:text-gray-500 active:scale-95 transition-all duration-200"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="text-[10px] font-medium">{theme === 'light' ? '夜间' : '日间'}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
