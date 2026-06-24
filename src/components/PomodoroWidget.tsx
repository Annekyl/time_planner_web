import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer, Minimize2, CloudRain, Coffee, Waves, VolumeX, GripHorizontal, Settings } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'

type Mode = 'work' | 'shortBreak' | 'longBreak'
type Sound = 'none' | 'rain' | 'cafe' | 'ocean'

const DEFAULT_TIMES = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
}

const AMBIENT_SOUNDS: { id: Sound; icon: any; url: string; label: string }[] = [
  { id: 'none', icon: VolumeX, url: '', label: '静音' },
  { id: 'rain', icon: CloudRain, url: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg', label: '下雨天' },
  { id: 'cafe', icon: Coffee, url: 'https://actions.google.com/sounds/v1/crowds/cafe_restaurant_chatter.ogg', label: '咖啡馆' },
  { id: 'ocean', icon: Waves, url: 'https://actions.google.com/sounds/v1/water/ocean_waves.ogg', label: '海浪' }
]

export default function PomodoroWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [modeTimes, setModeTimes] = useState(() => {
    const saved = localStorage.getItem('pomodoro_times')
    return saved ? JSON.parse(saved) : DEFAULT_TIMES
  })
  const [mode, setMode] = useState<Mode>('work')
  const [timeLeft, setTimeLeft] = useState(modeTimes.work)
  const [isActive, setIsActive] = useState(false)
  const [sound, setSound] = useState<Sound>('none')
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => {
    const savedPos = localStorage.getItem('pomodoro_pos')
    if (savedPos) {
      try {
        const { x: savedX, y: savedY } = JSON.parse(savedPos)
        x.set(savedX)
        y.set(savedY)
      } catch (e) {
        console.error('Failed to parse pomodoro position', e)
      }
    }
  }, [x, y])

  const handleDragEnd = () => {
    localStorage.setItem('pomodoro_pos', JSON.stringify({ x: x.get(), y: y.get() }))
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev: number) => prev - 1)
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
      setTimeLeft(modeTimes[mode])
    }
  }, [mode, isActive, modeTimes])

  const saveSettings = (newTimes: typeof modeTimes) => {
    setModeTimes(newTimes)
    localStorage.setItem('pomodoro_times', JSON.stringify(newTimes))
    if (!isActive) setTimeLeft(newTimes[mode])
  }

  useEffect(() => {
    if (audioRef.current) {
      if (isActive && sound !== 'none') {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }, [isActive, sound])

  const toggleTimer = () => setIsActive(!isActive)
  const resetTimer = () => { setIsActive(false); setTimeLeft(modeTimes[mode]) }
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progress = ((modeTimes[mode] - timeLeft) / modeTimes[mode]) * 100
  const activeSound = AMBIENT_SOUNDS.find(s => s.id === sound)

  return (
    <motion.div 
      className="fixed bottom-6 right-6 z-50 touch-none flex flex-col items-end"
      drag
      dragMomentum={false}
      style={{ x, y }}
      onDragEnd={handleDragEnd}
    >
      {activeSound?.url && <audio ref={audioRef} src={activeSound.url} loop />}
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 text-white rounded-full shadow-none flex items-center justify-center btn-press relative cursor-grab active:cursor-grabbing"
          >
            <Timer size={20} className="md:w-6 md:h-6" />
            {isActive && (
              <span className="absolute top-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
            )}
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-xl border-white/20 w-64 md:w-72 origin-bottom-right cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-sm md:text-base pointer-events-none">
                <GripHorizontal size={16} className="text-gray-400" /> 专注模式
              </h3>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings) }} 
                  className={`transition-colors p-1.5 rounded-lg ${showSettings ? 'text-brand bg-brand/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  onPointerDownCapture={e => e.stopPropagation()}
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false) }} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  onPointerDownCapture={e => e.stopPropagation()}
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>
            
            {showSettings ? (
              <div className="space-y-3 mb-4" onPointerDownCapture={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">工作 (分钟)</span>
                  <input type="number" min="1" max="120" value={Math.round(modeTimes.work / 60)} onChange={e => saveSettings({...modeTimes, work: Number(e.target.value) * 60})} className="w-16 px-2 py-1 text-xs border border-border-default rounded bg-bg-secondary outline-none focus:border-brand" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">短休 (分钟)</span>
                  <input type="number" min="1" max="60" value={Math.round(modeTimes.shortBreak / 60)} onChange={e => saveSettings({...modeTimes, shortBreak: Number(e.target.value) * 60})} className="w-16 px-2 py-1 text-xs border border-border-default rounded bg-bg-secondary outline-none focus:border-brand" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">长休 (分钟)</span>
                  <input type="number" min="1" max="60" value={Math.round(modeTimes.longBreak / 60)} onChange={e => saveSettings({...modeTimes, longBreak: Number(e.target.value) * 60})} className="w-16 px-2 py-1 text-xs border border-border-default rounded bg-bg-secondary outline-none focus:border-brand" />
                </div>
              </div>
            ) : (
              <>
                <div 
                  className="flex bg-white/40 dark:bg-gray-800/40 rounded-xl p-1 mb-3 md:mb-4"
                  onPointerDownCapture={e => e.stopPropagation()}
                >
                  <button onClick={() => { setMode('work'); setIsActive(false); setTimeLeft(modeTimes.work) }} className={`flex-1 py-1 md:py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'work' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>工作</button>
                  <button onClick={() => { setMode('shortBreak'); setIsActive(false); setTimeLeft(modeTimes.shortBreak) }} className={`flex-1 py-1 md:py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'shortBreak' ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>短休</button>
                  <button onClick={() => { setMode('longBreak'); setIsActive(false); setTimeLeft(modeTimes.longBreak) }} className={`flex-1 py-1 md:py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'longBreak' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>长休</button>
                </div>

                <div 
                  className="flex items-center justify-center gap-1 md:gap-2 mb-4 md:mb-6"
                  onPointerDownCapture={e => e.stopPropagation()}
                >
                  {AMBIENT_SOUNDS.map(s => {
                    const Icon = s.icon;
                    const isSelected = sound === s.id;
                    return (
                      <button key={s.id} onClick={() => setSound(s.id)} title={s.label} className={`p-1.5 md:p-2 rounded-xl transition-all btn-press ${isSelected ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        <Icon size={14} className="md:w-4 md:h-4" />
                      </button>
                    )
                  })}
                </div>

                <div className="text-center mb-5 md:mb-6 relative pointer-events-none">
                   <div className="text-4xl md:text-5xl font-black text-gray-800 dark:text-gray-100 font-mono tracking-tight">{formatTime(timeLeft)}</div>
                   <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full mt-4 md:mt-5 overflow-hidden"><motion.div className={`h-full ${mode==='work' ? 'bg-indigo-500' : mode==='shortBreak' ? 'bg-green-500' : 'bg-purple-500'}`} initial={{width: 0}} animate={{width: `${progress}%`}} transition={{duration: 1, ease: 'linear'}} /></div>
                </div>

                <div 
                  className="flex items-center justify-center gap-3"
                  onPointerDownCapture={e => e.stopPropagation()}
                >
                  <button onClick={resetTimer} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/50 dark:bg-gray-700/50 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 shadow-sm transition-all btn-press"><RotateCcw size={16} className="md:w-[18px] md:h-[18px]" /></button>
                  <button onClick={toggleTimer} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-none transition-all btn-press ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{isActive ? <Pause size={20} className="md:w-6 md:h-6" fill="currentColor" /> : <Play size={20} className="ml-1 md:w-6 md:h-6" fill="currentColor" />}</button>
                </div>
              </>
            )}


          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
