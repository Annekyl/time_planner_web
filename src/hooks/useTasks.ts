import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, Category } from '../types'

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error && data) setTasks(data as Task[])
  }

  const fetchCategories = async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    if (!error && data) setCategories(data as Category[])
  }

  useEffect(() => {
    if (userId) {
      Promise.all([fetchTasks(), fetchCategories()]).then(() => setLoading(false))
    }
  }, [userId])

  const addTask = async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: userId })
      .select('*, category:categories(*)')
      .single()
    if (!error && data) setTasks(prev => [data as Task, ...prev])
    return { data, error }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single()
    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === id ? data as Task : t))
    }
    return { data, error }
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  const addCategory = async (name: string, color: string) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, user_id: userId })
      .select()
      .single()
    if (!error && data) setCategories(prev => [...prev, data as Category])
    return { data, error }
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) setCategories(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  return { tasks, categories, loading, addTask, updateTask, deleteTask, addCategory, deleteCategory, refetch: fetchTasks }
}
