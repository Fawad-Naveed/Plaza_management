// Optimized Supabase client with caching and performance improvements

import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './supabase/client'

// Simple in-memory cache for frequently accessed data
class SupabaseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Create a singleton cache instance
const supabaseCache = new SupabaseCache()

// Cleanup expired cache entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    supabaseCache.cleanup()
  }, 10 * 60 * 1000)
}

// Optimized Supabase client with built-in caching
export class OptimizedSupabaseClient {
  private client: SupabaseClient
  private cache: SupabaseCache

  constructor(client: SupabaseClient) {
    this.client = client
    this.cache = supabaseCache
  }

  // Cached SELECT queries
  async select<T>(
    table: string,
    options: {
      columns?: string
      filter?: Record<string, any>
      order?: { column: string; ascending?: boolean }
      limit?: number
      cacheTTL?: number
      cacheKey?: string
    } = {}
  ): Promise<{ data: T[] | null; error: any; fromCache: boolean }> {
    const cacheKey = options.cacheKey || this.generateCacheKey('select', table, options)
    
    // Try to get from cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return { data: cached, error: null, fromCache: true }
    }

    // Build query
    let query = this.client.from(table).select(options.columns || '*')

    // Apply filters
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    // Apply ordering
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? true })
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    // Cache successful results
    if (!error && data) {
      this.cache.set(cacheKey, data, options.cacheTTL)
    }

    return { data, error, fromCache: false }
  }

  // Optimized pagination
  async selectPaginated<T>(
    table: string,
    options: {
      columns?: string
      filter?: Record<string, any>
      order?: { column: string; ascending?: boolean }
      page: number
      pageSize: number
      cacheTTL?: number
    }
  ): Promise<{ data: T[] | null; error: any; totalCount: number | null; fromCache: boolean }> {
    const { page, pageSize, ...restOptions } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const cacheKey = this.generateCacheKey('select-paginated', table, options)
    
    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return { ...cached, fromCache: true }
    }

    // Build query with count
    let query = this.client.from(table).select(restOptions.columns || '*', { count: 'exact' })

    // Apply filters
    if (restOptions.filter) {
      Object.entries(restOptions.filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    // Apply ordering
    if (restOptions.order) {
      query = query.order(restOptions.order.column, { ascending: restOptions.order.ascending ?? true })
    }

    // Apply pagination
    query = query.range(from, to)

    const { data, error, count } = await query

    const result = { data, error, totalCount: count, fromCache: false }

    // Cache successful results
    if (!error && data) {
      this.cache.set(cacheKey, { data, error, totalCount: count }, restOptions.cacheTTL)
    }

    return result
  }

  // Batch operations for better performance
  async batchInsert<T>(
    table: string,
    data: T[],
    options: {
      chunkSize?: number
      onProgress?: (processed: number, total: number) => void
    } = {}
  ): Promise<{ data: T[] | null; error: any }> {
    const chunkSize = options.chunkSize || 1000
    const results: T[] = []
    let hasError = false
    let lastError: any = null

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      
      const { data: chunkData, error } = await this.client
        .from(table)
        .insert(chunk)
        .select()

      if (error) {
        hasError = true
        lastError = error
        break
      }

      if (chunkData) {
        results.push(...chunkData)
      }

      // Report progress
      if (options.onProgress) {
        options.onProgress(Math.min(i + chunkSize, data.length), data.length)
      }
    }

    // Invalidate related cache entries
    this.invalidateTableCache(table)

    return {
      data: hasError ? null : results,
      error: lastError
    }
  }

  // Optimized upsert with conflict resolution
  async upsert<T>(
    table: string,
    data: T | T[],
    options: {
      onConflict?: string
      ignoreDuplicates?: boolean
    } = {}
  ): Promise<{ data: T[] | null; error: any }> {
    const query = this.client.from(table).upsert(data, {
      onConflict: options.onConflict,
      ignoreDuplicates: options.ignoreDuplicates
    }).select()

    const result = await query

    // Invalidate cache for this table
    if (!result.error) {
      this.invalidateTableCache(table)
    }

    return result
  }

  // Real-time subscriptions with connection management
  subscribe<T>(
    table: string,
    callback: (payload: any) => void,
    options: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      filter?: string
    } = {}
  ) {
    const subscription = this.client
      .channel(`${table}_changes`)
      .on('postgres_changes', {
        event: options.event || '*',
        schema: 'public',
        table,
        filter: options.filter
      }, (payload) => {
        // Invalidate relevant cache entries when data changes
        this.invalidateTableCache(table)
        callback(payload)
      })
      .subscribe()

    return {
      unsubscribe: () => subscription.unsubscribe()
    }
  }

  // Cache management methods
  private generateCacheKey(operation: string, table: string, options: any): string {
    return `${operation}:${table}:${JSON.stringify(options)}`
  }

  private invalidateTableCache(table: string): void {
    // Remove all cache entries related to this table
    for (const [key] of this.cache['cache'].entries()) {
      if (key.includes(`:${table}:`)) {
        this.cache.delete(key)
      }
    }
  }

  public clearCache(): void {
    this.cache.clear()
  }

  // Access to underlying client for advanced operations
  get raw(): SupabaseClient {
    return this.client
  }
}

// Create optimized client instance
export function createOptimizedSupabaseClient() {
  const client = createClient()
  return new OptimizedSupabaseClient(client)
}

// Singleton instance for the app
let optimizedClient: OptimizedSupabaseClient | null = null

export function getOptimizedSupabaseClient() {
  if (!optimizedClient) {
    optimizedClient = createOptimizedSupabaseClient()
  }
  return optimizedClient
}

// Utility functions for common patterns
export const supabaseUtils = {
  // Efficient counting without fetching all data
  async getCount(client: OptimizedSupabaseClient, table: string, filter?: Record<string, any>) {
    let query = client.raw.from(table).select('*', { count: 'exact', head: true })
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { count, error } = await query
    return { count, error }
  },

  // Check if record exists efficiently
  async exists(client: OptimizedSupabaseClient, table: string, filter: Record<string, any>) {
    let query = client.raw.from(table).select('id', { head: true })
    
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    const { data, error } = await query.limit(1)
    return { exists: !!data, error }
  },

  // Bulk delete with batching
  async bulkDelete(client: OptimizedSupabaseClient, table: string, ids: string[], chunkSize = 1000) {
    const results = []
    
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize)
      const { data, error } = await client.raw.from(table).delete().in('id', chunk)
      
      if (error) return { error }
      results.push(...(data || []))
    }

    return { data: results, error: null }
  }
}
