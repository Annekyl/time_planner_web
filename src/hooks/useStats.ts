import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useStats(userId: string | undefined) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    if (!userId) return
    const { data, error } = await supabase.rpc('get_user_stats', { user_uuid: userId })
    if (!error && data) {
      setStats(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (userId) {
      fetchStats()
    }
  }, [userId])

  return { stats, loading, refetch: fetchStats }
}
