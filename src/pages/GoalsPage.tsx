import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGoals } from '../hooks/useGoals'
import { Plus, Trash2, Edit3, Target, CheckCircle, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { motion, type Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function GoalsPage() {
  const { user } = useAuth()
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', target_date: '', progress: 0, status: 'active' as 'active' | 'completed' | 'abandoned' })
  const resetForm = () => { setForm({ title: '', description: '', target_date: '', progress: 0, status: 'active' }); setShowForm(false); setEditingId(null) }
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); const data = { ...form, target_date: form.target_date || null }; if (editingId) await updateGoal(editingId, data); else await addGoal(data); resetForm() }
  const handleEdit = (goal: typeof goals[0]) => { setForm({ title: goal.title, description: goal.description, target_date: goal.target_date || '', progress: goal.progress, status: goal.status }); setEditingId(goal.id); setShowForm(true) }
  const handleComplete = async (goal: typeof goals[0]) => { await updateGoal(goal.id, { status: goal.status === 'completed' ? 'active' : 'completed', progress: goal.status === 'completed' ? goal.progress : 100 }) }
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')
  const inputCls = "w-full px-4 py-2 border border-white/20 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all duration-200"

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">目标管理</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-lg shadow-indigo-500/20 btn-press"><Plus size={18} /><span className="hidden sm:inline">新建目标</span><span className="sm:hidden">新建</span></button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-2xl p-5 md:p-6 mb-6 md:mb-8 overflow-hidden shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm md:text-base">{editingId ? '编辑目标' : '新建目标'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="目标标题" className={inputCls} required />
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="目标描述（可选）" className={`${inputCls} resize-none py-3`} rows={2} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">目标日期</label><input type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} className="w-full px-4 py-2 border border-white/20 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 rounded-xl text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">进度 ({form.progress}%)</label><input type="range" min={0} max={100} value={form.progress} onChange={e => setForm(p => ({ ...p, progress: Number(e.target.value) }))} className="w-full mt-2 accent-indigo-600" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium btn-press shadow-lg shadow-indigo-500/20 transition-all duration-200">{editingId ? '保存更改' : '创建目标'}</button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-white/20 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-600 text-sm font-medium btn-press transition-all duration-200">取消</button>
            </div>
          </form>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="mb-8 md:mb-10">
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2.5"><Target size={20} className="text-indigo-500" />进行中 ({activeGoals.length})</h2>
        {activeGoals.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">暂无进行中的目标</p> : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5" variants={containerVariants}>
            {activeGoals.map((goal) => (
              <motion.div key={goal.id} variants={itemVariants} className="glass rounded-2xl p-5 card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1 mr-3"><h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{goal.title}</h3>{goal.description && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{goal.description}</p>}</div>
                  <div className="flex gap-1 shrink-0 bg-white/40 dark:bg-gray-800/40 rounded-xl p-1 shadow-sm border border-white/10">
                    <button onClick={() => handleComplete(goal)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-green-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press" title="标记完成"><CheckCircle size={18} /></button>
                    <button onClick={() => handleEdit(goal)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press"><Edit3 size={18} /></button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/50 dark:bg-gray-700/50 rounded-full h-3 overflow-hidden border border-white/20 shadow-inner"><motion.div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} /></div>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">{goal.progress}%</span>
                </div>
                {goal.target_date && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 bg-black/5 dark:bg-white/5 inline-block px-2 py-1 rounded-md">目标日期：{format(parseISO(goal.target_date), 'yyyy年M月d日')}</p>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2.5"><CheckCircle size={20} className="text-green-500" />已完成 ({completedGoals.length})</h2>
        {completedGoals.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">暂无已完成的目标</p> : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5" variants={containerVariants}>
            {completedGoals.map(goal => (
              <motion.div key={goal.id} variants={itemVariants} className="glass rounded-2xl p-5 opacity-70 hover:opacity-100 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1 mr-3"><h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg line-through">{goal.title}</h3>{goal.description && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{goal.description}</p>}</div>
                  <div className="flex gap-1 shrink-0 bg-white/40 dark:bg-gray-800/40 rounded-xl p-1 shadow-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => handleComplete(goal)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-amber-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press" title="重新打开"><XCircle size={18} /></button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/50 dark:bg-gray-700/50 rounded-full h-3 border border-white/20 shadow-inner"><div className="bg-green-500 h-full rounded-full" style={{ width: '100%' }} /></div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-md">100%</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
