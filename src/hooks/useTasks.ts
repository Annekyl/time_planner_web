import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Task, Category } from '../types'
import toast from 'react-hot-toast'

export function useTasks(userId: string | undefined, options?: { paginate?: boolean, startDate?: string, endDate?: string, status?: string, categoryId?: string, incompleteOnly?: boolean }) {
  const queryClient = useQueryClient()
  const PAGE_SIZE = 20

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name')
      if (error) throw error
      return data as Category[]
    },
    enabled: !!userId
  })

  const {
    data: tasksData,
    fetchNextPage,
    hasNextPage: hasMore,
    isLoading: tasksLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['tasks', userId, options],
    queryFn: async ({ pageParam = 0 }) => {
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
        query = query.range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Task[]
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!options?.paginate) return undefined
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined
    },
    initialPageParam: 0,
    enabled: !!userId
  })

  const tasks = tasksData?.pages.flat() || []
  const loading = tasksLoading || categoriesLoading

  const loadMore = async () => {
    if (hasMore) await fetchNextPage()
  }

  // Mutations
  const addTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: userId })
        .select('*, category:categories(*)')
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('添加任务成功')
    },
    onError: (e: Error) => toast.error(`添加失败: ${e.message}`)
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select('*, category:categories(*)')
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: Error) => toast.error(`更新失败: ${e.message}`)
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('删除成功')
    },
    onError: (e: Error) => toast.error(`删除失败: ${e.message}`)
  })

  const addCategoryMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string, color: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, color, user_id: userId })
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('添加分类成功')
    },
    onError: (e: Error) => toast.error(`添加失败: ${e.message}`)
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Category> }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('分类更新成功')
    },
    onError: (e: Error) => toast.error(`更新失败: ${e.message}`)
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('删除分类成功')
    },
    onError: (e: Error) => toast.error(`删除失败: ${e.message}`)
  })

  // Return original interface wrappers
  const addTask = async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>) => {
    try { await addTaskMutation.mutateAsync(task); return { error: null } }
    catch (error) { return { error } }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try { await updateTaskMutation.mutateAsync({ id, updates }); return { error: null } }
    catch (error) { return { error } }
  }

  const deleteTask = async (id: string) => {
    try { await deleteTaskMutation.mutateAsync(id); return { error: null } }
    catch (error) { return { error } }
  }

  const addCategory = async (name: string, color: string) => {
    try { await addCategoryMutation.mutateAsync({ name, color }); return { error: null } }
    catch (error) { return { error } }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try { await updateCategoryMutation.mutateAsync({ id, updates }); return { error: null } }
    catch (error) { return { error } }
  }

  const deleteCategory = async (id: string) => {
    try { await deleteCategoryMutation.mutateAsync(id); return { error: null } }
    catch (error) { return { error } }
  }

  return { 
    tasks, 
    categories, 
    loading, 
    hasMore, 
    loadMore, 
    addTask, 
    updateTask, 
    deleteTask, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    refetch 
  }
}
