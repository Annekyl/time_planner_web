import { useState, useRef } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, subMonths, addMonths, isSameDay, isSameMonth, parseISO, isValid } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { PortalPopover } from './PortalPopover'

interface CustomDatePickerProps {
  value: string
  onChange: (date: string) => void
  className?: string
  placeholder?: string
}

export default function CustomDatePicker({ value, onChange, className = '', placeholder = '选择日期' }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLButtonElement>(null)
  
  // Parse initial date or default to today
  const initialDate = value && isValid(parseISO(value)) ? parseISO(value) : new Date()
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate))

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ChevronLeft size={18} className="text-text-secondary" />
        </button>
        <span className="font-bold text-sm text-text-primary">
          {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
        </span>
        <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ChevronRight size={18} className="text-text-secondary" />
        </button>
      </div>
    )
  }

  const renderDays = () => {
    const days = ['一', '二', '三', '四', '五', '六', '日']
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-text-secondary py-1">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const dateFormat = 'd'
    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ''

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat)
        const cloneDay = day
        const isSelected = value && isSameDay(day, parseISO(value))
        const isCurrentMonth = isSameMonth(day, monthStart)

        days.push(
          <button
            key={day.toString()}
            type="button"
            onClick={() => {
              onChange(format(cloneDay, 'yyyy-MM-dd'))
              setIsOpen(false)
            }}
            className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-all duration-200 ${
              isSelected
                ? 'bg-brand text-white font-bold shadow-md'
                : !isCurrentMonth
                ? 'text-gray-400 dark:text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'
                : 'text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {formattedDate}
          </button>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return <div>{rows}</div>
  }

  return (
    <>
      <button
        ref={containerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-bg-secondary text-text-primary border border-border-default rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 text-left ${className}`}
      >
        <Calendar size={16} className="text-text-secondary shrink-0" />
        <span className="truncate text-sm font-medium flex-1">
          {value || <span className="text-text-secondary">{placeholder}</span>}
        </span>
      </button>

      <PortalPopover isOpen={isOpen} onClose={() => setIsOpen(false)} triggerRef={containerRef} width={280} height={320}>
        <div className="glass bg-bg-secondary/95 backdrop-blur-xl rounded-2xl border border-border-subtle shadow-xl overflow-hidden p-4">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
      </PortalPopover>
    </>
  )
}
