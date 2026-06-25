import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { Plus, Trash2, Edit3, Check, CheckSquare } from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { format, parseISO, addDays, addWeeks, addMonths } from 'date-fns'
import { motion, type Variants, AnimatePresence } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function TasksPage() {
  const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9']
  const { user } = useAuth()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string | null>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, type: 'task' | 'category', id: string, title: string }>({ isOpen: false, type: 'task', id: '', title: '' })
  const { tasks, categories, hasMore, loadMore, loading, addTask, updateTask, deleteTask, addCategory, updateCategory, deleteCategory } = useTasks(user?.id, { paginate: true, status: filterStatus, categoryId: filterCategory === 'all' ? undefined : (filterCategory || undefined) })
  const [showForm, setShowForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', priority: 2 as 1 | 2 | 3 | 4, status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled', due_date: '', category_id: '' })
  const [formSubtasks, setFormSubtasks] = useState<{completed: boolean, text: string}[]>([])
  const [formRecurrence, setFormRecurrence] = useState<{ type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom', interval: number, unit: 'days' | 'weeks' | 'months' }>({ type: 'none', interval: 1, unit: 'days' })
  const [catForm, setCatForm] = useState({ id: '', name: '', color: PRESET_COLORS[0] })

  const parseDescription = (desc: string) => {
    const lines = (desc || '').split('\n')
    const normalLines = []
    const subtasks = []
    for (const line of lines) {
      const match = line.match(/^- \[([ xX])\] (.*)$/)
      if (match) subtasks.push({ completed: match[1].toLowerCase() === 'x', text: match[2] })
      else normalLines.push(line)
    }
    return { description: normalLines.join('\n').trim(), subtasks }
  }

  const buildDescription = (description: string, subtasks: {completed: boolean, text: string}[]) => {
    const desc = description.trim()
    const stLines = subtasks.filter(s => s.text.trim()).map(s => `- [${s.completed ? 'x' : ' '}] ${s.text}`)
    return desc ? (stLines.length > 0 ? `${desc}\n\n${stLines.join('\n')}` : desc) : stLines.join('\n')
  }

  const resetForm = () => { setForm({ title: '', description: '', priority: 2, status: 'pending', due_date: '', category_id: '' }); setFormSubtasks([]); setFormRecurrence({ type: 'none', interval: 1, unit: 'days' }); setShowForm(false); setEditingId(null) }
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); const finalDesc = buildDescription(form.description, formSubtasks); const recurrence_rule = formRecurrence.type === 'none' ? null : { type: formRecurrence.type, interval: formRecurrence.type === 'custom' ? formRecurrence.interval : undefined, unit: formRecurrence.type === 'custom' ? formRecurrence.unit : undefined }; if (editingId) await updateTask(editingId, { ...form, description: finalDesc, due_date: form.due_date || null, recurrence_rule }); else await addTask({ ...form, description: finalDesc, due_date: form.due_date || null, completed_at: null, recurrence_rule }); resetForm() }
  const handleEdit = (task: typeof tasks[0]) => { const parsed = parseDescription(task.description || ''); setForm({ title: task.title, description: parsed.description, priority: task.priority, status: task.status, due_date: task.due_date || '', category_id: task.category_id || '' }); setFormSubtasks(parsed.subtasks); const r = task.recurrence_rule; setFormRecurrence({ type: r ? r.type : 'none', interval: r?.interval || 1, unit: r?.unit || 'days' }); setEditingId(task.id); setShowForm(true) }
  const handleToggleComplete = async (task: typeof tasks[0]) => { 
    const isCompleting = task.status !== 'completed';
    if (isCompleting) {
      if (task.recurrence_rule && task.due_date) {
        const currentDue = parseISO(task.due_date);
        let nextDate = new Date(currentDue);
        const rule = task.recurrence_rule;
        if (rule.type === 'daily') nextDate = addDays(currentDue, 1);
        else if (rule.type === 'weekly') nextDate = addWeeks(currentDue, 1);
        else if (rule.type === 'monthly') nextDate = addMonths(currentDue, 1);
        else if (rule.type === 'custom') {
          if (rule.unit === 'days') nextDate = addDays(currentDue, rule.interval || 1);
          else if (rule.unit === 'weeks') nextDate = addWeeks(currentDue, rule.interval || 1);
          else if (rule.unit === 'months') nextDate = addMonths(currentDue, rule.interval || 1);
        }
        await addTask({ title: task.title, description: task.description, priority: task.priority, category_id: task.category_id, status: 'pending', due_date: format(nextDate, 'yyyy-MM-dd'), completed_at: null, recurrence_rule: task.recurrence_rule });
      }
      await updateTask(task.id, { status: 'completed', completed_at: new Date().toISOString() });
    } else {
      await updateTask(task.id, { status: 'pending', completed_at: null });
    }
  }
  const handleToggleSubtask = async (task: typeof tasks[0], index: number) => {
    const parsed = parseDescription(task.description || '')
    parsed.subtasks[index].completed = !parsed.subtasks[index].completed
    await updateTask(task.id, { description: buildDescription(parsed.description, parsed.subtasks) })
  }
  const handleOpenCategoryForm = () => {
    if (showCategoryForm) setShowCategoryForm(false)
    else {
      setCatForm({ id: '', name: '', color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] })
      setShowCategoryForm(true)
    }
  }
  const handleAddCategory = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (catForm.id) {
      await updateCategory(catForm.id, { name: catForm.name, color: catForm.color });
      setShowCategoryForm(false);
    } else {
      await addCategory(catForm.name, catForm.color);
      setCatForm({ id: '', name: '', color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] }); 
    }
  }
  const loaderRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!hasMore || loading) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore()
    }, { threshold: 0.1 })
    const current = loaderRef.current
    if (current) observer.observe(current)
    return () => { if (current) observer.unobserve(current) }
  }, [hasMore, loading])

  const priorityLabel: Record<number, string> = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
  const priorityColor: Record<number, string> = { 1: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400', 2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 3: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', 4: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  const inputCls = "w-full px-4 py-2 border border-border-default bg-bg-secondary text-text-primary rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none text-sm transition-all duration-200"
  const selectCls = "w-full px-3 py-2 border border-border-default bg-bg-secondary text-text-primary rounded-xl text-sm transition-all duration-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none"

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-text-primary">任务管理</h1>
        <div className="flex gap-2">
          <button onClick={handleOpenCategoryForm} className="px-3 md:px-4 py-2 text-xs md:text-sm bg-bg-secondary border border-border-default text-text-secondary rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 btn-press">分类</button>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="px-3 md:px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-hover transition-all duration-200 flex items-center gap-1.5 text-xs md:text-sm shadow-none btn-press"><Plus size={16} /><span className="hidden sm:inline">新建任务</span><span className="sm:hidden">新建</span></button>
        </div>
      </motion.div>

      {showCategoryForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-2xl p-4 md:p-5 mb-4 overflow-hidden shadow-sm">
          <h3 className="font-bold text-text-primary mb-3 text-sm">{catForm.id ? '编辑分类' : '添加分类'}</h3>
          <form onSubmit={handleAddCategory} className="flex items-center gap-2 md:gap-3">
            <input type="color" value={catForm.color} onChange={e => setCatForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded-xl cursor-pointer shrink-0 border-0 p-0" />
            <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="分类名称" className="flex-1 min-w-0 px-4 py-2.5 border border-border-default bg-bg-secondary text-text-primary rounded-xl text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all duration-200" required />
            <button type="submit" className="px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-hover shrink-0 shadow-none btn-press">{catForm.id ? '保存' : '添加'}</button>
          </form>
          <div className="flex gap-2 mt-4 flex-wrap">
            {categories.map(c => (
              <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-white/10 shadow-sm group" style={{ backgroundColor: c.color + '20', color: c.color }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                {c.name}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 -mr-1">
                  <button type="button" onClick={() => { setCatForm({ id: c.id, name: c.name, color: c.color }); setShowCategoryForm(true); }} className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"><Edit3 size={12} /></button>
                  <button type="button" onClick={() => setDeleteConfirm({ isOpen: true, type: 'category', id: c.id, title: c.name })} className="p-0.5 hover:bg-red-500/20 text-red-500 rounded"><Trash2 size={12} /></button>
                </div>
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex gap-2 md:gap-3 mb-4 md:mb-6">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`px-3 py-2.5 border border-border-default glass text-text-primary rounded-xl text-xs md:text-sm min-w-0 flex-1 md:flex-none transition-all duration-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none font-medium`}>
          <option value="all">全部状态</option><option value="pending">待办</option><option value="in_progress">进行中</option><option value="completed">已完成</option>
        </select>
        <select value={filterCategory || ''} onChange={e => setFilterCategory(e.target.value)} className={`px-3 py-2.5 border border-border-default glass text-text-primary rounded-xl text-xs md:text-sm min-w-0 flex-1 md:flex-none transition-all duration-200 focus:ring-2 focus:ring-brand focus:border-brand outline-none font-medium`}>
          <option value="all">全部分类</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-2xl p-5 md:p-6 mb-6 overflow-hidden shadow-sm">
          <h3 className="font-bold text-text-primary mb-4 md:mb-5 text-sm md:text-base">{editingId ? '编辑任务' : '新建任务'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="任务标题" className={inputCls} required />
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="任务描述（可选）" className={`${inputCls} resize-none py-3`} rows={2} />
            <div className="space-y-2">
              <label className="block text-xs font-medium text-text-secondary">子任务清单</label>
              {formSubtasks.map((st, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <button type="button" onClick={() => setFormSubtasks(p => p.map((s, i) => i === idx ? { ...s, completed: !s.completed } : s))} className={`w-5 h-5 rounded-full border-2 flex flex-shrink-0 items-center justify-center transition-all duration-300 ${st.completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>{st.completed && <Check size={12} className="text-white" />}</button>
                  <input value={st.text} onChange={e => setFormSubtasks(p => p.map((s, i) => i === idx ? { ...s, text: e.target.value } : s))} placeholder="子任务内容" className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-indigo-500 outline-none text-sm text-text-primary py-1" />
                  <button type="button" onClick={() => setFormSubtasks(p => p.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setFormSubtasks(p => [...p, { completed: false, text: '' }])} className="text-xs text-brand dark:text-brand font-medium hover:underline flex items-center gap-1"><Plus size={14} /> 添加子任务</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">优先级</label><select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) as 1 | 2 | 3 | 4 }))} className={selectCls}><option value={1}>低</option><option value={2}>中</option><option value={3}>高</option><option value={4}>紧急</option></select></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">状态</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} className={selectCls}><option value="pending">待办</option><option value="in_progress">进行中</option><option value="completed">已完成</option></select></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">截止日期</label><input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className={selectCls} /></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">分类</label><select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className={selectCls}><option value="">无分类</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>
            
            <div className="pt-2 border-t border-border-default mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">重复设置 (仅带有截止日期时有效)</label>
                <select value={formRecurrence.type} onChange={e => setFormRecurrence(p => ({ ...p, type: e.target.value as any }))} className={selectCls}>
                  <option value="none">不重复</option>
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              {formRecurrence.type === 'custom' && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-text-secondary">每</span>
                  <input type="number" min="1" value={formRecurrence.interval} onChange={e => setFormRecurrence(p => ({ ...p, interval: Number(e.target.value) }))} className="w-16 px-3 py-1.5 border border-border-default bg-bg-secondary text-text-primary rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
                  <select value={formRecurrence.unit} onChange={e => setFormRecurrence(p => ({ ...p, unit: e.target.value as any }))} className="w-24 px-3 py-1.5 border border-border-default bg-bg-secondary text-text-primary rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand">
                    <option value="days">天</option>
                    <option value="weeks">周</option>
                    <option value="months">月</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-5 py-2.5 bg-brand text-white rounded-xl hover:bg-brand-hover font-medium text-sm btn-press shadow-none transition-all duration-200">{editingId ? '保存更改' : '创建任务'}</button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-border-default text-text-secondary rounded-xl hover:bg-white dark:hover:bg-gray-600 font-medium text-sm btn-press transition-all duration-200">取消</button>
            </div>
          </form>
        </motion.div>
      )}

      <AnimatePresence>
        <motion.div className="space-y-3" variants={containerVariants}>
          {tasks.map((task) => (
            <motion.div key={task.id} variants={itemVariants} className={`glass rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-[#D6D3CD] dark:hover:border-[#4A4844] group ${task.status === 'completed' ? 'opacity-60 bg-white/30 dark:bg-gray-800/30' : ''}`}>
              <button onClick={() => handleToggleComplete(task)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 checkbox-bounce ${task.status === 'completed' ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-300 dark:border-gray-500 hover:border-indigo-500'}`}>{task.status === 'completed' && <Check size={12} className="text-white" />}</button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-bold transition-all duration-200 ${task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-text-primary group-hover:text-brand dark:group-hover:text-indigo-400'}`}>{task.title}</span>
                  {task.recurrence_rule && <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-md font-medium border border-border-default bg-bg-tertiary text-text-secondary">🔁 重复</span>}
                  {task.category && <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-md font-medium border border-white/10" style={{ backgroundColor: task.category.color + '20', color: task.category.color }}>{task.category.name}</span>}
                </div>
                {(() => {
                  const parsed = parseDescription(task.description || '');
                  return (
                    <div className="mt-1">
                      {parsed.description && <p className="text-xs font-medium text-text-secondary truncate">{parsed.description}</p>}
                      {parsed.subtasks.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {parsed.subtasks.map((st, idx) => (
                            <div key={idx} className="flex items-center gap-2 group/st">
                              <button onClick={() => handleToggleSubtask(task, idx)} className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${st.completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-500'}`}>{st.completed && <Check size={10} className="text-white" />}</button>
                              <span className={`text-xs ${st.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>{st.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] md:text-xs px-2 py-1 rounded-md font-medium ${priorityColor[task.priority]}`}>{priorityLabel[task.priority]}</span>
                {task.due_date && <span className="text-[10px] md:text-xs font-medium text-text-secondary bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md hidden sm:inline">{format(parseISO(task.due_date), 'M/d')}</span>}
                <button onClick={() => handleEdit(task)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-brand hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 btn-press"><Edit3 size={16} /></button>
                <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'task', id: task.id, title: task.title })} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 btn-press"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
          {tasks.length === 0 && !loading && <motion.div variants={itemVariants} className="text-center py-16 text-gray-400 dark:text-gray-500"><CheckSquare size={48} className="mx-auto mb-4 opacity-20" /><p className="font-medium text-sm">暂无任务</p></motion.div>}
          {hasMore && (
            <div ref={loaderRef} className="py-6 flex justify-center items-center">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin"></div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === 'category' ? '删除分类' : '删除任务'}
        message={deleteConfirm.type === 'category' 
          ? `确定要删除分类"${deleteConfirm.title}"吗？这不会删除相关的任务，但会移除它们的分类标签。` 
          : `确定要删除任务"${deleteConfirm.title}"吗？此操作无法撤销。`}
        onConfirm={() => {
          if (deleteConfirm.type === 'category') {
            deleteCategory(deleteConfirm.id)
            if (filterCategory === deleteConfirm.id) setFilterCategory('all')
          } else {
            deleteTask(deleteConfirm.id)
          }
          setDeleteConfirm({ ...deleteConfirm, isOpen: false })
        }}
        onCancel={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
      />
    </motion.div>
  )
}
