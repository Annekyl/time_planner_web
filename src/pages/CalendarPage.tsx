import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useTimeBlocks } from '../hooks/useTimeBlocks'
import { ChevronLeft, ChevronRight, CalendarDays, List, LayoutGrid } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays, isToday
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

type ViewMode = 'month' | 'week' | 'day'
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function CalendarPage() {
  const { user } = useAuth()
  const { tasks } = useTasks(user?.id)
  const { timeBlocks } = useTimeBlocks(user?.id)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [selectedDate])

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate)
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
  }, [selectedDate])

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayTasks = tasks.filter(t => t.due_date === dateStr)
    const dayBlocks = timeBlocks.filter(b => b.date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time))
    return { tasks: dayTasks, blocks: dayBlocks }
  }

  const navigatePrev = () => {
    if (viewMode === 'month') setSelectedDate(d => subMonths(d, 1))
    else if (viewMode === 'week') setSelectedDate(d => subWeeks(d, 1))
    else setSelectedDate(d => subDays(d, 1))
  }

  const navigateNext = () => {
    if (viewMode === 'month') setSelectedDate(d => addMonths(d, 1))
    else if (viewMode === 'week') setSelectedDate(d => addWeeks(d, 1))
    else setSelectedDate(d => addDays(d, 1))
  }

  const goToToday = () => setSelectedDate(new Date())

  const getTitle = () => {
    if (viewMode === 'month') return format(selectedDate, 'yyyy年 M月', { locale: zhCN })
    if (viewMode === 'week') {
      const ws = startOfWeek(selectedDate)
      const we = addDays(ws, 6)
      return `${format(ws, 'M月d日')} - ${format(we, 'M月d日')}`
    }
    return format(selectedDate, 'yyyy年 M月d日 EEEE', { locale: zhCN })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6 fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">日历</h1>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {([
            { mode: 'month' as const, icon: LayoutGrid, label: '月' },
            { mode: 'week' as const, icon: CalendarDays, label: '周' },
            { mode: 'day' as const, icon: List, label: '日' },
          ]).map(v => (
            <button
              key={v.mode}
              onClick={() => setViewMode(v.mode)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                viewMode === v.mode
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <v.icon size={14} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={navigatePrev} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 btn-press">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 min-w-[140px] md:min-w-[200px] text-center">{getTitle()}</h2>
          <button onClick={navigateNext} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 btn-press">
            <ChevronRight size={18} />
          </button>
        </div>
        <button onClick={goToToday} className="px-3 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 btn-press">
          今天
        </button>
      </div>

      {viewMode === 'month' && (
        <MonthView
          days={monthDays}
          currentMonth={selectedDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          getEventsForDay={getEventsForDay}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          days={weekDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          getEventsForDay={getEventsForDay}
        />
      )}

      {viewMode === 'day' && (
        <DayView
          date={selectedDate}
          events={getEventsForDay(selectedDate)}
        />
      )}
    </div>
  )
}

function MonthView({ days, currentMonth, selectedDate, onSelectDate, getEventsForDay }: {
  days: Date[]
  currentMonth: Date
  selectedDate: Date
  onSelectDate: (d: Date) => void
  getEventsForDay: (d: Date) => { tasks: any[]; blocks: any[] }
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-6 fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="grid grid-cols-7 gap-0.5 md:gap-1">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => (
          <div key={d} className="text-center text-[10px] md:text-xs font-medium text-gray-500 py-1 md:py-2">{d}</div>
        ))}
        {days.map(day => {
          const inMonth = isSameMonth(day, currentMonth)
          const selected = isSameDay(day, selectedDate)
          const today = isToday(day)
          const events = getEventsForDay(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`relative p-1 md:p-2 min-h-[48px] md:min-h-[80px] rounded-lg text-left transition-all duration-200 ${
                !inMonth ? 'text-gray-300' :
                selected ? 'bg-indigo-50 ring-2 ring-indigo-500' :
                'hover:bg-gray-50'
              }`}
            >
              <span className={`text-xs md:text-sm ${today ? 'bg-indigo-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center' : ''}`}>
                {format(day, 'd')}
              </span>
              <div className="mt-0.5 space-y-0.5 hidden md:block">
                {events.blocks.slice(0, 2).map(b => (
                  <div key={b.id} className="text-[10px] rounded px-1 truncate text-white" style={{ backgroundColor: b.color }}>
                    {b.title}
                  </div>
                ))}
                {events.tasks.length > 0 && (
                  <div className="text-[10px] bg-blue-100 text-blue-700 rounded px-1 truncate">
                    {events.tasks.length} 个任务
                  </div>
                )}
              </div>
              <div className="mt-0.5 flex gap-0.5 md:hidden">
                {events.tasks.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                {events.blocks.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ days, selectedDate, onSelectDate, getEventsForDay }: {
  days: Date[]
  selectedDate: Date
  onSelectDate: (d: Date) => void
  getEventsForDay: (d: Date) => { tasks: any[]; blocks: any[] }
}) {
  const HOUR_HEIGHT = 48

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="grid grid-cols-8 border-b border-gray-100">
        <div className="w-12 md:w-16" />
        {days.map(day => {
          const selected = isSameDay(day, selectedDate)
          const today = isToday(day)
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`py-2 md:py-3 text-center border-l border-gray-100 transition-all duration-200 ${
                selected ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <p className="text-[10px] md:text-xs text-gray-500">{format(day, 'EEE', { locale: zhCN })}</p>
              <p className={`text-sm md:text-base font-semibold mt-0.5 ${today ? 'bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto' : 'text-gray-800'}`}>
                {format(day, 'd')}
              </p>
            </button>
          )
        })}
      </div>

      <div className="overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-8 relative">
          <div className="w-12 md:w-16">
            {HOURS.filter(h => h >= 6 && h <= 22).map(hour => (
              <div key={hour} className="h-12 border-b border-gray-50 flex items-start justify-end pr-2 pt-0.5">
                <span className="text-[9px] md:text-[10px] text-gray-400">{String(hour).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {days.map(day => {
            const events = getEventsForDay(day)
            return (
              <div key={day.toISOString()} className="relative border-l border-gray-100">
                {HOURS.filter(h => h >= 6 && h <= 22).map(hour => (
                  <div key={hour} className="h-12 border-b border-gray-50" />
                ))}
                {events.blocks.map(block => {
                  const [sh, sm] = block.start_time.split(':').map(Number)
                  if (sh < 6 || sh > 22) return null
                  const top = ((sh - 6) * HOUR_HEIGHT) + ((sm / 60) * HOUR_HEIGHT)
                  const [eh, em] = block.end_time.split(':').map(Number)
                  const height = (((eh * 60 + em) - (sh * 60 + sm)) / 60) * HOUR_HEIGHT
                  return (
                    <div
                      key={block.id}
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[9px] md:text-[10px] text-white overflow-hidden fade-in"
                      style={{ backgroundColor: block.color, top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                    >
                      <p className="font-medium truncate">{block.title}</p>
                    </div>
                  )
                })}
                {events.tasks.length > 0 && (
                  <div className="absolute bottom-1 left-0.5 right-0.5">
                    {events.tasks.slice(0, 1).map(t => (
                      <div key={t.id} className="bg-blue-500 text-white rounded px-1 py-0.5 text-[9px] truncate">
                        {t.title}
                      </div>
                    ))}
                    {events.tasks.length > 1 && (
                      <div className="text-[9px] text-gray-400 px-1">+{events.tasks.length - 1}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DayView({ date, events }: {
  date: Date
  events: { tasks: any[]; blocks: any[] }
}) {
  const HOUR_HEIGHT = 48
  const displayHours = HOURS.filter(h => h >= 6 && h <= 22)

  const getBlockStyle = (block: any) => {
    const [sh, sm] = block.start_time.split(':').map(Number)
    const [eh, em] = block.end_time.split(':').map(Number)
    const top = ((sh - 6) * HOUR_HEIGHT) + ((sm / 60) * HOUR_HEIGHT)
    const height = (((eh * 60 + em) - (sh * 60 + sm)) / 60) * HOUR_HEIGHT
    return { top: `${top}px`, height: `${Math.max(height, 24)}px` }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="overflow-y-auto max-h-[600px]">
          <div className="flex relative">
            <div className="w-14 md:w-16 shrink-0">
              {displayHours.map(hour => (
                <div key={hour} className="h-12 border-b border-gray-50 flex items-start justify-end pr-2 pt-0.5">
                  <span className="text-[10px] md:text-xs text-gray-400">{String(hour).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            <div className="flex-1 relative border-l border-gray-100">
              {displayHours.map(hour => (
                <div key={hour} className="h-12 border-b border-gray-50" />
              ))}
              {events.blocks.map(block => {
                const [sh] = block.start_time.split(':').map(Number)
                if (sh < 6 || sh > 22) return null
                return (
                  <div
                    key={block.id}
                    className="absolute left-1 right-1 rounded-lg p-2 text-white text-xs md:text-sm overflow-hidden fade-in"
                    style={{ ...getBlockStyle(block), backgroundColor: block.color }}
                  >
                    <p className="font-medium">{block.title}</p>
                    <p className="opacity-80 text-[10px] md:text-xs">{block.start_time} - {block.end_time}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 fade-in" style={{ animationDelay: '0.15s' }}>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">
            {format(date, 'M月d日 EEEE', { locale: zhCN })}
          </h3>

          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              时间块 ({events.blocks.length})
            </h4>
            {events.blocks.length === 0 ? (
              <p className="text-xs text-gray-400">无时间块</p>
            ) : (
              <div className="space-y-1.5">
                {events.blocks.map(block => (
                  <div key={block.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 transition-all duration-200 hover:bg-gray-100">
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: block.color }} />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 truncate">{block.title}</p>
                      <p className="text-[10px] md:text-xs text-gray-400">{block.start_time} - {block.end_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              任务 ({events.tasks.length})
            </h4>
            {events.tasks.length === 0 ? (
              <p className="text-xs text-gray-400">无任务</p>
            ) : (
              <div className="space-y-1.5">
                {events.tasks.map(task => (
                  <div key={task.id} className="p-2 rounded-lg bg-gray-50 transition-all duration-200 hover:bg-gray-100">
                    <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
