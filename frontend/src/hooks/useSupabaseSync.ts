import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useSupabaseClient } from '../lib/supabaseWithAuth'

export function useSupabaseSync() {
  const { user, isLoaded } = useUser()
  const supabase = useSupabaseClient()

  useEffect(() => {
    if (!isLoaded || !user) return

    const syncUserToSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            first_name: user.firstName,
            last_name: user.lastName,
            avatar_url: user.imageUrl,
            updated_at: new Date().toISOString(),
          })
          .select()

        if (error) {
          console.error('Error syncing user to Supabase:', error)
        } else {
          console.log('User synced to Supabase:', data)
        }
      } catch (error) {
        console.error('Error syncing user:', error)
      }
    }

    syncUserToSupabase()
  }, [user, isLoaded, supabase])

  return { user, isLoaded }
}