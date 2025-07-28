import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export interface Item {
  id: number
  name: string
  category: string | null
  avgPrice: number
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        console.log('🔍 Fetching items from item_cost table...')
        const supabase = createClient()
        console.log('🔧 Supabase client config:', {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
        })
        
        // First try a simple count to test connection
        const { count } = await supabase
          .from('item_cost')
          .select('*', { count: 'exact', head: true })
        
        console.log('📊 Table count:', count)
        
        // Now try the actual query
        const { data, error } = await supabase
          .from('item_cost')
          .select('*')
          .limit(5)

        console.log('📊 Supabase response:', { data, error })
        console.log('📊 Raw data:', data)
        console.log('📊 Raw error:', error)
        
        if (error) {
          console.error('❌ Supabase error:', error)
          setError(error.message)
          return
        }

        console.log('✅ Items loaded:', data?.length || 0, 'items')
        console.log('📋 First 3 items:', data?.slice(0, 3))
        setItems(data || [])
      } catch (err) {
        console.error('💥 Fetch error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  return { items, loading, error }
}