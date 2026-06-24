import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { TimeBlock } from '../types'

export function useTimeBlocks(userId: string | undefined) {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTimeBlocks = async (startDate?: string, endDate?: string) => {
    if (!userId) return
    let query = supabase
      .from('time_blocks')
      .select('*, category:categories(*), task:tasks(*)')
      .eq('user_id', userId)
      .order('start_time')

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query
    if (!error && data) setTimeBlocks(data as TimeBlock[])
  }

  useEffect(() => {
    if (userId) fetchTimeBlocks().then(() => setLoading(false))
  }, [userId])

  const addTimeBlock = async (block: Omit<TimeBlock, 'id' | 'user_id' | 'created_at' | 'category' | 'task'>) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('time_blocks')
      .insert({ ...block, user_id: userId })
      .select('*, category:categories(*), task:tasks(*)')
      .single()
    if (!error && data) setTimeBlocks(prev => [...prev, data as TimeBlock].sort((a, b) => a.start_time.localeCompare(b.start_time)))
    return { data, error }
  }

  const updateTimeBlock = async (id: string, updates: Partial<TimeBlock>) => {
    const { data, error } = await supabase
      .from('time_blocks')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*), task:tasks(*)')
      .single()
    if (!error && data) {
      setTimeBlocks(prev => prev.map(b => b.id === id ? data as TimeBlock : b))
    }
    return { data, error }
  }

  const deleteTimeBlock = async (id: string) => {
    const { error } = await supabase.from('time_blocks').delete().eq('id', id)
    if (!error) setTimeBlocks(prev => prev.filter(b => b.id !== id))
    return { error }
  }

  const toggleTimeBlock = async (id: string, completed: boolean) => {
    const { data, error } = await supabase
      .from('time_blocks')
      .update({ completed })
      .eq('id', id)
      .select('*, category:categories(*), task:tasks(*)')
      .single()
    if (!error && data) {
      setTimeBlocks(prev => prev.map(b => b.id === id ? data as TimeBlock : b))
    }
    return { data, error }
  }

  return { timeBlocks, loading, addTimeBlock, updateTimeBlock, deleteTimeBlock, toggleTimeBlock, refetch: fetchTimeBlocks }
}
