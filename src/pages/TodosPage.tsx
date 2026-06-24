import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTodos } from '../hooks/useTodos'
import { Check, Trash2, Plus, ListChecks } from 'lucide-react'

export default function TodosPage() {
  const { user } = useAuth()
  const { todos, addTodo, toggleTodo, deleteTodo, updateContent } = useTodos(user?.id)
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newContent.trim()
    if (!content) return
    await addTodo(content)
    setNewContent('')
    inputRef.current?.focus()
  }

  const handleToggle = async (id: string, completed: boolean) => {
    await toggleTodo(id, !completed)
  }

  const handleStartEdit = (todo: typeof todos[0]) => {
    setEditingId(todo.id)
    setEditContent(todo.content)
  }

  const handleSaveEdit = async (id: string) => {
    const content = editContent.trim()
    if (!content) {
      await deleteTodo(id)
    } else if (content !== todos.find(t => t.id === id)?.content) {
      await updateContent(id, content)
    }
    setEditingId(null)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  const activeTodos = todos.filter(t => !t.completed)
  const completedTodos = todos.filter(t => t.completed)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">待办事项</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          ref={inputRef}
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="添加新的待办事项..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={!newContent.trim()}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 text-sm shrink-0"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">添加</span>
        </button>
      </form>

      {todos.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ListChecks size={56} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">暂无待办事项</p>
          <p className="text-xs mt-1">在上方输入框添加</p>
        </div>
      )}

      {activeTodos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            待完成 ({activeTodos.length})
          </h2>
          <div className="space-y-1.5">
            {activeTodos.map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group"
              >
                <button
                  onClick={() => handleToggle(todo.id, todo.completed)}
                  className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-indigo-500 flex items-center justify-center shrink-0 transition"
                />
                {editingId === todo.id ? (
                  <input
                    ref={editInputRef}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    onBlur={() => handleSaveEdit(todo.id)}
                    onKeyDown={e => handleEditKeyDown(e, todo.id)}
                    className="flex-1 min-w-0 text-sm outline-none border-b border-indigo-500"
                  />
                ) : (
                  <span
                    onClick={() => handleStartEdit(todo)}
                    className="flex-1 min-w-0 text-sm text-gray-700 cursor-text truncate"
                  >
                    {todo.content}
                  </span>
                )}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedTodos.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            已完成 ({completedTodos.length})
          </h2>
          <div className="space-y-1.5">
            {completedTodos.map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm opacity-60 group"
              >
                <button
                  onClick={() => handleToggle(todo.id, todo.completed)}
                  className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center shrink-0 transition"
                >
                  <Check size={12} className="text-white" />
                </button>
                <span className="flex-1 min-w-0 text-sm text-gray-400 line-through truncate">
                  {todo.content}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
