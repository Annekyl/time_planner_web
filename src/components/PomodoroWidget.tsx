import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Timer, Minimize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Mode = 'work' | 'shortBreak' | 'longBreak'

const MODE_TIMES = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
}

export default function PomodoroWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('work')
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES.work)
  const [isActive, setIsActive] = useState(false)
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      if (mode === 'work') setMode('shortBreak')
      else setMode('work')
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, mode])

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(MODE_TIMES[mode])
    }
  }, [mode, isActive])

  const toggleTimer = () => setIsActive(!isActive)
  const resetTimer = () => { setIsActive(false); setTimeLeft(MODE_TIMES[mode]) }
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progress = ((MODE_TIMES[mode] - timeLeft) / MODE_TIMES[mode]) * 100

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center btn-press relative"
          >
            <Timer size={24} />
            {isActive && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass rounded-3xl p-5 shadow-xl border-white/20 w-72 origin-bottom-right"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Timer size={18} className="text-indigo-500" />专注模式</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"><Minimize2 size={16} /></button>
            </div>
            
            <div className="flex bg-white/40 dark:bg-gray-800/40 rounded-xl p-1 mb-6">
              <button onClick={() => { setMode('work'); setIsActive(false); setTimeLeft(MODE_TIMES.work) }} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'work' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>工作</button>
              <button onClick={() => { setMode('shortBreak'); setIsActive(false); setTimeLeft(MODE_TIMES.shortBreak) }} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'shortBreak' ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>短休</button>
              <button onClick={() => { setMode('longBreak'); setIsActive(false); setTimeLeft(MODE_TIMES.longBreak) }} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'longBreak' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>长休</button>
            </div>

            <div className="text-center mb-6 relative">
               <div className="text-5xl font-black text-gray-800 dark:text-gray-100 font-mono tracking-tight">{formatTime(timeLeft)}</div>
               <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full mt-5 overflow-hidden"><motion.div className={`h-full ${mode==='work' ? 'bg-indigo-500' : mode==='shortBreak' ? 'bg-green-500' : 'bg-purple-500'}`} initial={{width: 0}} animate={{width: `${progress}%`}} transition={{duration: 1, ease: 'linear'}} /></div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={resetTimer} className="w-10 h-10 rounded-full bg-white/50 dark:bg-gray-700/50 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 shadow-sm transition-all btn-press"><RotateCcw size={18} /></button>
              <button onClick={toggleTimer} className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transition-all btn-press ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
