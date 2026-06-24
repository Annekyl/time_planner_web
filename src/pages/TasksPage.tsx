import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { Plus, Trash2, Edit3, Check, CheckSquare } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { motion, type Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function TasksPage() {
  const { user } = useAuth()
  const { tasks, categories, addTask, updateTask, deleteTask, addCategory } = useTasks(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [form, setForm] = useState({ title: '', description: '', priority: 2 as 1 | 2 | 3 | 4, status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled', due_date: '', category_id: '' })
  const [catForm, setCatForm] = useState({ name: '', color: '#3b82f6' })

  const resetForm = () => { setForm({ title: '', description: '', priority: 2, status: 'pending', due_date: '', category_id: '' }); setShowForm(false); setEditingId(null) }
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (editingId) await updateTask(editingId, { ...form, due_date: form.due_date || null }); else await addTask({ ...form, due_date: form.due_date || null, completed_at: null }); resetForm() }
  const handleEdit = (task: typeof tasks[0]) => { setForm({ title: task.title, description: task.description, priority: task.priority, status: task.status, due_date: task.due_date || '', category_id: task.category_id || '' }); setEditingId(task.id); setShowForm(true) }
  const handleToggleComplete = async (task: typeof tasks[0]) => { const s = task.status === 'completed' ? 'pending' : 'completed'; await updateTask(task.id, { status: s, completed_at: s === 'completed' ? new Date().toISOString() : null }) }
  const handleAddCategory = async (e: React.FormEvent) => { e.preventDefault(); await addCategory(catForm.name, catForm.color); setCatForm({ name: '', color: '#3b82f6' }); setShowCategoryForm(false) }
  const filteredTasks = tasks.filter(t => { if (filterStatus !== 'all' && t.status !== filterStatus) return false; if (filterCategory !== 'all' && t.category_id !== filterCategory) return false; return true })
  const priorityLabel: Record<number, string> = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
  const priorityColor: Record<number, string> = { 1: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400', 2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 3: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', 4: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  const inputCls = "w-full px-4 py-2 border border-white/20 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all duration-200"
  const selectCls = "w-full px-3 py-2 border border-white/20 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-xl text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500 outline-none"

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">任务管理</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="px-3 md:px-4 py-2 text-xs md:text-sm bg-white/50 dark:bg-gray-800/50 border border-white/20 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 btn-press">分类</button>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center gap-1.5 text-xs md:text-sm shadow-lg shadow-indigo-500/20 btn-press"><Plus size={16} /><span className="hidden sm:inline">新建任务</span><span className="sm:hidden">新建</span></button>
        </div>
      </motion.div>

      {showCategoryForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-2xl p-4 md:p-5 mb-4 overflow-hidden shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-sm">添加分类</h3>
          <form onSubmit={handleAddCategory} className="flex items-center gap-2 md:gap-3">
            <input type="color" value={catForm.color} onChange={e => setCatForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded-xl cursor-pointer shrink-0 border-0 p-0" />
            <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="分类名称" className="flex-1 min-w-0 px-4 py-2.5 border border-white/20 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200" required />
            <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shrink-0 shadow-lg shadow-indigo-500/20 btn-press">添加</button>
          </form>
          <div className="flex gap-2 mt-4 flex-wrap">
            {categories.map(c => (<motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-white/10 shadow-sm" style={{ backgroundColor: c.color + '20', color: c.color }}><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />{c.name}</motion.span>))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex gap-2 md:gap-3 mb-4 md:mb-6">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`px-3 py-2.5 border border-white/20 glass text-gray-800 dark:text-gray-200 rounded-xl text-xs md:text-sm min-w-0 flex-1 md:flex-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium`}>
          <option value="all">全部状态</option><option value="pending">待办</option><option value="in_progress">进行中</option><option value="completed">已完成</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={`px-3 py-2.5 border border-white/20 glass text-gray-800 dark:text-gray-200 rounded-xl text-xs md:text-sm min-w-0 flex-1 md:flex-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium`}>
          <option value="all">全部分类</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-2xl p-5 md:p-6 mb-6 overflow-hidden shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 md:mb-5 text-sm md:text-base">{editingId ? '编辑任务' : '新建任务'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="任务标题" className={inputCls} required />
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="任务描述（可选）" className={`${inputCls} resize-none py-3`} rows={2} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">优先级</label><select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) as 1 | 2 | 3 | 4 }))} className={selectCls}><option value={1}>低</option><option value={2}>中</option><option value={3}>高</option><option value={4}>紧急</option></select></div>
              <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">状态</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} className={selectCls}><option value="pending">待办</option><option value="in_progress">进行中</option><option value="completed">已完成</option></select></div>
              <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">截止日期</label><input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className={selectCls} /></div>
              <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">分类</label><select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className={selectCls}><option value="">无分类</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm btn-press shadow-lg shadow-indigo-500/20 transition-all duration-200">{editingId ? '保存更改' : '创建任务'}</button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-white/20 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-600 font-medium text-sm btn-press transition-all duration-200">取消</button>
            </div>
          </form>
        </motion.div>
      )}

      <motion.div className="space-y-3" variants={containerVariants}>
        {filteredTasks.map((task) => (
          <motion.div key={task.id} variants={itemVariants} className={`glass rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md group ${task.status === 'completed' ? 'opacity-60 bg-white/30 dark:bg-gray-800/30' : ''}`}>
            <button onClick={() => handleToggleComplete(task)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 checkbox-bounce ${task.status === 'completed' ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-300 dark:border-gray-500 hover:border-indigo-500'}`}>{task.status === 'completed' && <Check size={12} className="text-white" />}</button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-bold transition-all duration-200 ${task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>{task.title}</span>
                {task.category && <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-md font-medium border border-white/10" style={{ backgroundColor: task.category.color + '20', color: task.category.color }}>{task.category.name}</span>}
              </div>
              {task.description && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">{task.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] md:text-xs px-2 py-1 rounded-md font-medium ${priorityColor[task.priority]}`}>{priorityLabel[task.priority]}</span>
              {task.due_date && <span className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md hidden sm:inline">{format(parseISO(task.due_date), 'M/d')}</span>}
              <button onClick={() => handleEdit(task)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 btn-press"><Edit3 size={16} /></button>
              <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 btn-press"><Trash2 size={16} /></button>
            </div>
          </motion.div>
        ))}
        {filteredTasks.length === 0 && <motion.div variants={itemVariants} className="text-center py-16 text-gray-400 dark:text-gray-500"><CheckSquare size={48} className="mx-auto mb-4 opacity-20" /><p className="font-medium text-sm">暂无任务</p></motion.div>}
      </motion.div>
    </motion.div>
  )
}
