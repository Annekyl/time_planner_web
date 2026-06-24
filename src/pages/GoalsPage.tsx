import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGoals } from '../hooks/useGoals'
import { Plus, Trash2, Edit3, Target, CheckCircle, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function GoalsPage() {
  const { user } = useAuth()
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', target_date: '', progress: 0, status: 'active' as 'active' | 'completed' | 'abandoned' })

  const resetForm = () => {
    setForm({ title: '', description: '', target_date: '', progress: 0, status: 'active' })
    setShowForm(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, target_date: form.target_date || null }
    if (editingId) {
      await updateGoal(editingId, data)
    } else {
      await addGoal(data)
    }
    resetForm()
  }

  const handleEdit = (goal: typeof goals[0]) => {
    setForm({
      title: goal.title, description: goal.description,
      target_date: goal.target_date || '', progress: goal.progress, status: goal.status,
    })
    setEditingId(goal.id)
    setShowForm(true)
  }

  const handleComplete = async (goal: typeof goals[0]) => {
    await updateGoal(goal.id, {
      status: goal.status === 'completed' ? 'active' : 'completed',
      progress: goal.status === 'completed' ? goal.progress : 100,
    })
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6 fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">目标管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-1.5 text-xs md:text-sm btn-press"
        >
          <Plus size={16} /> <span className="hidden sm:inline">新建目标</span><span className="sm:hidden">新建</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4 md:mb-6 slide-down">
          <h3 className="font-medium text-gray-700 mb-4 text-sm md:text-base">{editingId ? '编辑目标' : '新建目标'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="目标标题"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all duration-200"
              required
            />
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="目标描述（可选）"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm transition-all duration-200"
              rows={2}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">目标日期</label>
                <input type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">进度 ({form.progress}%)</label>
                <input
                  type="range" min={0} max={100} value={form.progress}
                  onChange={e => setForm(p => ({ ...p, progress: Number(e.target.value) }))}
                  className="w-full mt-2 accent-indigo-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm btn-press transition-all duration-200">
                {editingId ? '保存' : '创建'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm btn-press transition-all duration-200">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 md:mb-8">
        <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-4 flex items-center gap-2 fade-in" style={{ animationDelay: '0.05s' }}>
          <Target size={18} className="text-indigo-500" />
          进行中 ({activeGoals.length})
        </h2>
        {activeGoals.length === 0 ? (
          <p className="text-gray-400 text-sm fade-in">暂无进行中的目标</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {activeGoals.map((goal, i) => (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 card-hover fade-in" style={{ animationDelay: `${0.05 * (i + 1)}s` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-2">
                    <h3 className="font-medium text-gray-800">{goal.title}</h3>
                    {goal.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{goal.description}</p>}
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={() => handleComplete(goal)} className="p-1.5 text-gray-400 hover:text-green-600 transition-all duration-200 btn-press" title="标记完成">
                      <CheckCircle size={16} />
                    </button>
                    <button onClick={() => handleEdit(goal)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-all duration-200 btn-press">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-all duration-200 btn-press">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-indigo-500 h-2.5 rounded-full progress-bar" style={{ width: `${goal.progress}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-600">{goal.progress}%</span>
                </div>
                {goal.target_date && (
                  <p className="text-xs text-gray-400 mt-2">
                    目标日期：{format(parseISO(goal.target_date), 'yyyy年M月d日')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-4 flex items-center gap-2 fade-in" style={{ animationDelay: '0.1s' }}>
          <CheckCircle size={18} className="text-green-500" />
          已完成 ({completedGoals.length})
        </h2>
        {completedGoals.length === 0 ? (
          <p className="text-gray-400 text-sm fade-in">暂无已完成的目标</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {completedGoals.map(goal => (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 opacity-70 hover:opacity-90 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-2">
                    <h3 className="font-medium text-gray-800 line-through">{goal.title}</h3>
                    {goal.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{goal.description}</p>}
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={() => handleComplete(goal)} className="p-1.5 text-gray-400 hover:text-amber-600 transition-all duration-200 btn-press" title="重新打开">
                      <XCircle size={16} />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-all duration-200 btn-press">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '100%' }} />
                  </div>
                  <span className="text-sm font-medium text-green-600">100%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
