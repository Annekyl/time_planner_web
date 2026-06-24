import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface DailyPlan {
  id: string
  user_id: string
  date: string
  period: 'morning' | 'afternoon' | 'evening'
  content: string
  task_id: string | null
  completed: boolean
  sort_order: number
  created_at: string
}

export function useDailyPlans(userId: string | undefined) {
  const [plans, setPlans] = useState<DailyPlan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async (date?: string) => {
    if (!userId) return
    let query = supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', userId)
    if (date) query = query.eq('date', date)
    query = query.order('sort_order')
    const { data, error } = await query
    if (!error && data) setPlans(data as DailyPlan[])
  }, [userId])

  useEffect(() => {
    if (userId) fetchPlans().then(() => setLoading(false))
  }, [userId, fetchPlans])

  const fetchPlansByDate = async (date: string) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('sort_order')
    if (!error && data) setPlans(data as DailyPlan[])
  }

  const addPlan = async (date: string, period: 'morning' | 'afternoon' | 'evening', content: string, taskId?: string) => {
    if (!userId) return
    const periodPlans = plans.filter(p => p.date === date && p.period === period)
    const maxOrder = periodPlans.length > 0 ? Math.max(...periodPlans.map(p => p.sort_order)) + 1 : 0
    const { data, error } = await supabase
      .from('daily_plans')
      .insert({ date, period, content, user_id: userId, task_id: taskId || null, sort_order: maxOrder })
      .select()
      .single()
    if (!error && data) setPlans(prev => [...prev, data as DailyPlan])
    return { data, error }
  }

  const togglePlan = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('daily_plans')
      .update({ completed })
      .eq('id', id)
    if (!error) {
      setPlans(prev => prev.map(p => p.id === id ? { ...p, completed } : p))
    }
    return { error }
  }

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('daily_plans').delete().eq('id', id)
    if (!error) setPlans(prev => prev.filter(p => p.id !== id))
    return { error }
  }

  const updateContent = async (id: string, content: string) => {
    const { error } = await supabase
      .from('daily_plans')
      .update({ content })
      .eq('id', id)
    if (!error) {
      setPlans(prev => prev.map(p => p.id === id ? { ...p, content } : p))
    }
    return { error }
  }

  return { plans, loading, fetchPlansByDate, addPlan, togglePlan, deletePlan, updateContent }
}
