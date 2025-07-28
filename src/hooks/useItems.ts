import { useState, useCallback, useEffect } from 'react'
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

  // TEST ON LOAD - DELETE THIS LATER
  useEffect(() => {
    async function testConnection() {
      console.log('🚨 TESTING DATABASE CONNECTION ON LOAD')
      const supabase = createClient()
      
      // Test 1: Basic select
      const { data, error } = await supabase
        .from('item_cost')
        .select('*')
        .limit(3)
      
      console.log('🚨 TEST RESULT:', { data, error })
      console.log('🚨 DATA LENGTH:', data?.length)
      console.log('🚨 FIRST ITEM:', data?.[0])
      
      // Test 2: Count query to see if RLS is blocking
      const { count, error: countError } = await supabase
        .from('item_cost')
        .select('*', { count: 'exact', head: true })
      
      console.log('🚨 COUNT TEST:', { count, countError })
      
      // Test 3: Check if we can see any data at all
      const { data: rawData, error: rawError } = await supabase
        .rpc('exec', { sql: 'SELECT COUNT(*) FROM item_cost' })
        .single()
      
      console.log('🚨 RAW SQL TEST:', { rawData, rawError })
    }
    testConnection()
  }, [])

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