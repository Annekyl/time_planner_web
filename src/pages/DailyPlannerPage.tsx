import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { useTasks } from '../hooks/useTasks'
import { useTimeBlocks } from '../hooks/useTimeBlocks'
import type { TimeBlock } from '../types'
import { Sun, CloudSun, Moon, Plus, Trash2, Check, ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion, type Variants, AnimatePresence } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

type Period = 'morning' | 'afternoon' | 'evening'
interface PeriodDef {
  key: Period
  label: string
  sub: string
  icon: any
  color: string
  bg: string
  darkBg: string
}

const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9']

export default function DailyPlannerPage() {
  const { user } = useAuth()
  const { settings } = useSettings(user?.id)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { tasks } = useTasks(user?.id, { incompleteOnly: true })
  const { timeBlocks, addTimeBlock, toggleTimeBlock, deleteTimeBlock } = useTimeBlocks(user?.id, { startDate: dateStr, endDate: dateStr })
  const [showTaskPicker, setShowTaskPicker] = useState<{ period: Period } | null>(null)
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState<Period | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')
  const [formColor, setFormColor] = useState('#6366f1')
  const [formTaskId, setFormTaskId] = useState<string | null>(null)
  const [formRecurrence, setFormRecurrence] = useState<{ type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom', interval: number, unit: 'days' | 'weeks' | 'months' }>({ type: 'none', interval: 1, unit: 'days' })

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 50


  const morningStart = settings.morning_start
  const morningEnd = settings.morning_end
  const afternoonStart = settings.afternoon_start
  const afternoonEnd = settings.afternoon_end
  const eveningStart = settings.evening_start
  const eveningEnd = settings.evening_end

  const PERIODS: PeriodDef[] = useMemo(() => [
    { key: 'morning' as Period, label: '上午', sub: `${morningStart} - ${morningEnd}`, icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50/50', darkBg: 'dark:bg-amber-900/20' },
    { key: 'afternoon' as Period, label: '下午', sub: `${afternoonStart} - ${afternoonEnd}`, icon: CloudSun, color: 'text-orange-500', bg: 'bg-orange-50/50', darkBg: 'dark:bg-orange-900/20' },
    { key: 'evening' as Period, label: '晚上', sub: `${eveningStart} - ${eveningEnd}`, icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50/50', darkBg: 'dark:bg-indigo-900/20' },
  ], [morningStart, morningEnd, afternoonStart, afternoonEnd, eveningStart, eveningEnd])

  const timeBlocksByPeriod = useMemo(() => {
    const grouped: Record<Period, TimeBlock[]> = { morning: [], afternoon: [], evening: [] }
    timeBlocks.filter(b => b.date === dateStr).forEach(b => {
      const time = b.start_time
      if (time >= morningStart && time < morningEnd) grouped.morning.push(b)
      else if (time >= afternoonStart && time < afternoonEnd) grouped.afternoon.push(b)
      else if (time >= eveningStart && time <= eveningEnd) grouped.evening.push(b)
    })
    return grouped
  }, [timeBlocks, dateStr, morningStart, morningEnd, afternoonStart, afternoonEnd, eveningStart, eveningEnd])

  const openModal = (period: Period, defaultTitle = '', defaultTaskId: string | null = null) => {
    setShowAddModal(period)
    setFormTitle(defaultTitle)
    setFormTaskId(defaultTaskId)
    setFormColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)])
    setFormRecurrence({ type: 'none', interval: 1, unit: 'days' })
    
    if (period === 'morning') { setFormTime(morningStart); setFormEndTime(String(parseInt(morningStart)+1).padStart(2, '0') + ':00') }
    else if (period === 'afternoon') { setFormTime(afternoonStart); setFormEndTime(String(parseInt(afternoonStart)+1).padStart(2, '0') + ':00') }
    else { setFormTime(eveningStart); setFormEndTime(String(parseInt(eveningStart)+1).padStart(2, '0') + ':00') }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return
    const recurrence_rule = formRecurrence.type === 'none' ? null : { type: formRecurrence.type, interval: formRecurrence.type === 'custom' ? formRecurrence.interval : undefined, unit: formRecurrence.type === 'custom' ? formRecurrence.unit : undefined }
    await addTimeBlock({
      title: formTitle,
      date: dateStr,
      start_time: formTime,
      end_time: formEndTime,
      color: formColor,
      category_id: null,
      task_id: formTaskId,
      completed: false,
      recurrence_rule
    })
    setShowAddModal(null)
    setFormTitle('')
    setFormTaskId(null)
  }

  const handleAddFromTask = (period: Period, taskId: string) => { 
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      openModal(period, task.title, task.id)
    }
    setShowTaskPicker(null) 
  }

  const completedCount = timeBlocks.filter(b => b.date === dateStr && b.completed).length
  const totalCount = timeBlocks.filter(b => b.date === dateStr).length

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      setSelectedDate(d => addDays(d, 1))
    } else if (isRightSwipe) {
      setSelectedDate(d => subDays(d, 1))
    }
  }

  return (
    <motion.div 
      className="max-w-3xl mx-auto relative"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndEvent}
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold font-serif text-text-primary">每日规划</h1>
        {isToday(selectedDate) && <span className="text-xs bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-brand px-3 py-1 rounded-full font-bold shadow-none">今天</span>}
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6 glass p-2 rounded-2xl">
        <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="p-3 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 btn-press text-gray-600 dark:text-gray-400"><ChevronLeft size={20} /></button>
        <div className="text-center">
          <p className="font-bold font-serif text-text-primary text-base md:text-lg">{format(selectedDate, 'yyyy年M月d日 EEEE', { locale: zhCN })}</p>
          <button onClick={() => setSelectedDate(new Date())} className="text-xs font-medium text-brand dark:text-brand hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mt-0.5">回到今天</button>
        </div>
        <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="p-3 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 btn-press text-gray-600 dark:text-gray-400"><ChevronRight size={20} /></button>
      </motion.div>

      {totalCount > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2"><span className="font-semibold text-text-secondary">规划完成度</span><span className="font-bold text-brand dark:text-brand">{completedCount}/{totalCount}</span></div>
          <div className="w-full bg-bg-secondary rounded-full h-3 overflow-hidden shadow-inner border border-white/20"><motion.div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} transition={{ duration: 1, ease: 'easeOut' }} /></div>
        </motion.div>
      )}

      <motion.div className="space-y-5" variants={containerVariants}>
        {PERIODS.map((period) => (
          <PeriodSection 
            key={period.key} 
            period={period} 
            timeBlocks={timeBlocksByPeriod[period.key]} 
            onAdd={() => openModal(period.key)} 
            onToggle={toggleTimeBlock} 
            onDelete={deleteTimeBlock} 
            onAddFromTask={() => setShowTaskPicker({ period: period.key })} 
          />
        ))}
      </motion.div>

      {showTaskPicker && <TaskPickerModal tasks={tasks.filter(t => t.status !== 'completed')} onSelect={(taskId) => handleAddFromTask(showTaskPicker.period, taskId)} onClose={() => setShowTaskPicker(null)} />}

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 pt-20 md:pt-4 bg-black/20 backdrop-blur-sm" onClick={() => setShowAddModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass w-full max-w-sm p-5 md:p-6 relative max-h-[85dvh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowAddModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"><X size={20} /></button>
              <h3 className="text-lg font-bold font-serif text-text-primary mb-4">添加时间块规划</h3>
              
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">规划名称</label>
                  <input autoFocus value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="例如: 深度工作" className="w-full px-3 py-2 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" required />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">开始时间</label>
                    <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full px-2 py-2 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">结束时间</label>
                    <input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} className="w-full px-2 py-2 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">标签颜色</label>
                    <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="w-full h-9 p-0.5 border border-border-default bg-transparent rounded-lg cursor-pointer" required />
                  </div>
                </div>
                
                <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">重复设置</label>
                    <select value={formRecurrence.type} onChange={e => setFormRecurrence(p => ({ ...p, type: e.target.value as any }))} className="w-full px-2 py-2 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm">
                      <option value="none">不重复</option>
                      <option value="daily">每天</option>
                      <option value="weekly">每周</option>
                      <option value="monthly">每月</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>
                  {formRecurrence.type === 'custom' && (
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-gray-500">每</span>
                      <input type="number" min="1" value={formRecurrence.interval} onChange={e => setFormRecurrence(p => ({ ...p, interval: Number(e.target.value) }))} className="w-16 px-2 py-1.5 border border-border-default bg-transparent text-text-primary rounded-lg text-sm outline-none focus:border-brand" />
                      <select value={formRecurrence.unit} onChange={e => setFormRecurrence(p => ({ ...p, unit: e.target.value as any }))} className="w-20 px-2 py-1.5 border border-border-default bg-transparent text-text-primary rounded-lg text-sm outline-none focus:border-brand">
                        <option value="days">天</option>
                        <option value="weeks">周</option>
                        <option value="months">月</option>
                      </select>
                    </div>
                  )}
                </div>
                
                <button type="submit" className="w-full py-2.5 rounded-lg text-bg-primary font-medium btn-press bg-text-primary dark:bg-bg-primary">保存规划</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function PeriodSection({ period, timeBlocks, onAdd, onToggle, onDelete, onAddFromTask }: {
  period: PeriodDef; timeBlocks: TimeBlock[]; onAdd: () => void; onToggle: (id: string, completed: boolean) => void; onDelete: (id: string) => void; onAddFromTask: () => void
}) {
  const Icon = period.icon
  const completedCount = timeBlocks.filter(i => i.completed).length

  return (
    <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden shadow-none hover:border-[#D6D3CD] dark:hover:border-[#4A4844] transition-shadow duration-300">
      <div className={`flex items-center justify-between p-4 ${period.bg} ${period.darkBg} border-b border-black/5 dark:border-white/5`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-white/60 dark:bg-gray-800/60 shadow-none flex items-center justify-center`}><Icon size={24} className={period.color} /></div>
          <div><h3 className="font-bold font-serif text-text-primary text-base md:text-lg">{period.label}</h3><p className="text-[10px] md:text-xs font-medium text-text-secondary">{period.sub}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {timeBlocks.length > 0 && <span className="text-[11px] md:text-xs font-bold text-gray-400 dark:text-gray-500 mr-2 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full">{completedCount}/{timeBlocks.length}</span>}
          <button onClick={onAddFromTask} className="p-2 text-text-secondary hover:text-brand dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 btn-press shadow-none" title="从任务添加"><CalendarDays size={18} /></button>
          <button onClick={onAdd} className="p-2 text-text-secondary hover:text-brand dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 btn-press shadow-none" title="添加规划"><Plus size={18} /></button>
        </div>
      </div>
      <div className="p-4 md:p-5 relative min-h-[80px]">
        {timeBlocks.length === 0 && (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500 flex flex-col justify-center pointer-events-none">
            <p className="text-sm font-medium">暂无规划安排</p>
            <p className="text-xs mt-1">点击右上角 + 添加</p>
          </div>
        )}

        {timeBlocks.length > 0 && (
          <div className="space-y-2">
            {timeBlocks.map(block => (
              <div key={block.id} className={`flex items-center gap-3 p-3 rounded-xl border border-white/10 transition-all duration-300 group ${block.completed ? 'bg-white/30 dark:bg-gray-800/30 opacity-60' : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:gray-700 shadow-none hover:shadow-sm'}`}>
                <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: block.color || '#D97756' }} />
                
                <button onClick={() => onToggle(block.id, !block.completed)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 checkbox-bounce ${block.completed ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-300 dark:border-gray-500 hover:border-indigo-500'}`}>
                  {block.completed && <Check size={12} className="text-white" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate transition-colors ${block.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-text-primary hover:text-brand dark:hover:text-indigo-400'}`}>{block.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] md:text-xs text-text-secondary">{block.start_time} - {block.end_time}</p>
                    {block.recurrence_rule && <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-bg-tertiary text-text-secondary">🔁 重复</span>}
                  </div>
                </div>

                {block.task_id && <span className="text-[10px] font-bold text-indigo-500 dark:text-brand bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md shrink-0">任务</span>}
                
                <button onClick={() => onDelete(block.id)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 btn-press"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function TaskPickerModal({ tasks, onSelect, onClose }: { tasks: any[]; onSelect: (taskId: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-start md:items-center justify-center p-4 pt-20 md:pt-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-2xl shadow-2xl w-full max-w-md max-h-[85dvh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-black/5 dark:border-white/5">
          <h3 className="font-bold text-text-primary mb-4 text-lg">选择任务转化为规划</h3>
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索任务..." className="w-full px-4 py-2 border border-white/20 bg-bg-secondary text-text-primary rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-colors" />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? <p className="text-center text-text-secondary text-sm py-10 font-medium">无可用任务</p> : (
            filtered.map(task => <button key={task.id} onClick={() => onSelect(task.id)} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-200 truncate">{task.title}</button>)
          )}
        </div>
        <div className="p-4 border-t border-black/5 dark:border-white/5"><button onClick={onClose} className="w-full py-2.5 bg-white/50 dark:bg-gray-700/50 rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors btn-press border border-white/10">取消</button></div>
      </motion.div>
    </motion.div>
  )
}
