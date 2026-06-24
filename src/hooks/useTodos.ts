import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Todo {
  id: string
  user_id: string
  content: string
  completed: boolean
  sort_order: number
  created_at: string
}

export function useTodos(userId: string | undefined) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTodos = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order')
    if (!error && data) setTodos(data as Todo[])
  }, [userId])

  useEffect(() => {
    if (userId) fetchTodos().then(() => setLoading(false))
  }, [userId, fetchTodos])

  const addTodo = async (content: string) => {
    if (!userId) return
    const maxOrder = todos.length > 0 ? Math.max(...todos.map(t => t.sort_order)) + 1 : 0
    const { data, error } = await supabase
      .from('todos')
      .insert({ content, user_id: userId, sort_order: maxOrder })
      .select()
      .single()
    if (!error && data) setTodos(prev => [...prev, data as Todo])
    return { data, error }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed })
      .eq('id', id)
    if (!error) {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
    }
    return { error }
  }

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (!error) setTodos(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  const updateContent = async (id: string, content: string) => {
    const { error } = await supabase
      .from('todos')
      .update({ content })
      .eq('id', id)
    if (!error) {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, content } : t))
    }
    return { error }
  }

  return { todos, loading, addTodo, toggleTodo, deleteTodo, updateContent, refetch: fetchTodos }
}
