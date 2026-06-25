import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGoals } from '../hooks/useGoals'
import { Plus, Trash2, Edit3, Target, CheckCircle, XCircle } from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import CustomDatePicker from '../components/CustomDatePicker'
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns'
import { motion, type Variants, AnimatePresence } from 'framer-motion'

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string, title: string }>({ isOpen: false, id: '', title: '' })
  const [form, setForm] = useState({ title: '', description: '', target_date: format(new Date(), 'yyyy-MM-dd'), progress: 0, status: 'active' as 'active' | 'completed' | 'abandoned' })
  const resetForm = () => { setForm({ title: '', description: '', target_date: format(new Date(), 'yyyy-MM-dd'), progress: 0, status: 'active' }); setShowForm(false); setEditingId(null) }
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); const data = { ...form, target_date: form.target_date || null }; if (editingId) await updateGoal(editingId, data); else await addGoal(data); resetForm() }
  const handleEdit = (goal: typeof goals[0]) => { setForm({ title: goal.title, description: goal.description, target_date: goal.target_date || '', progress: goal.progress, status: goal.status }); setEditingId(goal.id); setShowForm(true) }
  const handleComplete = async (goal: typeof goals[0]) => { await updateGoal(goal.id, { status: goal.status === 'completed' ? 'active' : 'completed', progress: goal.status === 'completed' ? goal.progress : 100 }) }
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')
  const inputCls = "w-full px-4 py-2 border border-border-default bg-bg-secondary text-text-primary rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none text-sm transition-all duration-200"

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-text-primary">目标管理</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="px-4 py-2.5 bg-brand text-white rounded-xl hover:bg-brand-hover transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-none btn-press"><Plus size={18} /><span className="hidden sm:inline">新建目标</span><span className="sm:hidden">新建</span></button>
      </motion.div>

      <AnimatePresence>
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass rounded-2xl p-5 md:p-6 mb-6 md:mb-8 overflow-hidden">
          <h3 className="font-bold text-text-primary mb-4 text-sm md:text-base">{editingId ? '编辑目标' : '新建目标'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="目标标题" className={inputCls} required />
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="目标描述（可选）" className={`${inputCls} resize-none py-3`} rows={2} />
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">目标日期</label>
              <CustomDatePicker value={form.target_date} onChange={val => setForm(p => ({ ...p, target_date: val }))} placeholder="选择目标日期" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-5 py-2.5 bg-brand text-white rounded-xl hover:bg-brand-hover text-sm font-medium btn-press shadow-none transition-all duration-200">{editingId ? '保存更改' : '创建目标'}</button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-border-default text-text-secondary rounded-xl hover:bg-white dark:hover:bg-gray-600 text-sm font-medium btn-press transition-all duration-200">取消</button>
            </div>
          </form>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="mb-8 md:mb-10">
        <h2 className="text-lg font-bold text-text-secondary mb-4 flex items-center gap-2.5"><Target size={20} className="text-indigo-500" />进行中 ({activeGoals.length})</h2>
        {activeGoals.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">暂无进行中的目标</p> : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5" variants={containerVariants}>
            {activeGoals.map((goal) => (
              <motion.div key={goal.id} variants={itemVariants} className="glass rounded-2xl p-5 card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1 mr-3"><h3 className="font-bold text-text-primary text-lg">{goal.title}</h3>{goal.description && <p className="text-xs font-medium text-text-secondary mt-1 line-clamp-2">{goal.description}</p>}</div>
                  <div className="flex gap-1 shrink-0 bg-white/40 dark:bg-gray-800/40 rounded-xl p-1 shadow-sm border border-white/10">
                    <button onClick={() => handleComplete(goal)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-green-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press" title="标记完成"><CheckCircle size={18} /></button>
                    <button onClick={() => handleEdit(goal)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-brand hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press"><Edit3 size={18} /></button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: goal.id, title: goal.title })} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press"><Trash2 size={18} /></button>
                  </div>
                </div>
                {goal.target_date ? (() => {
                  const targetDate = parseISO(goal.target_date)
                  const diff = differenceInDays(targetDate, startOfDay(new Date()))
                  const isOverdue = diff < 0
                  return (
                    <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-3 py-2 rounded-lg mt-3">
                      <span className="text-xs font-medium text-text-secondary">目标日期：{format(targetDate, 'yyyy年M月d日')}</span>
                      <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-md ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : diff === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-brand'}`}>
                        {diff > 0 ? `还有 ${diff} 天` : diff === 0 ? '就是今天' : `已逾期 ${Math.abs(diff)} 天`}
                      </span>
                    </div>
                  )
                })() : (
                  <p className="text-xs font-medium text-text-secondary mt-3 bg-black/5 dark:bg-white/5 inline-block px-2 py-1 rounded-md">未设置目标日期</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-text-secondary mb-4 flex items-center gap-2.5"><CheckCircle size={20} className="text-green-500" />已完成 ({completedGoals.length})</h2>
        {completedGoals.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">暂无已完成的目标</p> : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5" variants={containerVariants}>
            {completedGoals.map(goal => (
              <motion.div key={goal.id} variants={itemVariants} className="glass rounded-2xl p-5 opacity-70 hover:opacity-100 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1 mr-3"><h3 className="font-bold text-text-primary text-lg line-through">{goal.title}</h3>{goal.description && <p className="text-xs font-medium text-text-secondary mt-1 line-clamp-2">{goal.description}</p>}</div>
                  <div className="flex gap-1 shrink-0 bg-white/40 dark:bg-gray-800/40 rounded-xl p-1 shadow-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => handleComplete(goal)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-amber-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press" title="重新打开"><XCircle size={18} /></button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: goal.id, title: goal.title })} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 btn-press"><Trash2 size={18} /></button>
                  </div>
                </div>
                {goal.target_date ? (
                  <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-3 py-2 rounded-lg mt-3">
                    <span className="text-xs font-medium text-text-secondary">目标日期：{format(parseISO(goal.target_date), 'yyyy年M月d日')}</span>
                    <span className="text-[10px] md:text-xs font-bold px-2 py-1 rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">已完成</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-3 py-2 rounded-lg mt-3">
                    <span className="text-xs font-medium text-text-secondary">未设置目标日期</span>
                    <span className="text-[10px] md:text-xs font-bold px-2 py-1 rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">已完成</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="删除目标"
        message={`确定要删除目标"${deleteConfirm.title}"吗？此操作无法撤销。`}
        onConfirm={() => {
          deleteGoal(deleteConfirm.id)
          setDeleteConfirm({ ...deleteConfirm, isOpen: false })
        }}
        onCancel={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
      />
    </motion.div>
  )
}
