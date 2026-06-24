import { useState, useMemo, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDailyPlans } from '../hooks/useDailyPlans'
import { useTasks } from '../hooks/useTasks'
import { Sun, CloudSun, Moon, Plus, Trash2, Check, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'

type Period = 'morning' | 'afternoon' | 'evening'

const PERIODS: { key: Period; label: string; sub: string; icon: any; color: string; bg: string }[] = [
  { key: 'morning', label: '上午', sub: '6:00 - 12:00', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'afternoon', label: '下午', sub: '12:00 - 18:00', icon: CloudSun, color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'evening', label: '晚上', sub: '18:00 - 24:00', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
]

export default function DailyPlannerPage() {
  const { user } = useAuth()
  const { plans, fetchPlansByDate, addPlan, togglePlan, deletePlan } = useDailyPlans(user?.id)
  const { tasks } = useTasks(user?.id)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showTaskPicker, setShowTaskPicker] = useState<{ period: Period } | null>(null)

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  useEffect(() => {
    fetchPlansByDate(dateStr)
  }, [dateStr, fetchPlansByDate])

  const plansByPeriod = useMemo(() => {
    const grouped: Record<Period, typeof plans> = { morning: [], afternoon: [], evening: [] }
    plans.filter(p => p.date === dateStr).forEach(p => {
      grouped[p.period].push(p)
    })
    return grouped
  }, [plans, dateStr])

  const handleAddFromTask = async (period: Period, taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      await addPlan(dateStr, period, task.title, taskId)
    }
    setShowTaskPicker(null)
  }

  const completedCount = plans.filter(p => p.date === dateStr && p.completed).length
  const totalCount = plans.filter(p => p.date === dateStr).length

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6 fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">每日规划</h1>
        <div className="flex items-center gap-2">
          {isToday(selectedDate) && (
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">今天</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 fade-in" style={{ animationDelay: '0.05s' }}>
        <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 btn-press">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-800 text-base md:text-lg">{format(selectedDate, 'yyyy年M月d日 EEEE', { locale: zhCN })}</p>
          <button onClick={() => setSelectedDate(new Date())} className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors">
            回到今天
          </button>
        </div>
        <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 btn-press">
          <ChevronRight size={20} />
        </button>
      </div>

      {totalCount > 0 && (
        <div className="mb-6 fade-in" style={{ animationDelay: '0.08s' }}>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-500">完成进度</span>
            <span className="font-medium text-gray-700">{completedCount}/{totalCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-2 rounded-full progress-bar"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {PERIODS.map((period, i) => (
          <PeriodSection
            key={period.key}
            period={period}
            items={plansByPeriod[period.key]}
            onAdd={(content) => addPlan(dateStr, period.key, content)}
            onToggle={(id, completed) => togglePlan(id, completed)}
            onDelete={deletePlan}
            onAddFromTask={() => setShowTaskPicker({ period: period.key })}
            animationDelay={`${0.1 + i * 0.05}s`}
          />
        ))}
      </div>

      {showTaskPicker && (
        <TaskPickerModal
          tasks={tasks.filter(t => t.status !== 'completed')}
          onSelect={(taskId) => handleAddFromTask(showTaskPicker.period, taskId)}
          onClose={() => setShowTaskPicker(null)}
        />
      )}
    </div>
  )
}

function PeriodSection({ period, items, onAdd, onToggle, onDelete, onAddFromTask, animationDelay }: {
  period: typeof PERIODS[0]
  items: any[]
  onAdd: (content: string) => void
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onAddFromTask: () => void
  animationDelay: string
}) {
  const [newContent, setNewContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus()
  }, [isAdding])

  const handleAdd = () => {
    const content = newContent.trim()
    if (!content) return
    onAdd(content)
    setNewContent('')
    setIsAdding(false)
  }

  const Icon = period.icon
  const completedCount = items.filter(i => i.completed).length

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden fade-in`} style={{ animationDelay }}>
      <div className={`flex items-center justify-between p-4 ${period.bg} border-b border-gray-100/50`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${period.bg} flex items-center justify-center`}>
            <Icon size={20} className={period.color} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm md:text-base">{period.label}</h3>
            <p className="text-[10px] md:text-xs text-gray-400">{period.sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-[10px] md:text-xs text-gray-400">
              {completedCount}/{items.length}
            </span>
          )}
          <button
            onClick={onAddFromTask}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-all duration-200 btn-press"
            title="从任务添加"
          >
            <CalendarDays size={16} />
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-all duration-200 btn-press"
            title="添加计划"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="p-3 md:p-4">
        {isAdding && (
          <div className="flex gap-2 mb-3 slide-down">
            <input
              ref={inputRef}
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false) }}
              placeholder="输入计划内容..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200"
            />
            <button onClick={handleAdd} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 btn-press transition-all duration-200">
              添加
            </button>
            <button onClick={() => { setIsAdding(false); setNewContent('') }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 btn-press transition-all duration-200">
              取消
            </button>
          </div>
        )}

        {items.length === 0 && !isAdding ? (
          <div className="text-center py-6 text-gray-300">
            <p className="text-xs">暂无计划</p>
            <p className="text-[10px] mt-1">点击 + 添加计划</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <PlanItem
                key={item.id}
                item={item}
                onToggle={() => onToggle(item.id, item.completed)}
                onDelete={() => onDelete(item.id)}
                animationDelay={`${idx * 0.03}s`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PlanItem({ item, onToggle, onDelete, animationDelay }: {
  item: any
  onToggle: () => void
  onDelete: () => void
  animationDelay: string
}) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(item.content)
  const inputRef = useRef<HTMLInputElement>(null)
  const { updateContent } = useDailyPlans(undefined)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  const handleSave = async () => {
    const content = editContent.trim()
    if (content && content !== item.content) {
      await updateContent(item.id, content)
    } else if (!content) {
      onDelete()
    }
    setEditing(false)
  }

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group fade-in ${
        item.completed ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
      }`}
      style={{ animationDelay }}
    >
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 checkbox-bounce ${
          item.completed ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-300 hover:border-indigo-500'
        }`}
      >
        {item.completed && <Check size={12} className="text-white" />}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditContent(item.content); setEditing(false) } }}
          className="flex-1 min-w-0 text-sm outline-none border-b border-indigo-500 pb-0.5"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 min-w-0 text-sm cursor-text truncate transition-all duration-200 ${
            item.completed ? 'line-through text-gray-400' : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          {item.content}
        </span>
      )}

      {item.task_id && (
        <span className="text-[9px] text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">任务</span>
      )}

      <button
        onClick={onDelete}
        className="p-1 text-gray-300 hover:text-red-500 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 btn-press"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function TaskPickerModal({ tasks, onSelect, onClose }: {
  tasks: any[]
  onSelect: (taskId: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[60vh] flex flex-col slide-down" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">选择任务</h3>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索任务..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">无可用任务</p>
          ) : (
            filtered.map(task => (
              <button
                key={task.id}
                onClick={() => onSelect(task.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 truncate"
              >
                {task.title}
              </button>
            ))
          )}
        </div>
        <div className="p-3 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
