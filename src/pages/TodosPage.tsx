import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTodos } from '../hooks/useTodos'
import { Check, Trash2, Plus, ListChecks } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function TodosPage() {
  const { user } = useAuth()
  const { todos, addTodo, toggleTodo, deleteTodo, updateContent } = useTodos(user?.id)
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingId && editInputRef.current) editInputRef.current.focus() }, [editingId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newContent.trim()
    if (!content) return
    await addTodo(content)
    setNewContent('')
    inputRef.current?.focus()
  }

  const handleToggle = async (id: string, completed: boolean) => { await toggleTodo(id, !completed) }
  const handleStartEdit = (todo: typeof todos[0]) => { setEditingId(todo.id); setEditContent(todo.content) }

  const handleSaveEdit = async (id: string) => {
    const content = editContent.trim()
    if (!content) await deleteTodo(id)
    else if (content !== todos.find(t => t.id === id)?.content) await updateContent(id, content)
    setEditingId(null)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') handleSaveEdit(id)
    else if (e.key === 'Escape') setEditingId(null)
  }

  const activeTodos = todos.filter(t => !t.completed)
  const completedTodos = todos.filter(t => t.completed)

  return (
    <motion.div 
      className="max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={itemVariants} className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 md:mb-6">
        待办事项
      </motion.h1>

      <motion.form variants={itemVariants} onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input ref={inputRef} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="添加新的待办事项..."
          className="flex-1 px-4 py-2.5 border border-white/20 shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-md text-gray-800 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all duration-200" />
        <button type="submit" disabled={!newContent.trim()}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-sm shrink-0 shadow-lg shadow-indigo-500/20 btn-press">
          <Plus size={18} /><span className="hidden sm:inline">添加</span>
        </button>
      </motion.form>

      {todos.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-16 text-gray-400 dark:text-gray-500">
          <ListChecks size={56} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium">暂无待办事项</p><p className="text-xs mt-1">在上方输入框添加</p>
        </motion.div>
      )}

      {activeTodos.length > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">待完成 ({activeTodos.length})</h2>
          <motion.div className="space-y-2" variants={containerVariants}>
            {activeTodos.map((todo) => (
              <motion.div key={todo.id} variants={itemVariants} className="flex items-center gap-3 p-3 glass rounded-xl hover:shadow-md transition-all duration-300 group">
                <button onClick={() => handleToggle(todo.id, todo.completed)} className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-500 hover:border-indigo-500 flex items-center justify-center shrink-0 transition-all duration-200 checkbox-bounce" />
                {editingId === todo.id ? (
                  <input ref={editInputRef} value={editContent} onChange={e => setEditContent(e.target.value)} onBlur={() => handleSaveEdit(todo.id)} onKeyDown={e => handleEditKeyDown(e, todo.id)}
                    className="flex-1 min-w-0 text-sm outline-none border-b border-indigo-500 pb-0.5 bg-transparent text-gray-800 dark:text-gray-200" />
                ) : (
                  <span onClick={() => handleStartEdit(todo)} className="flex-1 min-w-0 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-text truncate transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">{todo.content}</span>
                )}
                <button onClick={() => deleteTodo(todo.id)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 btn-press"><Trash2 size={14} /></button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {completedTodos.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">已完成 ({completedTodos.length})</h2>
          <motion.div className="space-y-2" variants={containerVariants}>
            {completedTodos.map(todo => (
              <motion.div key={todo.id} variants={itemVariants} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-white/10 shadow-sm opacity-60 hover:opacity-100 transition-all duration-300 group">
                <button onClick={() => handleToggle(todo.id, todo.completed)} className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center shrink-0 transition-all duration-300 checkbox-bounce"><Check size={12} className="text-white" /></button>
                <span className="flex-1 min-w-0 text-sm font-medium text-gray-500 dark:text-gray-400 line-through truncate">{todo.content}</span>
                <button onClick={() => deleteTodo(todo.id)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 btn-press"><Trash2 size={14} /></button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
