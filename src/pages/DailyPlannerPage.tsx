import { useState, useMemo, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDailyPlans } from '../hooks/useDailyPlans'
import { useTasks } from '../hooks/useTasks'
import { Sun, CloudSun, Moon, Plus, Trash2, Check, ChevronLeft, ChevronRight, CalendarDays, GripVertical } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion, type Variants } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

type Period = 'morning' | 'afternoon' | 'evening'
const PERIODS: { key: Period; label: string; sub: string; icon: any; color: string; bg: string; darkBg: string }[] = [
  { key: 'morning', label: '上午', sub: '6:00 - 12:00', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50/50', darkBg: 'dark:bg-amber-900/20' },
  { key: 'afternoon', label: '下午', sub: '12:00 - 18:00', icon: CloudSun, color: 'text-orange-500', bg: 'bg-orange-50/50', darkBg: 'dark:bg-orange-900/20' },
  { key: 'evening', label: '晚上', sub: '18:00 - 24:00', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50/50', darkBg: 'dark:bg-indigo-900/20' },
]

export default function DailyPlannerPage() {
  const { user } = useAuth()
  const { plans, fetchPlansByDate, addPlan, togglePlan, deletePlan, reorderPlans } = useDailyPlans(user?.id)
  const { tasks } = useTasks(user?.id)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showTaskPicker, setShowTaskPicker] = useState<{ period: Period } | null>(null)
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  useEffect(() => { fetchPlansByDate(dateStr) }, [dateStr, fetchPlansByDate])

  const plansByPeriod = useMemo(() => {
    const grouped: Record<Period, typeof plans> = { morning: [], afternoon: [], evening: [] }
    plans.filter(p => p.date === dateStr).forEach(p => { grouped[p.period].push(p) })
    // Sort by sort_order
    Object.keys(grouped).forEach(k => grouped[k as Period].sort((a, b) => a.sort_order - b.sort_order))
    return grouped
  }, [plans, dateStr])

  const handleAddFromTask = async (period: Period, taskId: string) => { const task = tasks.find(t => t.id === taskId); if (task) await addPlan(dateStr, period, task.title, taskId); setShowTaskPicker(null) }
  
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { source, destination } = result
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const sourcePeriod = source.droppableId as Period
    const destPeriod = destination.droppableId as Period

    const sourceItems = Array.from(plansByPeriod[sourcePeriod])
    const destItems = sourcePeriod === destPeriod ? sourceItems : Array.from(plansByPeriod[destPeriod])

    const [removed] = sourceItems.splice(source.index, 1)

    if (sourcePeriod === destPeriod) {
      sourceItems.splice(destination.index, 0, removed)
      const updated = sourceItems.map((item, index) => ({ id: item.id, sort_order: index, period: sourcePeriod }))
      reorderPlans(updated)
    } else {
      destItems.splice(destination.index, 0, removed)
      const updatedSource = sourceItems.map((item, index) => ({ id: item.id, sort_order: index, period: sourcePeriod }))
      const updatedDest = destItems.map((item, index) => ({ id: item.id, sort_order: index, period: destPeriod }))
      reorderPlans([...updatedSource, ...updatedDest])
    }
  }

  const completedCount = plans.filter(p => p.date === dateStr && p.completed).length
  const totalCount = plans.filter(p => p.date === dateStr).length

  return (
    <motion.div 
      className="max-w-3xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-text-primary">每日规划</h1>
        {isToday(selectedDate) && <span className="text-xs bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-brand px-3 py-1 rounded-full font-bold shadow-none">今天</span>}
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6 glass p-2 rounded-2xl">
        <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="p-3 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 btn-press text-gray-600 dark:text-gray-400"><ChevronLeft size={20} /></button>
        <div className="text-center">
          <p className="font-bold text-text-primary text-base md:text-lg">{format(selectedDate, 'yyyy年M月d日 EEEE', { locale: zhCN })}</p>
          <button onClick={() => setSelectedDate(new Date())} className="text-xs font-medium text-brand dark:text-brand hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mt-0.5">回到今天</button>
        </div>
        <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="p-3 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 btn-press text-gray-600 dark:text-gray-400"><ChevronRight size={20} /></button>
      </motion.div>

      {totalCount > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2"><span className="font-semibold text-text-secondary">完成进度</span><span className="font-bold text-brand dark:text-brand">{completedCount}/{totalCount}</span></div>
          <div className="w-full bg-bg-secondary rounded-full h-3 overflow-hidden shadow-inner border border-white/20"><motion.div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} transition={{ duration: 1, ease: 'easeOut' }} /></div>
        </motion.div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <motion.div className="space-y-5" variants={containerVariants}>
          {PERIODS.map((period) => (
            <PeriodSection key={period.key} period={period} items={plansByPeriod[period.key]} onAdd={(content) => addPlan(dateStr, period.key, content)} onToggle={(id, completed) => togglePlan(id, completed)} onDelete={deletePlan} onAddFromTask={() => setShowTaskPicker({ period: period.key })} />
          ))}
        </motion.div>
      </DragDropContext>

      {showTaskPicker && <TaskPickerModal tasks={tasks.filter(t => t.status !== 'completed')} onSelect={(taskId) => handleAddFromTask(showTaskPicker.period, taskId)} onClose={() => setShowTaskPicker(null)} />}
    </motion.div>
  )
}

function PeriodSection({ period, items, onAdd, onToggle, onDelete, onAddFromTask }: {
  period: typeof PERIODS[0]; items: any[]; onAdd: (content: string) => void; onToggle: (id: string, completed: boolean) => void; onDelete: (id: string) => void; onAddFromTask: () => void
}) {
  const [newContent, setNewContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (isAdding && inputRef.current) inputRef.current.focus() }, [isAdding])
  const handleAdd = () => { const content = newContent.trim(); if (!content) return; onAdd(content); setNewContent(''); setIsAdding(false) }
  const Icon = period.icon
  const completedCount = items.filter(i => i.completed).length

  return (
    <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden shadow-none hover:border-[#D6D3CD] dark:hover:border-[#4A4844] transition-shadow duration-300">
      <div className={`flex items-center justify-between p-4 ${period.bg} ${period.darkBg} border-b border-black/5 dark:border-white/5`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-white/60 dark:bg-gray-800/60 shadow-none flex items-center justify-center`}><Icon size={24} className={period.color} /></div>
          <div><h3 className="font-bold text-text-primary text-base md:text-lg">{period.label}</h3><p className="text-[10px] md:text-xs font-medium text-text-secondary">{period.sub}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && <span className="text-[11px] md:text-xs font-bold text-gray-400 dark:text-gray-500 mr-2 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full">{completedCount}/{items.length}</span>}
          <button onClick={onAddFromTask} className="p-2 text-text-secondary hover:text-brand dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 btn-press shadow-none" title="从任务添加"><CalendarDays size={18} /></button>
          <button onClick={() => setIsAdding(!isAdding)} className="p-2 text-text-secondary hover:text-brand dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 btn-press shadow-none" title="添加计划"><Plus size={18} /></button>
        </div>
      </div>
      <div className="p-4 md:p-5">
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2 mb-4 overflow-hidden">
            <input ref={inputRef} value={newContent} onChange={e => setNewContent(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false) }} placeholder="输入计划内容..." className="flex-1 px-4 py-2 border border-white/20 bg-bg-secondary text-text-primary rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all duration-200" />
            <button onClick={handleAdd} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-hover shadow-none btn-press transition-all duration-200">添加</button>
            <button onClick={() => { setIsAdding(false); setNewContent('') }} className="px-4 py-2 bg-white/50 dark:bg-gray-700/50 text-text-secondary rounded-xl text-sm font-medium hover:bg-white dark:hover:bg-gray-700 border border-black/5 dark:border-white/5 btn-press transition-all duration-200">取消</button>
          </motion.div>
        )}
        <Droppable droppableId={period.key}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[40px]">
              {items.length === 0 && !isAdding && (
                <div className="text-center py-4 text-gray-400 dark:text-gray-500 absolute inset-0 flex flex-col justify-center pointer-events-none"><p className="text-sm font-medium">暂无计划</p><p className="text-xs mt-1">点击 + 添加计划</p></div>
              )}
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} style={{...provided.draggableProps.style, zIndex: snapshot.isDragging ? 50 : 1}}>
                      <PlanItem item={item} onToggle={() => onToggle(item.id, item.completed)} onDelete={() => onDelete(item.id)} dragHandleProps={provided.dragHandleProps} isDragging={snapshot.isDragging} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </motion.div>
  )
}

function PlanItem({ item, onToggle, onDelete, dragHandleProps, isDragging }: { item: any; onToggle: () => void; onDelete: () => void; dragHandleProps: any; isDragging: boolean }) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(item.content)
  const inputRef = useRef<HTMLInputElement>(null)
  const { updateContent } = useDailyPlans(undefined)
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])
  const handleSave = async () => { const content = editContent.trim(); if (content && content !== item.content) await updateContent(item.id, content); else if (!content) onDelete(); setEditing(false) }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border border-white/10 transition-all duration-300 group ${item.completed ? 'bg-white/30 dark:bg-gray-800/30 opacity-60' : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700'} ${isDragging ? 'shadow-xl scale-[1.02] bg-white dark:bg-gray-700' : 'shadow-none hover:shadow'}`}>
      <div {...dragHandleProps} className="cursor-grab p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500"><GripVertical size={16} /></div>
      <button onClick={onToggle} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 checkbox-bounce ${item.completed ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-300 dark:border-gray-500 hover:border-indigo-500'}`}>{item.completed && <Check size={12} className="text-white" />}</button>
      {editing ? (
        <input ref={inputRef} value={editContent} onChange={e => setEditContent(e.target.value)} onBlur={handleSave} onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditContent(item.content); setEditing(false) } }} className="flex-1 min-w-0 text-sm outline-none border-b border-indigo-500 pb-0.5 bg-transparent text-text-primary" />
      ) : (
        <span onClick={() => setEditing(true)} className={`flex-1 min-w-0 text-sm font-medium cursor-text truncate transition-all duration-200 ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-indigo-400'}`}>{item.content}</span>
      )}
      {item.task_id && <span className="text-[10px] font-bold text-indigo-500 dark:text-brand bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md shrink-0">任务</span>}
      <button onClick={onDelete} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 btn-press"><Trash2 size={14} /></button>
    </div>
  )
}

function TaskPickerModal({ tasks, onSelect, onClose }: { tasks: any[]; onSelect: (taskId: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-2xl shadow-2xl w-full max-w-md max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-black/5 dark:border-white/5">
          <h3 className="font-bold text-text-primary mb-4 text-lg">选择任务</h3>
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
