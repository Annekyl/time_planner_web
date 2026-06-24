import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useTimeBlocks } from '../hooks/useTimeBlocks'
import { useDailyPlans } from '../hooks/useDailyPlans'
import { ChevronLeft, ChevronRight, CalendarDays, List, LayoutGrid, Plus, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'

type ViewMode = 'month' | 'week' | 'day'
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9']

export default function CalendarPage() {
  const { user } = useAuth()
  const { tasks, addTask } = useTasks(user?.id)
  const { timeBlocks, addTimeBlock } = useTimeBlocks(user?.id)
  const { plans } = useDailyPlans(user?.id)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  const [showAddModal, setShowAddModal] = useState<false | 'task' | 'block'>(false)
  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')
  const [formColor, setFormColor] = useState('#6366f1')

  const monthDays = useMemo(() => { const ms = startOfMonth(selectedDate); const me = endOfMonth(selectedDate); return eachDayOfInterval({ start: startOfWeek(ms), end: endOfWeek(me) }) }, [selectedDate])
  const weekDays = useMemo(() => { const ws = startOfWeek(selectedDate); return eachDayOfInterval({ start: ws, end: addDays(ws, 6) }) }, [selectedDate])
  const getEventsForDay = (date: Date) => { const ds = format(date, 'yyyy-MM-dd'); return { tasks: tasks.filter(t => t.due_date === ds), blocks: timeBlocks.filter(b => b.date === ds).sort((a, b) => a.start_time.localeCompare(b.start_time)), plans: plans.filter(p => p.date === ds).sort((a, b) => a.sort_order - b.sort_order) } }
  const getTitle = () => { if (viewMode === 'month') return format(selectedDate, 'yyyy年 M月', { locale: zhCN }); if (viewMode === 'week') { const ws = startOfWeek(selectedDate); const we = addDays(ws, 6); return `${format(ws, 'M月d日')} - ${format(we, 'M月d日')}` }; return format(selectedDate, 'yyyy年 M月d日 EEEE', { locale: zhCN }) }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return
    const ds = format(selectedDate, 'yyyy-MM-dd')
    
    if (showAddModal === 'task') {
      await addTask({ title: formTitle, description: '', priority: 2, status: 'pending', due_date: ds, category_id: null, completed_at: null })
    } else if (showAddModal === 'block') {
      await addTimeBlock({ title: formTitle, date: ds, start_time: formTime, end_time: formEndTime, color: formColor, category_id: null, task_id: null })
    }
    
    setShowAddModal(false)
    setFormTitle('')
    setFormTime('09:00')
    setFormEndTime('10:00')
  }

  const openModal = (type: 'task' | 'block', date?: Date, defaultTime?: string) => {
    if (date) setSelectedDate(date)
    setShowAddModal(type)
    
    if (type === 'block') {
      const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
      setFormColor(randomColor)
    }

    if (defaultTime) {
      setFormTime(defaultTime)
      const [h, m] = defaultTime.split(':')
      const endH = String(Math.min(23, Number(h) + 1)).padStart(2, '0')
      setFormEndTime(`${endH}:${m}`)
    } else {
      setFormTime('09:00')
      setFormEndTime('10:00')
    }
  }

  return (
    <div className="max-w-6xl mx-auto relative">
      <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 gap-3 fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">日历规划</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-2">
            {([ { mode: 'month' as const, icon: LayoutGrid, label: '月' }, { mode: 'week' as const, icon: CalendarDays, label: '周' }, { mode: 'day' as const, icon: List, label: '日' } ]).map(v => (
              <button key={v.mode} onClick={() => setViewMode(v.mode)} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${viewMode === v.mode ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}><v.icon size={14} />{v.label}</button>
            ))}
          </div>
          <button onClick={() => openModal('task')} className="px-3 py-1.5 text-xs md:text-sm bg-indigo-600 text-white rounded-lg flex items-center gap-1 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 btn-press transition-all"><Plus size={16}/> 任务</button>
          <button onClick={() => openModal('block')} className="px-3 py-1.5 text-xs md:text-sm bg-purple-600 text-white rounded-lg flex items-center gap-1 hover:bg-purple-700 shadow-sm shadow-purple-500/20 btn-press transition-all hidden sm:flex"><Plus size={16}/> 时间块</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => { if (viewMode === 'month') setSelectedDate(d => subMonths(d, 1)); else if (viewMode === 'week') setSelectedDate(d => subWeeks(d, 1)); else setSelectedDate(d => subDays(d, 1)) }} className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press text-gray-600 dark:text-gray-400"><ChevronLeft size={18} /></button>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 min-w-[140px] md:min-w-[200px] text-center">{getTitle()}</h2>
          <button onClick={() => { if (viewMode === 'month') setSelectedDate(d => addMonths(d, 1)); else if (viewMode === 'week') setSelectedDate(d => addWeeks(d, 1)); else setSelectedDate(d => addDays(d, 1)) }} className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press text-gray-600 dark:text-gray-400"><ChevronRight size={18} /></button>
        </div>
        <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1.5 text-xs md:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 btn-press">今天</button>
      </div>

      {viewMode === 'month' && <MonthView days={monthDays} currentMonth={selectedDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} getEventsForDay={getEventsForDay} onAddEvent={openModal} />}
      {viewMode === 'week' && <WeekView days={weekDays} selectedDate={selectedDate} onSelectDate={setSelectedDate} getEventsForDay={getEventsForDay} onAddEvent={openModal} />}
      {viewMode === 'day' && <DayView date={selectedDate} events={getEventsForDay(selectedDate)} onAddEvent={openModal} />}

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass w-full max-w-sm rounded-2xl shadow-2xl border border-white/20 p-5 md:p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{showAddModal === 'task' ? '快速添加任务' : '快速添加时间块'}</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-4 bg-indigo-50 dark:bg-indigo-900/30 py-1.5 px-3 rounded-md inline-block">目标日期: {format(selectedDate, 'yyyy年 M月d日')}</p>
              
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">名称</label>
                  <input autoFocus value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder={showAddModal === 'task' ? "例如: 整理周报" : "例如: 深度工作"} className="w-full px-3 py-2 border border-white/20 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" required />
                </div>
                
                {showAddModal === 'block' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">开始</label>
                      <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full px-2 py-2 border border-white/20 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">结束</label>
                      <input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} className="w-full px-2 py-2 border border-white/20 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">颜色</label>
                      <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="w-full h-9 p-1 border border-white/20 bg-white/50 dark:bg-gray-800/50 rounded-xl cursor-pointer" required />
                    </div>
                  </div>
                )}
                
                <button type="submit" className={`w-full py-2.5 rounded-xl text-white font-medium shadow-lg btn-press ${showAddModal === 'task' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'}`}>保存</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MonthView({ days, currentMonth, selectedDate, onSelectDate, getEventsForDay, onAddEvent }: { days: Date[]; currentMonth: Date; selectedDate: Date; onSelectDate: (d: Date) => void; getEventsForDay: (d: Date) => { tasks: any[]; blocks: any[]; plans: any[] }; onAddEvent: (t: 'task'|'block', d: Date, time?: string) => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 md:p-6 fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="grid grid-cols-7 gap-0.5 md:gap-1">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d} className="text-center text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 py-1 md:py-2">{d}</div>)}
        {days.map(day => { const inMonth = isSameMonth(day, currentMonth); const selected = isSameDay(day, selectedDate); const today = isToday(day); const events = getEventsForDay(day); return (
          <div key={day.toISOString()} onClick={() => onSelectDate(day)} onDoubleClick={(e) => { e.stopPropagation(); onAddEvent('task', day); }} className={`relative p-1 md:p-2 min-h-[64px] md:min-h-[96px] rounded-lg text-left transition-all duration-200 cursor-pointer group ${!inMonth ? 'text-gray-300 dark:text-gray-600' : selected ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500 dark:ring-indigo-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs md:text-sm font-medium ${today ? 'bg-indigo-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center' : ''}`}>{format(day, 'd')}</span>
              <button onClick={(e) => { e.stopPropagation(); onAddEvent('task', day) }} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-300 hidden md:block"><Plus size={14} /></button>
            </div>
            <div className="mt-1 space-y-0.5 hidden md:block">{events.blocks.slice(0, 2).map(b => <div key={b.id} className="text-[10px] rounded px-1 truncate text-white" style={{ backgroundColor: b.color }}>{b.title}</div>)}{events.tasks.length > 0 && <div className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded px-1 truncate">{events.tasks.length} 个任务</div>}</div>
            <div className="mt-1 flex flex-wrap gap-1 md:hidden">{events.tasks.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}{events.blocks.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}</div>
          </div>
        )})}
      </div>
    </div>
  )
}

function WeekView({ days, selectedDate, onSelectDate, getEventsForDay, onAddEvent }: { days: Date[]; selectedDate: Date; onSelectDate: (d: Date) => void; getEventsForDay: (d: Date) => { tasks: any[]; blocks: any[]; plans: any[] }; onAddEvent: (t: 'task'|'block', d: Date, time?: string) => void }) {
  const HOUR_HEIGHT = 48
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700">
        <div className="w-12 md:w-16" />
        {days.map(day => { const selected = isSameDay(day, selectedDate); const today = isToday(day); return (
          <div key={day.toISOString()} onClick={() => onSelectDate(day)} onDoubleClick={(e) => { e.stopPropagation(); onAddEvent('block', day); }} className={`group relative py-2 md:py-3 text-center border-l border-gray-100 dark:border-gray-700 transition-all duration-200 cursor-pointer ${selected ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{format(day, 'EEE', { locale: zhCN })}</p>
            <p className={`text-sm md:text-base font-semibold mt-0.5 ${today ? 'bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto' : 'text-gray-800 dark:text-gray-200'}`}>{format(day, 'd')}</p>
            <button onClick={(e) => { e.stopPropagation(); onAddEvent('block', day) }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-300 hidden md:block"><Plus size={12} /></button>
          </div>
        )})}
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-8 relative">
          <div className="w-12 md:w-16">{HOURS.filter(h => h >= 6 && h <= 22).map(hour => <div key={hour} className="h-12 border-b border-gray-50 dark:border-gray-700/50 flex items-start justify-end pr-2 pt-0.5"><span className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500">{String(hour).padStart(2, '0')}:00</span></div>)}</div>
          {days.map(day => { const events = getEventsForDay(day); return (
            <div key={day.toISOString()} className="relative border-l border-gray-100 dark:border-gray-700 cursor-crosshair" onDoubleClick={(e) => { e.stopPropagation(); const y = e.clientY - e.currentTarget.getBoundingClientRect().top; let h = Math.floor(y / 48) + 6; h = Math.max(6, Math.min(22, h)); onAddEvent('block', day, `${String(h).padStart(2, '0')}:00`); }}>
              {HOURS.filter(h => h >= 6 && h <= 22).map(hour => <div key={hour} className="h-12 border-b border-gray-50 dark:border-gray-700/50" />)}
              {events.blocks.map(block => { const [sh, sm] = block.start_time.split(':').map(Number); if (sh < 6 || sh > 22) return null; const top = ((sh - 6) * HOUR_HEIGHT) + ((sm / 60) * HOUR_HEIGHT); const [eh, em] = block.end_time.split(':').map(Number); const height = (((eh * 60 + em) - (sh * 60 + sm)) / 60) * HOUR_HEIGHT; return <div key={block.id} className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[9px] md:text-[10px] text-white overflow-hidden fade-in shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: block.color, top: `${top}px`, height: `${Math.max(height, 20)}px` }}><p className="font-medium truncate">{block.title}</p></div> })}
              {events.tasks.length > 0 && <div className="absolute bottom-1 left-0.5 right-0.5 flex flex-col gap-0.5">{events.tasks.slice(0, 2).map(t => <div key={t.id} className="bg-blue-500 text-white rounded px-1 py-0.5 text-[9px] truncate">{t.title}</div>)}{events.tasks.length > 2 && <div className="text-[9px] text-gray-400 dark:text-gray-500 px-1 font-medium">+{events.tasks.length - 2}</div>}</div>}
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}

function DayView({ date, events, onAddEvent }: { date: Date; events: { tasks: any[]; blocks: any[]; plans: any[] }; onAddEvent: (t: 'task'|'block', d: Date, time?: string) => void }) {
  const HOUR_HEIGHT = 48; const displayHours = HOURS.filter(h => h >= 6 && h <= 22)
  const getBlockStyle = (block: any) => { const [sh, sm] = block.start_time.split(':').map(Number); const [eh, em] = block.end_time.split(':').map(Number); return { top: `${((sh - 6) * HOUR_HEIGHT) + ((sm / 60) * HOUR_HEIGHT)}px`, height: `${Math.max((((eh * 60 + em) - (sh * 60 + sm)) / 60) * HOUR_HEIGHT, 24)}px` } }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="overflow-y-auto max-h-[600px]"><div className="flex relative">
          <div className="w-14 md:w-16 shrink-0">{displayHours.map(hour => <div key={hour} className="h-12 border-b border-gray-50 dark:border-gray-700/50 flex items-start justify-end pr-2 pt-0.5"><span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">{String(hour).padStart(2, '0')}:00</span></div>)}</div>
          <div className="flex-1 relative border-l border-gray-100 dark:border-gray-700 cursor-crosshair" onDoubleClick={(e) => { e.stopPropagation(); const y = e.clientY - e.currentTarget.getBoundingClientRect().top; let h = Math.floor(y / 48) + 6; h = Math.max(6, Math.min(22, h)); onAddEvent('block', date, `${String(h).padStart(2, '0')}:00`); }}>
            {displayHours.map(hour => <div key={hour} className="h-12 border-b border-gray-50 dark:border-gray-700/50" />)}
            {events.blocks.map(block => { const [sh] = block.start_time.split(':').map(Number); if (sh < 6 || sh > 22) return null; return <div key={block.id} className="absolute left-1 right-1 rounded-lg p-2 text-white text-xs md:text-sm overflow-hidden fade-in shadow-md hover:shadow-lg transition-shadow" style={{ ...getBlockStyle(block), backgroundColor: block.color }}><p className="font-medium">{block.title}</p><p className="opacity-80 text-[10px] md:text-xs">{block.start_time} - {block.end_time}</p></div> })}
          </div>
        </div></div>
      </div>
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 fade-in" style={{ animationDelay: '0.15s' }}>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm md:text-base pb-3 border-b border-gray-100 dark:border-gray-700">{format(date, 'M月d日 EEEE', { locale: zhCN })}</h3>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" />时间块 ({events.blocks.length})</h4>
              <button onClick={() => onAddEvent('block', date)} className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 p-1"><Plus size={14} /></button>
            </div>
            {events.blocks.length === 0 ? <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 text-center border border-dashed border-gray-200 dark:border-gray-700">这天空闲着，来规划一下吧</p> : <div className="space-y-2">{events.blocks.map(block => <div key={block.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"><div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: block.color }} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{block.title}</p><p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">{block.start_time} - {block.end_time}</p></div></div>)}</div>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />任务 ({events.tasks.length})</h4>
              <button onClick={() => onAddEvent('task', date)} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 p-1"><Plus size={14} /></button>
            </div>
            {events.tasks.length === 0 ? <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 text-center border border-dashed border-gray-200 dark:border-gray-700">没有必须今天完成的任务</p> : <div className="space-y-2">{events.tasks.map(task => <div key={task.id} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"><p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{task.title}</p></div>)}</div>}
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-3"><span className="w-2 h-2 rounded-full bg-amber-500" />每日规划 ({events.plans.length})</h4>
            {events.plans.length === 0 ? <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 text-center border border-dashed border-gray-200 dark:border-gray-700">没有制定早中晚计划</p> : <div className="space-y-1.5">{events.plans.map(plan => <div key={plan.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex gap-2 items-center"><div className={`w-1.5 h-1.5 rounded-full ${plan.period === 'morning' ? 'bg-amber-400' : plan.period === 'afternoon' ? 'bg-orange-400' : 'bg-indigo-400'}`} /><p className={`text-sm font-medium ${plan.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{plan.content}</p></div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
