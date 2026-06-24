import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../lib/theme'

import { LayoutDashboard, CheckSquare, Calendar, Target, BarChart3, CalendarDays, LogOut, Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/planner', icon: CalendarDays, label: '每日规划' },
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
      <aside className="hidden md:flex w-64 bg-transparent border-r border-border-subtle dark:border-border-subtle flex-col h-screen fixed left-0 top-0 z-30 transition-colors duration-300">
        <div className="p-6 border-b border-border-subtle dark:border-border-subtle flex items-center justify-between">
          <h1 className="text-xl font-bold font-serif text-brand dark:text-brand">
            时间规划
          </h1>
          <button
            onClick={toggle}
            className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300 text-gray-500 dark:text-text-secondary btn-press"
            title={theme === 'light' ? '切换到夜间模式' : '切换到日间模式'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
                  isActive
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-gray-100'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-bg-secondary dark:bg-bg-secondary rounded-xl border border-black/5 dark:border-white/5"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon size={20} className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                <span className="relative z-10">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border-subtle dark:border-border-subtle">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary dark:text-text-secondary hover:bg-red-50/80 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 w-full transition-all duration-300 btn-press"
          >
            <LogOut size={20} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-bg-page/80 dark:bg-bg-page/80 backdrop-blur-md border-b border-border-subtle dark:border-border-subtle z-30 flex items-center justify-between px-4 transition-colors duration-300">
        <h1 className="text-lg font-bold font-serif text-brand dark:text-brand">时间规划</h1>
        <div className="flex items-center gap-1">
          <button onClick={toggle} className="p-2 rounded-xl text-text-secondary hover:bg-bg-tertiary transition-colors btn-press">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={signOut} className="p-2 rounded-xl text-text-secondary hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors btn-press">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-page dark:bg-bg-page border-t border-border-subtle dark:border-border-subtle z-30 safe-area-pb transition-colors duration-300">
        <div className="flex justify-around items-center h-[68px] px-2 relative">
          {navItems.map(item => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative flex flex-col items-center justify-center w-14 h-full gap-1 transition-all duration-300"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute -top-px w-8 h-1 bg-brand rounded-b-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon 
                  size={22} 
                  className={`transition-all duration-300 ${isActive ? 'text-brand dark:text-brand -translate-y-1 scale-110' : 'text-gray-400 dark:text-gray-500'}`} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'text-brand dark:text-brand opacity-100' : 'text-gray-400 dark:text-gray-500 opacity-70'}`}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
