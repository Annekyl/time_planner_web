import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, ListTodo, Target, Clock, BarChart3, LayoutDashboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ACTIONS = [
  { id: 'dashboard', title: '仪表盘', icon: LayoutDashboard, path: '/' },
  { id: 'todos', title: '简单待办', icon: ListTodo, path: '/todos' },
  { id: 'daily', title: '每日规划', icon: Calendar, path: '/daily' },
  { id: 'tasks', title: '任务管理', icon: ListTodo, path: '/tasks' },
  { id: 'goals', title: '目标管理', icon: Target, path: '/goals' },
  { id: 'timeblocks', title: '时间块规划', icon: Clock, path: '/timeblocks' },
  { id: 'stats', title: '数据统计', icon: BarChart3, path: '/stats' }
]

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        setSearch('')
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setSelectedIndex(0)
    }
  }, [isOpen])

  const filteredActions = ACTIONS.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % filteredActions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => (i - 1 + filteredActions.length) % filteredActions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredActions[selectedIndex]) {
          navigate(filteredActions[selectedIndex].path)
          setIsOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredActions, selectedIndex, navigate])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101] px-4"
          >
            <div className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                <Search className="text-gray-400 mr-3" size={20} />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索页面或操作..." 
                  className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-lg font-medium"
                />
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-[10px] text-gray-500 border border-gray-200 dark:border-gray-700 font-mono shadow-sm font-bold">ESC</kbd>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                {filteredActions.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 font-medium">未找到结果</div>
                ) : (
                  filteredActions.map((action, i) => {
                    const active = i === selectedIndex
                    return (
                      <button
                        key={action.id}
                        onMouseEnter={() => setSelectedIndex(i)}
                        onClick={() => { navigate(action.path); setIsOpen(false); }}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-left ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
                      >
                        <action.icon size={18} className={`mr-3 ${active ? 'text-white' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">{action.title}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
