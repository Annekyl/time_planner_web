import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Goal } from '../types'
import toast from 'react-hot-toast'

export function useGoals(userId: string | undefined) {
  const queryClient = useQueryClient()

  const {
    data: goals = [],
    isLoading: loading,
    refetch
  } = useQuery({
    queryKey: ['goals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
    enabled: !!userId
  })

  const addGoalMutation = useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goal, user_id: userId })
        .select()
        .single()
      if (error) throw error
      return data as Goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('添加目标成功')
    },
    onError: (e: Error) => toast.error(`添加失败: ${e.message}`)
  })

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Goal> }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: Error) => toast.error(`更新失败: ${e.message}`)
  })

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('删除成功')
    },
    onError: (e: Error) => toast.error(`删除失败: ${e.message}`)
  })

  const addGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try { await addGoalMutation.mutateAsync(goal); return { error: null } }
    catch (error) { return { error } }
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try { await updateGoalMutation.mutateAsync({ id, updates }); return { error: null } }
    catch (error) { return { error } }
  }

  const deleteGoal = async (id: string) => {
    try { await deleteGoalMutation.mutateAsync(id); return { error: null } }
    catch (error) { return { error } }
  }

  return { goals, loading, addGoal, updateGoal, deleteGoal, refetch }
}
