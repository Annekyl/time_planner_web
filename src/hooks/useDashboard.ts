import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export function useDashboard(userId: string | undefined) {
  const { data: dashboardData = null, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase.rpc('get_dashboard_data', { user_uuid: userId, current_date_str: todayStr })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  return { dashboardData, loading, rpcError: error ? error.message : null, refetch }
}
