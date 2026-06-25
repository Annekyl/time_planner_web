import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export function useDashboard(userId: string | undefined) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    if (!userId) return
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase.rpc('get_dashboard_data', { user_uuid: userId, current_date_str: todayStr })
    if (!error && data) {
      setDashboardData(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (userId) {
      fetchDashboardData()
    }
  }, [userId])

  return { dashboardData, loading, refetch: fetchDashboardData }
}
