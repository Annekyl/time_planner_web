import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTimeBlocks } from '../hooks/useTimeBlocks'
import { useTasks } from '../hooks/useTasks'
import { Plus, Trash2, Clock } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)
const HOUR_HEIGHT = 64

export default function TimeBlocksPage() {
  const { user } = useAuth()
  const { timeBlocks, addTimeBlock, deleteTimeBlock } = useTimeBlocks(user?.id)
  const { tasks, categories } = useTasks(user?.id)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd'), start_time: '09:00', end_time: '10:00', category_id: '', task_id: '', color: '#3b82f6' })
  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const dayBlocks = useMemo(() => timeBlocks.filter(b => b.date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time)), [timeBlocks, dateStr])
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await addTimeBlock({ ...form, category_id: form.category_id || null, task_id: form.task_id || null }); setForm(p => ({ ...p, title: '', start_time: '09:00', end_time: '10:00', category_id: '', task_id: '' })); setShowForm(false) }
  const timeToMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const getBlockStyle = (block: typeof dayBlocks[0]) => { const startMin = timeToMinutes(block.start_time) - 360; const endMin = timeToMinutes(block.end_time) - 360; return { top: `${(startMin / 60) * HOUR_HEIGHT}px`, height: `${Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 32)}px` } }
  const inputCls = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all duration-200"
  const selectCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500 outline-none"

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6 fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">时间块规划</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 text-xs md:text-sm btn-press"><Plus size={16} /><span className="hidden sm:inline">添加时间块</span><span className="sm:hidden">添加</span></button>
      </div>
      <div className="flex items-center justify-between md:justify-center gap-2 md:gap-4 mb-4 md:mb-6 fade-in" style={{ animationDelay: '0.05s' }}>
        <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm btn-press transition-all duration-200">前一天</button>
        <div className="text-center px-2"><p className="font-semibold text-gray-800 dark:text-gray-100 text-sm md:text-base">{format(selectedDate, 'yyyy年M月d日 EEEE', { locale: zhCN })}</p><button onClick={() => setSelectedDate(new Date())} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">回到今天</button></div>
        <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm btn-press transition-all duration-200">后一天</button>
      </div>
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 mb-4 md:mb-6 slide-down">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">添加时间块</h3>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="时间块标题" className={inputCls} required />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">日期</label><input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={selectCls} /></div>
              <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">颜色</label><input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-full h-[38px] px-1 py-1 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer" /></div>
              <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">开始时间</label><input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} className={selectCls} /></div>
              <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">结束时间</label><input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} className={selectCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">分类</label><select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className={selectCls}><option value="">无分类</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">关联任务</label><select value={form.task_id} onChange={e => setForm(p => ({ ...p, task_id: e.target.value }))} className={selectCls}><option value="">无关联任务</option>{tasks.filter(t => t.status !== 'completed').map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
            </div>
            <div className="flex gap-2"><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm btn-press transition-all duration-200">添加</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm btn-press transition-all duration-200">取消</button></div>
          </form>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 md:p-6 overflow-x-auto fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="relative min-w-[320px]" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
          {HOURS.map(hour => <div key={hour} className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/50" style={{ top: `${(hour - 6) * HOUR_HEIGHT}px` }}><span className="absolute -top-3 left-0 text-[10px] md:text-xs text-gray-400 dark:text-gray-500 w-10 md:w-12">{String(hour).padStart(2, '0')}:00</span></div>)}
          {dayBlocks.map((block, i) => <div key={block.id} className="absolute left-12 md:left-14 right-2 md:right-4 rounded-lg p-1.5 md:p-2 text-white text-xs md:text-sm overflow-hidden group fade-in" style={{ ...getBlockStyle(block), backgroundColor: block.color, animationDelay: `${i * 0.05}s` }}><div className="flex items-start justify-between"><div className="min-w-0 flex-1"><p className="font-medium truncate">{block.title}</p><p className="opacity-80">{block.start_time} - {block.end_time}</p></div><button onClick={() => deleteTimeBlock(block.id)} className="p-1 hover:bg-white/20 rounded transition-all duration-200 shrink-0 md:opacity-0 md:group-hover:opacity-100 btn-press"><Trash2 size={12} /></button></div></div>)}
          {dayBlocks.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-600 fade-in"><div className="text-center"><Clock size={48} className="mx-auto mb-2 opacity-30" /><p className="text-sm">点击上方按钮添加时间块</p></div></div>}
        </div>
      </div>
    </div>
  )
}
