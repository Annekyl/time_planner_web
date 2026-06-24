import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import PomodoroWidget from './PomodoroWidget'
import CommandPalette from './CommandPalette'

export default function Layout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen transition-colors duration-300 bg-bg-page">
      <Sidebar />
      <div className="flex-1 md:ml-64 relative min-h-screen">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-4 pt-20 md:pt-8 md:p-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
      <PomodoroWidget />
      <CommandPalette />
    </div>
  )
}
