import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useStats(userId: string | undefined) {
  const { data: stats = null, isLoading: loading, refetch } = useQuery({
    queryKey: ['stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_stats', { user_uuid: userId })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  return { stats, loading, refetch }
}
