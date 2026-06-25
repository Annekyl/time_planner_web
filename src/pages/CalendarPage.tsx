import React, { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { useTasks } from '../hooks/useTasks'
import { useTimeBlocks } from '../hooks/useTimeBlocks'

import { ChevronLeft, ChevronRight, CalendarDays, List, LayoutGrid, Plus, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import CustomTimePicker from '../components/CustomTimePicker'
import CustomColorPicker from '../components/CustomColorPicker'

type ViewMode = 'month' | 'week' | 'day'
const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9']

export default function CalendarPage() {
  const { user } = useAuth()
  const { settings } = useSettings(user?.id)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const dateRange = useMemo(() => {
    const start = format(startOfWeek(startOfMonth(selectedDate)), 'yyyy-MM-dd')
    const end = format(endOfWeek(endOfMonth(selectedDate)), 'yyyy-MM-dd')
    return { startDate: start, endDate: end }
  }, [selectedDate])

  const { tasks, addTask } = useTasks(user?.id, dateRange)
  const { timeBlocks, addTimeBlock, updateTimeBlock } = useTimeBlocks(user?.id, dateRange)
  
  const [showAddModal, setShowAddModal] = useState<'task' | 'block' | 'edit_block' | false>(false)
  const defaultDuration = Number(localStorage.getItem('default_block_duration') || 60)
  const addMins = (t: string, m: number) => { const [h, min] = t.split(':').map(Number); const tot = h*60 + min + m; return `${String(Math.min(23, Math.floor(tot/60))).padStart(2, '0')}:${String(tot%60).padStart(2, '0')}` }

  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('09:30')
  const [formColor, setFormColor] = useState('#6366f1')
  const [editingBlock, setEditingBlock] = useState<any>(null)

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 50

  const timeIntervals = useMemo(() => {
    const intervals: string[] = []
    const timeToMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const minsToTime = (m: number) => `${String(Math.min(23, Math.floor(m/60))).padStart(2, '0')}:${String(m%60).padStart(2, '0')}`
    
    const addIntervals = (startStr: string, endStr: string) => {
      let current = timeToMins(startStr)
      const end = timeToMins(endStr)
      while (current < end) {
        if (!intervals.includes(minsToTime(current))) {
          intervals.push(minsToTime(current))
        }
        current += defaultDuration
      }
    }
    addIntervals(settings.morning_start, settings.morning_end)
    addIntervals(settings.afternoon_start, settings.afternoon_end)
    addIntervals(settings.evening_start, settings.evening_end)
    
    return intervals
  }, [settings.morning_start, settings.morning_end, settings.afternoon_start, settings.afternoon_end, settings.evening_start, settings.evening_end, defaultDuration])

  const monthDays = useMemo(() => { const ms = startOfMonth(selectedDate); const me = endOfMonth(selectedDate); return eachDayOfInterval({ start: startOfWeek(ms), end: endOfWeek(me) }) }, [selectedDate])
  const weekDays = useMemo(() => { const ws = startOfWeek(selectedDate); return eachDayOfInterval({ start: ws, end: addDays(ws, 6) }) }, [selectedDate])
  const getEventsForDay = (date: Date) => { const ds = format(date, 'yyyy-MM-dd'); return { tasks: tasks.filter(t => t.due_date === ds), blocks: timeBlocks.filter(b => b.date === ds).sort((a, b) => a.start_time.localeCompare(b.start_time)) } }
  const getTitle = () => { if (viewMode === 'month') return format(selectedDate, 'yyyy年 M月', { locale: zhCN }); if (viewMode === 'week') { const ws = startOfWeek(selectedDate); const we = addDays(ws, 6); return `${format(ws, 'M月d日')} - ${format(we, 'M月d日')}` }; return format(selectedDate, 'yyyy年 M月d日 EEEE', { locale: zhCN }) }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return
    const ds = format(selectedDate, 'yyyy-MM-dd')
    
    if (showAddModal === 'task') {
      await addTask({ title: formTitle, description: '', priority: 2, status: 'pending', due_date: ds, category_id: null, completed_at: null })
    } else if (showAddModal === 'block') {
      await addTimeBlock({ title: formTitle, date: ds, start_time: formTime, end_time: formEndTime, color: formColor, category_id: null, task_id: null, completed: false })
    } else if (showAddModal === 'edit_block' && editingBlock) {
      await updateTimeBlock(editingBlock.id, { title: formTitle, start_time: formTime, end_time: formEndTime, color: formColor })
    }
    
    setShowAddModal(false)
    setFormTitle('')
    setFormTime('09:00')
    setFormEndTime(addMins('09:00', defaultDuration))
    setEditingBlock(null)
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
      setFormEndTime(addMins(defaultTime, defaultDuration))
    } else {
      setFormTime('09:00')
      setFormEndTime(addMins('09:00', defaultDuration))
    }
  }

  const openEditModal = (block: any) => {
    setEditingBlock(block)
    setFormTitle(block.title)
    setFormTime(block.start_time)
    setFormEndTime(block.end_time)
    setFormColor(block.color)
    setShowAddModal('edit_block')
  }

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
      if (viewMode === 'month') setSelectedDate(d => addMonths(d, 1))
      else if (viewMode === 'week') setSelectedDate(d => addWeeks(d, 1))
      else setSelectedDate(d => addDays(d, 1))
    } else if (isRightSwipe) {
      if (viewMode === 'month') setSelectedDate(d => subMonths(d, 1))
      else if (viewMode === 'week') setSelectedDate(d => subWeeks(d, 1))
      else setSelectedDate(d => subDays(d, 1))
    }
  }

  return (
    <div className="max-w-6xl mx-auto relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndEvent}>
      <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 gap-3 fade-in">
        <h1 className="text-xl md:text-2xl font-bold font-serif text-text-primary">日历规划</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-bg-secondary rounded-lg p-1 mr-2 border border-border-subtle">
            {([ { mode: 'month' as const, icon: LayoutGrid, label: '月' }, { mode: 'week' as const, icon: CalendarDays, label: '周' }, { mode: 'day' as const, icon: List, label: '日' } ]).map(v => (
              <button key={v.mode} onClick={() => setViewMode(v.mode)} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${viewMode === v.mode ? 'bg-white dark:bg-[#383633] text-text-primary border border-border-default' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-transparent'}`}><v.icon size={14} />{v.label}</button>
            ))}
          </div>
          <button onClick={() => openModal('task')} className="px-3 py-1.5 text-xs md:text-sm bg-brand hover:bg-brand-hover text-white rounded-lg flex items-center gap-1 hover:opacity-90 btn-press transition-all"><Plus size={16}/> 任务</button>
          <button onClick={() => openModal('block')} className="px-3 py-1.5 text-xs md:text-sm bg-white dark:bg-[#2A2927] border border-border-default text-text-primary rounded-lg flex items-center gap-1 hover:bg-bg-tertiary btn-press transition-all hidden sm:flex"><Plus size={16}/> 时间块</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => { if (viewMode === 'month') setSelectedDate(d => subMonths(d, 1)); else if (viewMode === 'week') setSelectedDate(d => subWeeks(d, 1)); else setSelectedDate(d => subDays(d, 1)) }} className="p-1.5 md:p-2 hover:bg-bg-tertiary rounded-lg transition-all duration-200 btn-press text-text-primary"><ChevronLeft size={18} /></button>
          <h2 className="text-base md:text-lg font-semibold font-serif text-text-primary min-w-[140px] md:min-w-[200px] text-center">{getTitle()}</h2>
          <button onClick={() => { if (viewMode === 'month') setSelectedDate(d => addMonths(d, 1)); else if (viewMode === 'week') setSelectedDate(d => addWeeks(d, 1)); else setSelectedDate(d => addDays(d, 1)) }} className="p-1.5 md:p-2 hover:bg-bg-tertiary rounded-lg transition-all duration-200 btn-press text-text-primary"><ChevronRight size={18} /></button>
        </div>
        <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1.5 text-xs md:text-sm border border-border-default text-text-primary rounded-lg hover:bg-bg-tertiary transition-all duration-200 btn-press">今天</button>
      </div>

      {viewMode === 'month' && <MonthView days={monthDays} currentMonth={selectedDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} getEventsForDay={getEventsForDay} onAddEvent={openModal} />}
      {viewMode === 'week' && <WeekView days={weekDays} selectedDate={selectedDate} onSelectDate={setSelectedDate} getEventsForDay={getEventsForDay} onAddEvent={openModal} onEditEvent={openEditModal} timeIntervals={timeIntervals} hourHeight={80} defaultDuration={defaultDuration} settings={settings} />}
      {viewMode === 'day' && <DayView date={selectedDate} events={getEventsForDay(selectedDate)} onAddEvent={openModal} onEditEvent={openEditModal} timeIntervals={timeIntervals} hourHeight={80} defaultDuration={defaultDuration} settings={settings} />}

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-20 md:pt-4 bg-black/20 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass w-full max-w-md p-5 md:p-6 relative max-h-[85dvh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"><X size={20} /></button>
              <h3 className="text-lg font-bold font-serif text-text-primary mb-4">{showAddModal === 'task' ? '添加任务' : showAddModal === 'edit_block' ? '编辑时间块' : '添加时间块'}</h3>
              
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">名称</label>
                  <input autoFocus value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder={showAddModal === 'task' ? "例如: 整理周报" : "例如: 深度工作"} className="w-full px-3 py-2 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-indigo-500 outline-none text-sm" required />
                </div>
                
                {(showAddModal === 'block' || showAddModal === 'edit_block') && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">开始时间</label>
                      <CustomTimePicker value={formTime} onChange={val => { setFormTime(val); setFormEndTime(addMins(val, defaultDuration)) }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">结束时间</label>
                      <CustomTimePicker value={formEndTime} onChange={val => setFormEndTime(val)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">标签颜色</label>
                      <CustomColorPicker value={formColor} onChange={val => setFormColor(val)} className="w-full h-9" />
                    </div>
                  </div>
                )}
                
                <button type="submit" className="w-full py-2.5 rounded-lg text-bg-primary font-medium btn-press bg-text-primary dark:bg-bg-primary">保存</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MonthView({ days, currentMonth, selectedDate, onSelectDate, getEventsForDay, onAddEvent }: { days: Date[]; currentMonth: Date; selectedDate: Date; onSelectDate: (d: Date) => void; getEventsForDay: (d: Date) => { tasks: any[]; blocks: any[] }; onAddEvent: (t: 'task'|'block', d: Date, time?: string) => void }) {
  return (
    <div className="glass p-3 md:p-6 fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d} className="text-center text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 py-2 bg-white dark:bg-[#1A1918]">{d}</div>)}
        {days.map(day => { const inMonth = isSameMonth(day, currentMonth); const selected = isSameDay(day, selectedDate); const today = isToday(day); const events = getEventsForDay(day); return (
          <div key={day.toISOString()} onClick={() => onSelectDate(day)} onDoubleClick={(e) => { e.stopPropagation(); onAddEvent('task', day); }} className={`relative p-1 md:p-2 min-h-[80px] md:min-h-[100px] text-left transition-all duration-200 cursor-pointer group bg-white dark:bg-[#1A1918] ${!inMonth ? 'bg-gray-50/50 dark:bg-[#22201F] opacity-40 grayscale-[50%]' : selected ? 'ring-2 ring-inset ring-brand bg-indigo-50/30 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-[#2A2927]'}`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs md:text-sm font-bold ${today ? 'bg-brand text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center' : !inMonth ? 'text-gray-400 dark:text-gray-500' : 'text-text-primary'}`}>{format(day, 'd')}</span>
              <button onClick={(e) => { e.stopPropagation(); onAddEvent('task', day) }} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-300 hidden md:block"><Plus size={14} /></button>
            </div>
            <div className="mt-1 space-y-0.5 hidden md:block">{events.blocks.slice(0, 2).map(b => <div key={b.id} className={`text-[10px] rounded px-1 truncate ${b.completed ? 'opacity-60 line-through' : ''} text-white font-medium`} style={{ backgroundColor: b.color }}>{b.title}</div>)}{events.tasks.length > 0 && <div className="text-[10px] border border-border-default text-text-secondary font-medium rounded px-1 truncate bg-bg-tertiary/50">{events.tasks.length} 个任务</div>}</div>
            <div className="mt-1 flex flex-wrap gap-1 md:hidden">{events.tasks.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />}{events.blocks.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />}</div>
          </div>
        )})}
      </div>
    </div>
  )
}

function WeekView({ days, selectedDate, onSelectDate, getEventsForDay, onAddEvent, onEditEvent, timeIntervals, hourHeight, defaultDuration, settings }: { days: Date[]; selectedDate: Date; onSelectDate: (d: Date) => void; getEventsForDay: (d: Date) => { tasks: any[]; blocks: any[] }; onAddEvent: (t: 'task'|'block', d: Date, time?: string) => void; onEditEvent: (block: any) => void; timeIntervals: string[]; hourHeight: number; defaultDuration: number; settings: any }) {
  const [activeCell, setActiveCell] = useState<{ day: string, interval: string } | null>(null)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  
  const timeToMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const minsToTime = (mins: number) => `${Math.floor(mins/60).toString().padStart(2, '0')}:${(mins%60).toString().padStart(2, '0')}`
  const gapHeight = 32;

  const getIntervalEnd = (idx: number) => {
    const iStart = timeToMins(timeIntervals[idx]);
    let validEnds: number[] = [];
    const checkPeriod = (startStr: string, endStr: string) => {
      if (!startStr || !endStr) return;
      const s = timeToMins(startStr);
      const e = timeToMins(endStr);
      if (iStart >= s && iStart < e) validEnds.push(e);
    };
    checkPeriod(settings?.morning_start, settings?.morning_end);
    checkPeriod(settings?.afternoon_start, settings?.afternoon_end);
    checkPeriod(settings?.evening_start, settings?.evening_end);
    
    const maxPeriodEnd = validEnds.length > 0 ? Math.max(...validEnds) : iStart + defaultDuration;
    const nextStart = idx < timeIntervals.length - 1 ? timeToMins(timeIntervals[idx+1]) : Infinity;
    return Math.min(iStart + defaultDuration, maxPeriodEnd, nextStart);
  };

  const getTopPixel = (targetMins: number) => {
    if (timeIntervals.length === 0) return 0;
    const firstStart = timeToMins(timeIntervals[0]);
    if (targetMins < firstStart) return ((targetMins - firstStart) / defaultDuration) * hourHeight;
    
    let top = 0;
    for (let i = 0; i < timeIntervals.length; i++) {
      const iStart = timeToMins(timeIntervals[i]);
      const iEnd = getIntervalEnd(i);
      const cellHeight = ((iEnd - iStart) / defaultDuration) * hourHeight;
      
      if (i > 0) {
        const prevEnd = getIntervalEnd(i - 1);
        if (iStart > prevEnd) {
          top += gapHeight;
        }
      }
      
      if (targetMins >= iStart && targetMins <= iEnd) {
        return top + ((targetMins - iStart) / (iEnd - iStart)) * cellHeight;
      }
      
      if (i < timeIntervals.length - 1) {
        const nextStart = timeToMins(timeIntervals[i+1]);
        if (targetMins > iEnd && targetMins < nextStart) {
          const fraction = (targetMins - iEnd) / (nextStart - iEnd);
          return top + cellHeight + fraction * gapHeight;
        }
      }
      
      top += cellHeight;
    }
    
    const lastEnd = getIntervalEnd(timeIntervals.length - 1);
    return top + ((targetMins - lastEnd) / defaultDuration) * hourHeight;
  };

  const getBlockStyle = (block: any) => {
    if (!timeIntervals.length) return { display: 'none' };
    const startMins = timeToMins(block.start_time);
    const endMins = timeToMins(block.end_time);
    
    const startTop = getTopPixel(startMins);
    const endTop = getTopPixel(endMins);
    const height = endTop - startTop;
    
    return { top: `${startTop}px`, height: `${Math.max(height, 20)}px` };
  }

  return (
    <div className="glass overflow-hidden fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="relative">
        <div className="sticky top-0 z-20 grid grid-cols-[3rem_repeat(7,1fr)] md:grid-cols-[4rem_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700/50 bg-white/95 dark:bg-[#1A1918]/95 backdrop-blur-md shadow-sm">
          <div className="w-12 md:w-16" />
          {days.map(day => { const selected = isSameDay(day, selectedDate); const today = isToday(day); return (
            <div key={day.toISOString()} onClick={() => onSelectDate(day)} onDoubleClick={(e) => { e.stopPropagation(); onAddEvent('block', day); }} className={`group relative py-2 md:py-3 text-center border-l border-gray-200 dark:border-gray-700/50 transition-all duration-200 cursor-pointer ${selected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-[#2A2927]'}`}>
              <p className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400">{format(day, 'EEE', { locale: zhCN })}</p>
              <p className={`text-sm md:text-base font-bold mt-0.5 ${today ? 'bg-brand hover:bg-brand-hover text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto' : 'text-text-primary'}`}>{format(day, 'd')}</p>
              <button onClick={(e) => { e.stopPropagation(); onAddEvent('block', day) }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-300 hidden md:block"><Plus size={12} /></button>
            </div>
          )})}
        </div>
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] md:grid-cols-[4rem_repeat(7,1fr)] relative bg-white dark:bg-[#1A1918]">
          <div className="flex flex-col border-r border-border-subtle bg-bg-secondary/50">
            {timeIntervals.map((interval, idx) => {
              const iStart = timeToMins(interval);
              const iEnd = getIntervalEnd(idx);
              const cellHeight = ((iEnd - iStart) / defaultDuration) * hourHeight;
              const isGap = idx > 0 && iStart > getIntervalEnd(idx - 1);
              const isLastInPeriod = idx === timeIntervals.length - 1 || timeToMins(timeIntervals[idx+1]) > iEnd;
              
              return (
                <React.Fragment key={`sidebar-${interval}`}>
                  {isGap && <div style={{ height: `${gapHeight}px` }} className="bg-bg-tertiary border-t border-b border-border-default/50" />}
                  <div className="relative" style={{ height: `${cellHeight}px` }}>
                    <span className="absolute right-2 text-[11px] md:text-xs text-text-secondary px-1 bg-bg-secondary/50 z-10" style={{ top: idx === 0 ? '0px' : '-10px' }}>
                      {interval}
                    </span>
                    {isLastInPeriod && (
                      <span className="absolute right-2 text-[11px] md:text-xs text-text-secondary px-1 bg-bg-secondary/50 z-10" style={{ bottom: '-10px' }}>
                        {minsToTime(iEnd)}
                      </span>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>
          {days.map(day => { const events = getEventsForDay(day); return (
            <div key={day.toISOString()} className="relative border-l border-gray-200 dark:border-gray-700/50 cursor-pointer">
              <div className="absolute inset-0 pointer-events-none flex flex-col">
                {timeIntervals.map((interval, idx) => {
                  const iStart = timeToMins(interval);
                  const iEnd = getIntervalEnd(idx);
                  const cellHeight = ((iEnd - iStart) / defaultDuration) * hourHeight;
                  const isGap = idx > 0 && iStart > getIntervalEnd(idx - 1);
                  return (
                    <React.Fragment key={`${interval}-grid-${idx}`}>
                      {isGap && <div style={{ height: `${gapHeight}px` }} className="w-full shrink-0 border-t border-b border-border-default/50 bg-bg-tertiary/30" />}
                      <div className="w-full shrink-0 border-t border-border-subtle" style={{ height: `${cellHeight}px` }} />
                    </React.Fragment>
                  )
                })}
              </div>
              <div className="relative w-full h-full flex flex-col z-0">
                {timeIntervals.map((interval, idx) => {
                  const isActive = activeCell?.day === day.toISOString() && activeCell?.interval === interval;
                  const iStart = timeToMins(interval);
                  const iEnd = getIntervalEnd(idx);
                  const cellHeight = ((iEnd - iStart) / defaultDuration) * hourHeight;
                  const isGap = idx > 0 && iStart > getIntervalEnd(idx - 1);
                  return (
                    <React.Fragment key={`${interval}-drop-${idx}`}>
                      {isGap && (
                        <div className="w-full shrink-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ height: `${gapHeight}px` }}>
                          <div className="flex items-center gap-1.5 opacity-30">
                            <div className="w-3 md:w-6 h-px bg-gray-500"></div>
                            <span className="text-[8px] text-gray-600 font-bold tracking-widest uppercase">REST</span>
                            <div className="w-3 md:w-6 h-px bg-gray-500"></div>
                          </div>
                        </div>
                      )}
                      <div 
                        className={`relative shrink-0 transition-colors ${isActive ? 'bg-brand/10 dark:bg-brand/20' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} 
                        style={{ height: `${cellHeight}px` }}
                        onClick={() => {
                          if (isActive) {
                            onAddEvent('block', day, interval);
                            setActiveCell(null);
                          } else {
                            setActiveCell({ day: day.toISOString(), interval });
                          }
                        }}
                      >
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Plus className="text-brand opacity-80" size={24} />
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  )
                })}
              </div>
              {events.blocks.map(block => { 
                const style = getBlockStyle(block);
                if (style.display === 'none') return null;
                const isSelected = activeEventId === block.id;
                return (
                  <div 
                    key={block.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        onEditEvent(block);
                        setActiveEventId(null);
                      } else {
                        setActiveEventId(block.id);
                        setActiveCell(null);
                      }
                    }} 
                    className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[9px] md:text-[10px] text-white overflow-hidden fade-in shadow-sm cursor-pointer hover:z-10 transition-all ${block.completed ? 'opacity-60 line-through' : ''} ${isSelected ? 'ring-2 ring-white ring-inset shadow-md scale-[1.02] z-20' : ''}`} 
                    style={{ ...style, backgroundColor: block.color }}
                  >
                    <p className="font-medium truncate">{block.title}</p>
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="opacity-90 font-bold tracking-widest uppercase drop-shadow-md">+</span>
                      </div>
                    )}
                  </div>
                )
              })}
              {events.tasks.length > 0 && <div className="absolute bottom-1 left-0.5 right-0.5 flex flex-col gap-0.5 pointer-events-none">{events.tasks.slice(0, 2).map(t => <div key={t.id} className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded px-1 py-0.5 text-[9px] truncate">{t.title}</div>)}{events.tasks.length > 2 && <div className="text-[9px] text-gray-400 dark:text-gray-500 px-1 font-medium">+{events.tasks.length - 2}</div>}</div>}
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}

function DayView({ date, events, onAddEvent, onEditEvent, timeIntervals, hourHeight, defaultDuration, settings }: { date: Date; events: { tasks: any[]; blocks: any[] }; onAddEvent: (t: 'task'|'block', d: Date, time?: string) => void; onEditEvent: (block: any) => void; timeIntervals: string[]; hourHeight: number; defaultDuration: number; settings: any }) {
  const timeToMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const minsToTime = (mins: number) => `${Math.floor(mins/60).toString().padStart(2, '0')}:${(mins%60).toString().padStart(2, '0')}`
  const gapHeight = 32;
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  const getIntervalEnd = (idx: number) => {
    const iStart = timeToMins(timeIntervals[idx]);
    let validEnds: number[] = [];
    const checkPeriod = (startStr: string, endStr: string) => {
      if (!startStr || !endStr) return;
      const s = timeToMins(startStr);
      const e = timeToMins(endStr);
      if (iStart >= s && iStart < e) validEnds.push(e);
    };
    checkPeriod(settings?.morning_start, settings?.morning_end);
    checkPeriod(settings?.afternoon_start, settings?.afternoon_end);
    checkPeriod(settings?.evening_start, settings?.evening_end);
    
    const maxPeriodEnd = validEnds.length > 0 ? Math.max(...validEnds) : iStart + defaultDuration;
    const nextStart = idx < timeIntervals.length - 1 ? timeToMins(timeIntervals[idx+1]) : Infinity;
    return Math.min(iStart + defaultDuration, maxPeriodEnd, nextStart);
  };

  const getTopPixel = (targetMins: number) => {
    if (timeIntervals.length === 0) return 0;
    const firstStart = timeToMins(timeIntervals[0]);
    if (targetMins < firstStart) return ((targetMins - firstStart) / defaultDuration) * hourHeight;
    
    let top = 0;
    for (let i = 0; i < timeIntervals.length; i++) {
      const iStart = timeToMins(timeIntervals[i]);
      const iEnd = getIntervalEnd(i);
      const cellHeight = ((iEnd - iStart) / defaultDuration) * hourHeight;
      
      if (i > 0) {
        const prevEnd = getIntervalEnd(i - 1);
        if (iStart > prevEnd) {
          top += gapHeight;
        }
      }
      
      if (targetMins >= iStart && targetMins <= iEnd) {
        return top + ((targetMins - iStart) / (iEnd - iStart)) * cellHeight;
      }
      
      if (i < timeIntervals.length - 1) {
        const nextStart = timeToMins(timeIntervals[i+1]);
        if (targetMins > iEnd && targetMins < nextStart) {
          const fraction = (targetMins - iEnd) / (nextStart - iEnd);
          return top + cellHeight + fraction * gapHeight;
        }
      }
      
      top += cellHeight;
    }
    
    const lastEnd = getIntervalEnd(timeIntervals.length - 1);
    return top + ((targetMins - lastEnd) / defaultDuration) * hourHeight;
  };

  const getBlockStyle = (block: any) => {
    if (!timeIntervals.length) return { display: 'none' };
    const startMins = timeToMins(block.start_time);
    const endMins = timeToMins(block.end_time);
    
    const startTop = getTopPixel(startMins);
    const endTop = getTopPixel(endMins);
    const height = endTop - startTop;
    
    return { top: `${startTop}px`, height: `${Math.max(height, 24)}px` };
  }
  
  const [activeCell, setActiveCell] = useState<{ day: string, interval: string } | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="md:col-span-2 glass overflow-hidden fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="relative"><div className="flex relative">
          <div className="flex flex-col w-12 md:w-16 shrink-0 border-r border-border-subtle bg-bg-secondary/50">
            {timeIntervals.map((interval, idx) => {
              const iStart = timeToMins(interval);
              const iEnd = getIntervalEnd(idx);
              const cellHeight = ((iEnd - iStart) / defaultDuration) * hourHeight;
              const isGap = idx > 0 && iStart > getIntervalEnd(idx - 1);
              const isLastInPeriod = idx === timeIntervals.length - 1 || timeToMins(timeIntervals[idx+1]) > iEnd;
              return (
                <React.Fragment key={`sidebar-${interval}`}>
                  {isGap && <div style={{ height: `${gapHeight}px` }} className="bg-bg-tertiary border-t border-b border-border-default/50" />}
                  <div className="relative" style={{ height: `${cellHeight}px` }}>
                    <span className="absolute right-2 text-[11px] md:text-xs text-text-secondary px-1 bg-bg-secondary/50 z-10" style={{ top: idx === 0 ? '0px' : '-10px' }}>
                      {interval}
                    </span>
                    {isLastInPeriod && (
                      <span className="absolute right-2 text-[11px] md:text-xs text-text-secondary px-1 bg-bg-secondary/50 z-10" style={{ bottom: '-10px' }}>
                        {minsToTime(iEnd)}
                      </span>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>
          <div className="flex-1 relative border-l border-border-subtle cursor-pointer">
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              {timeIntervals.map((interval, idx) => {
                const iStart = timeToMins(interval);
                const iEnd = getIntervalEnd(idx);
                const cellHeight = ((iEnd - iStart) / defaultDuration) * hourHeight;
                const isGap = idx > 0 && iStart > getIntervalEnd(idx - 1);
                return (
                  <React.Fragment key={`grid-${interval}`}>
                    {isGap && <div style={{ height: `${gapHeight}px` }} className="w-full shrink-0 border-t border-b border-border-default/50 bg-bg-tertiary/30" />}
                    <div className="w-full shrink-0 border-t border-border-subtle" style={{ height: `${cellHeight}px` }} />
                  </React.Fragment>
                )
              })}
            </div>
            <div className="relative w-full h-full flex flex-col">
              {timeIntervals.map((interval, idx) => {
                const isActive = activeCell?.day === date.toISOString() && activeCell?.interval === interval;
                const iStart = timeToMins(interval);
                const iEnd = getIntervalEnd(idx);
                const cellHeight = ((iEnd - iStart) / defaultDuration) * hourHeight;
                const isGap = idx > 0 && iStart > getIntervalEnd(idx - 1);
                return (
                  <React.Fragment key={`drop-${interval}`}>
                    {isGap && (
                      <div className="w-full shrink-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ height: `${gapHeight}px` }}>
                        <div className="flex items-center gap-1.5 opacity-30">
                          <div className="w-3 md:w-6 h-px bg-gray-500"></div>
                          <span className="text-[8px] text-gray-600 font-bold tracking-widest uppercase">REST</span>
                          <div className="w-3 md:w-6 h-px bg-gray-500"></div>
                        </div>
                      </div>
                    )}
                    <div 
                      className={`relative shrink-0 transition-colors ${isActive ? 'bg-brand/10 dark:bg-brand/20' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} 
                      style={{ height: `${cellHeight}px` }}
                      onClick={() => {
                        if (isActive) {
                          onAddEvent('block', date, interval);
                          setActiveCell(null);
                        } else {
                          setActiveCell({ day: date.toISOString(), interval });
                        }
                      }}
                    >
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Plus className="text-brand opacity-80" size={24} />
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                  )
                })}
              </div>
              {events.blocks.map(block => { 
                const style = getBlockStyle(block);
                if (style.display === 'none') return null;
                const isSelected = activeEventId === block.id;
                return (
                  <div 
                    key={block.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        onEditEvent(block);
                        setActiveEventId(null);
                      } else {
                        setActiveEventId(block.id);
                        setActiveCell(null);
                      }
                    }} 
                    className={`absolute left-1 right-1 rounded-lg p-2 text-white text-xs md:text-sm overflow-hidden fade-in shadow-sm cursor-pointer hover:z-10 transition-all ${block.completed ? 'opacity-60 line-through' : ''} ${isSelected ? 'ring-2 ring-white ring-inset shadow-md scale-[1.02] z-20' : ''}`} 
                    style={{ ...style, backgroundColor: block.color }}
                  >
                    <p className="font-medium">{block.title}</p>
                    <p className="opacity-80 text-[10px] md:text-xs">{block.start_time} - {block.end_time}</p>
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="opacity-90 font-bold tracking-widest uppercase drop-shadow-md">+</span>
                      </div>
                    )}
                  </div> 
                )
            })}
          </div>
        </div></div>
      </div>
      <div className="space-y-4">
        <div className="glass p-4 md:p-6 fade-in" style={{ animationDelay: '0.15s' }}>
          <h3 className="font-semibold font-serif text-text-primary mb-4 text-sm md:text-base pb-3 border-b border-border-subtle">{format(date, 'M月d日 EEEE', { locale: zhCN })}</h3>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />时间块 ({events.blocks.length})</h4>
              <button onClick={() => onAddEvent('block', date)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"><Plus size={14} /></button>
            </div>
            {events.blocks.length === 0 ? <p className="text-xs text-gray-400 dark:text-gray-500 bg-bg-tertiary rounded-lg p-3 text-center border border-dashed border-border-default">这天空闲着，来规划一下吧</p> : <div className="space-y-2">{events.blocks.map(block => <div key={block.id} className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary transition-all duration-200 hover:bg-[#EBEAE5] dark:hover:bg-[#383633]"><div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: block.color }} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-text-primary truncate">{block.title}</p><p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">{block.start_time} - {block.end_time}</p></div></div>)}</div>}
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />任务 ({events.tasks.length})</h4>
              <button onClick={() => onAddEvent('task', date)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"><Plus size={14} /></button>
            </div>
            {events.tasks.length === 0 ? <p className="text-xs text-gray-400 dark:text-gray-500 bg-bg-tertiary rounded-lg p-3 text-center border border-dashed border-border-default">没有必须今天完成的任务</p> : <div className="space-y-2">{events.tasks.map(task => <div key={task.id} draggable onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'task', id: task.id })) }} className="p-2.5 rounded-lg bg-bg-tertiary transition-all duration-200 hover:bg-[#EBEAE5] dark:hover:bg-[#383633] border border-transparent hover:border-[#D6D3CD] dark:hover:border-[#4A4844] cursor-grab active:cursor-grabbing"><p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-text-primary'}`}>{task.title}</p></div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
