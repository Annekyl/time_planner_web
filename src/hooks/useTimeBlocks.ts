import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TimeBlock } from '../types'
import { format, parseISO, addDays, addWeeks, addMonths } from 'date-fns'
import toast from 'react-hot-toast'

export function useTimeBlocks(userId: string | undefined, options?: { startDate?: string, endDate?: string }) {
  const queryClient = useQueryClient()

  const {
    data: timeBlocks = [],
    isLoading: loading,
    refetch
  } = useQuery({
    queryKey: ['timeBlocks', userId, options],
    queryFn: async () => {
      let query = supabase
        .from('time_blocks')
        .select('*, category:categories(*), task:tasks(*)')
        .eq('user_id', userId)
        .order('start_time')

      if (options?.startDate) query = query.gte('date', options.startDate)
      if (options?.endDate) query = query.lte('date', options.endDate)

      const { data, error } = await query
      if (error) throw error
      return data as TimeBlock[]
    },
    enabled: !!userId
  })

  // Mutations
  const addTimeBlockMutation = useMutation({
    mutationFn: async (block: Omit<TimeBlock, 'id' | 'user_id' | 'created_at' | 'category' | 'task'>) => {
      const { data, error } = await supabase
        .from('time_blocks')
        .insert({ ...block, user_id: userId })
        .select('*, category:categories(*), task:tasks(*)')
        .single()
      if (error) throw error
      return data as TimeBlock
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('添加时间块成功')
    },
    onError: (e: Error) => toast.error(`添加失败: ${e.message}`)
  })

  const updateTimeBlockMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<TimeBlock> }) => {
      const { data, error } = await supabase
        .from('time_blocks')
        .update(updates)
        .eq('id', id)
        .select('*, category:categories(*), task:tasks(*)')
        .single()
      if (error) throw error
      return data as TimeBlock
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e: Error) => toast.error(`更新失败: ${e.message}`)
  })

  const deleteTimeBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_blocks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('删除成功')
    },
    onError: (e: Error) => toast.error(`删除失败: ${e.message}`)
  })

  const toggleTimeBlockMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
      const block = timeBlocks.find(b => b.id === id)
      if (!block) throw new Error('Block not found')

      if (completed && block.recurrence_rule) {
        const currentDue = parseISO(block.date)
        let nextDate = new Date(currentDue)
        const rule = block.recurrence_rule
        if (rule.type === 'daily') nextDate = addDays(currentDue, 1)
        else if (rule.type === 'weekly') nextDate = addWeeks(currentDue, 1)
        else if (rule.type === 'monthly') nextDate = addMonths(currentDue, 1)
        else if (rule.type === 'custom') {
          if (rule.unit === 'days') nextDate = addDays(currentDue, rule.interval || 1)
          else if (rule.unit === 'weeks') nextDate = addWeeks(currentDue, rule.interval || 1)
          else if (rule.unit === 'months') nextDate = addMonths(currentDue, rule.interval || 1)
        }
        
        await supabase.from('time_blocks').insert({
          title: block.title,
          date: format(nextDate, 'yyyy-MM-dd'),
          start_time: block.start_time,
          end_time: block.end_time,
          color: block.color,
          category_id: block.category_id,
          task_id: block.task_id,
          completed: false,
          recurrence_rule: block.recurrence_rule,
          user_id: userId
        })
      }

      const { data, error } = await supabase
        .from('time_blocks')
        .update({ completed })
        .eq('id', id)
        .select('*, category:categories(*), task:tasks(*)')
        .single()
      if (error) throw error
      return data as TimeBlock
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: Error) => toast.error(`状态更新失败: ${e.message}`)
  })

  // Return original interface wrappers
  const addTimeBlock = async (block: Omit<TimeBlock, 'id' | 'user_id' | 'created_at' | 'category' | 'task'>) => {
    try { await addTimeBlockMutation.mutateAsync(block); return { error: null } }
    catch (error) { return { error } }
  }

  const updateTimeBlock = async (id: string, updates: Partial<TimeBlock>) => {
    try { await updateTimeBlockMutation.mutateAsync({ id, updates }); return { error: null } }
    catch (error) { return { error } }
  }

  const deleteTimeBlock = async (id: string) => {
    try { await deleteTimeBlockMutation.mutateAsync(id); return { error: null } }
    catch (error) { return { error } }
  }

  const toggleTimeBlock = async (id: string, completed: boolean) => {
    try { await toggleTimeBlockMutation.mutateAsync({ id, completed }); return { error: null } }
    catch (error) { return { error } }
  }

  return { 
    timeBlocks, 
    loading, 
    addTimeBlock, 
    updateTimeBlock, 
    deleteTimeBlock, 
    toggleTimeBlock, 
    refetch 
  }
}
