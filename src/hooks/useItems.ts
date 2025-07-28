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
        const { data, error } = await supabase
          .from('item_cost')
          .select('id, name, category, avgPrice')
          .order('name')

        console.log('📊 Supabase response:', { data, error })
        
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