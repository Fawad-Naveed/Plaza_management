import { useState, useEffect } from 'react'
import { clientDb } from '@/lib/database'

export interface QueryCounts {
  open: number
  inProgress: number
  resolved: number
  total: number
}

export function useQueryCounts() {
  const [counts, setCounts] = useState<QueryCounts>({
    open: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQueryCounts()
    
    // Set up an interval to refresh counts every 30 seconds
    const interval = setInterval(loadQueryCounts, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadQueryCounts = async () => {
    try {
      setError(null)
      
      // Get all queries (admin can see all)
      const result = await clientDb.getQueries()
      
      if (result.error) {
        console.error('Error loading queries for counts:', result.error)
        setError('Failed to load query counts')
        return
      }

      const queries = result.data || []
      
      const newCounts: QueryCounts = {
        open: queries.filter(q => q.status === 'open').length,
        inProgress: queries.filter(q => q.status === 'in-progress').length,
        resolved: queries.filter(q => q.status === 'resolved').length,
        total: queries.length
      }

      setCounts(newCounts)
    } catch (error) {
      console.error('Error loading query counts:', error)
      setError('Failed to load query counts')
    } finally {
      setLoading(false)
    }
  }

  const refreshCounts = () => {
    loadQueryCounts()
  }

  return {
    counts,
    loading,
    error,
    refreshCounts
  }
}