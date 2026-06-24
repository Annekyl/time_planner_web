import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useTimeBlocks } from '../hooks/useTimeBlocks'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function CalendarPage() {
  const { user } = useAuth()
  const { tasks } = useTasks(user?.id)
  const { timeBlocks } = useTimeBlocks(user?.id)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')

  const dayTasks = useMemo(() =>
    tasks.filter(t => t.due_date === selectedDateStr),
    [tasks, selectedDateStr]
  )

  const dayBlocks = useMemo(() =>
    timeBlocks.filter(b => b.date === selectedDateStr).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [timeBlocks, selectedDateStr]
  )

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayTaskCount = tasks.filter(t => t.due_date === dateStr).length
    const dayBlockCount = timeBlocks.filter(b => b.date === dateStr).length
    return { tasks: dayTaskCount, blocks: dayBlockCount }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">日历</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-800">
                {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
              </h2>
              <div className="flex gap-1 md:gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-2 md:px-3 py-1 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  今天
                </button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

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
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-1 md:p-2 min-h-[48px] md:min-h-[80px] rounded-lg text-left transition ${
                      !inMonth ? 'text-gray-300' :
                      selected ? 'bg-indigo-50 ring-2 ring-indigo-500' :
                      'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs md:text-sm ${today ? 'bg-indigo-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-0.5 space-y-0.5 hidden md:block">
                      {events.tasks > 0 && (
                        <div className="text-xs bg-blue-100 text-blue-700 rounded px-1 truncate">
                          {events.tasks} 个任务
                        </div>
                      )}
                      {events.blocks > 0 && (
                        <div className="text-xs bg-purple-100 text-purple-700 rounded px-1 truncate">
                          {events.blocks} 个时间块
                        </div>
                      )}
                    </div>
                    <div className="mt-0.5 flex gap-0.5 md:hidden">
                      {events.tasks > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      {events.blocks > 0 && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm md:text-base">
              {format(selectedDate, 'M月d日 EEEE', { locale: zhCN })}
            </h3>

            <div className="mb-4">
              <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2">时间块</h4>
              {dayBlocks.length === 0 ? (
                <p className="text-xs text-gray-400">无时间块</p>
              ) : (
                <div className="space-y-2">
                  {dayBlocks.map(block => (
                    <div key={block.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: block.color }} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 truncate">{block.title}</p>
                        <p className="text-xs text-gray-400">{block.start_time} - {block.end_time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2">任务</h4>
              {dayTasks.length === 0 ? (
                <p className="text-xs text-gray-400">无任务</p>
              ) : (
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <div key={task.id} className="p-2 rounded-lg bg-gray-50">
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
    </div>
  )
}
