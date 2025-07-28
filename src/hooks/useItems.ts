import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export interface Item {
  id: string
  name: string
  category: string
  default_price_usd: number
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('items')
          .select('id, name, category, default_price_usd')
          .order('name')

        if (error) {
          setError(error.message)
          return
        }

        setItems(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  return { items, loading, error }
}