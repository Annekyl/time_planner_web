import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        (payload) => {
          // console.log('Realtime payload', payload)
          const table = payload.table
          if (table === 'tasks') {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
          } else if (table === 'time_blocks') {
            queryClient.invalidateQueries({ queryKey: ['timeBlocks'] })
          } else if (table === 'goals') {
            queryClient.invalidateQueries({ queryKey: ['goals'] })
          } else if (table === 'categories') {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
          }
          
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])
}
