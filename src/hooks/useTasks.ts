import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, Category } from '../types'

export function useTasks(userId: string | undefined, options?: { paginate?: boolean, startDate?: string, endDate?: string, status?: string, categoryId?: string, incompleteOnly?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 20

  const fetchTasks = async (page = 0, append = false) => {
    if (!userId) return
    let query = supabase
      .from('tasks')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.startDate) query = query.gte('due_date', options.startDate)
    if (options?.endDate) query = query.lte('due_date', options.endDate)
    if (options?.status && options.status !== 'all') query = query.eq('status', options.status)
    if (options?.categoryId && options.categoryId !== 'all') query = query.eq('category_id', options.categoryId)
    if (options?.incompleteOnly) query = query.in('status', ['pending', 'in_progress'])

    if (options?.paginate) {
      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    }

    const { data, error } = await query
    if (!error && data) {
      if (append) setTasks(prev => {
        const existingIds = new Set(prev.map(t => t.id))
        const newTasks = (data as Task[]).filter(t => !existingIds.has(t.id))
        return [...prev, ...newTasks]
      })
      else setTasks(data as Task[])
      setHasMore(data.length === PAGE_SIZE)
    }
  }

  const loadMore = async () => {
    if (!loading && hasMore) {
      const nextPage = Math.floor(tasks.length / PAGE_SIZE)
      await fetchTasks(nextPage, true)
    }
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
      Promise.all([fetchTasks(0, false), fetchCategories()]).then(() => setLoading(false))
    }
  }, [userId, options?.startDate, options?.endDate, options?.paginate, options?.status, options?.categoryId, options?.incompleteOnly])

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

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setCategories(prev => prev.map(c => c.id === id ? data as Category : c))
    return { data, error }
  }

  return { tasks, categories, loading, hasMore, loadMore, addTask, updateTask, deleteTask, addCategory, updateCategory, deleteCategory, refetch: () => fetchTasks(0, false) }
}
