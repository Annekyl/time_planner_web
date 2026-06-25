import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { UserSettings } from '../types'

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'> = {
  morning_start: '06:00',
  morning_end: '12:00',
  afternoon_start: '12:00',
  afternoon_end: '18:00',
  evening_start: '18:00',
  evening_end: '23:59',
  hour_height: 48
}

export function useSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!error && data) {
      setSettings(data as UserSettings)
    } else {
      // Create default settings if not exists
      const { data: newData, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: userId, ...DEFAULT_SETTINGS })
        .select('*')
        .single()
      
      if (!insertError && newData) {
        setSettings(newData as UserSettings)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (userId) fetchSettings()
  }, [userId])

  const updateSettings = async (updates: Partial<Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!userId || !settings) return { error: { message: 'Settings not loaded' } }
    
    // Optimistic update
    setSettings(prev => prev ? { ...prev, ...updates } as UserSettings : null)

    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select('*')
      .single()
      
    if (error) {
      // Revert on error
      await fetchSettings()
    } else if (data) {
      setSettings(data as UserSettings)
    }
    return { data, error }
  }

  // Helper to ensure we always have valid settings for UI components
  const safeSettings = settings || { user_id: userId || '', ...DEFAULT_SETTINGS, created_at: '', updated_at: '' }

  return { settings: safeSettings, loading, updateSettings }
}
