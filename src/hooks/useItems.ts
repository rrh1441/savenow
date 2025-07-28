import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export interface Item {
  id: number
  name: string
  category: string | null
  avgPrice: number
}

export function useItemSearch() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchItems = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setItems([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Searching for:', searchTerm)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('item_cost')
        .select('id, name, category, "avgPrice"')
        .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .limit(20)

      console.log('📊 Search results:', { data, error, searchTerm })
      
      if (error) {
        console.error('❌ Search error:', error)
        setError(error.message)
        return
      }

      console.log('✅ Found:', data?.length || 0, 'items')
      setItems(data || [])
    } catch (err) {
      console.error('💥 Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return { items, loading, error, searchItems }
}