import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Goal } from '../types'

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGoals = async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error && data) setGoals(data as Goal[])
  }

  useEffect(() => {
    if (userId) fetchGoals().then(() => setLoading(false))
  }, [userId])

  const addGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: userId })
      .select()
      .single()
    if (!error && data) setGoals(prev => [data as Goal, ...prev])
    return { data, error }
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setGoals(prev => prev.map(g => g.id === id ? data as Goal : g))
    }
    return { data, error }
  }

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (!error) setGoals(prev => prev.filter(g => g.id !== id))
    return { error }
  }

  return { goals, loading, addGoal, updateGoal, deleteGoal, refetch: fetchGoals }
}
