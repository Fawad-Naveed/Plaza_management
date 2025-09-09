// Performance monitoring hooks for Next.js app

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Hook to measure component render performance
export function useRenderPerformance(componentName?: string) {
  const renderStart = useRef<number>(0)
  const renderCount = useRef<number>(0)

  useEffect(() => {
    renderStart.current = performance.now()
    renderCount.current += 1

    return () => {
      const renderEnd = performance.now()
      const renderTime = renderEnd - renderStart.current

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName || 'Component'} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`)
      }

      // In production, you might want to send this to analytics
      if (process.env.NODE_ENV === 'production' && renderTime > 100) {
        // Send to analytics service (e.g., Google Analytics, Mixpanel, etc.)
        // analytics.track('slow_render', {
        //   component: componentName,
        //   renderTime,
        //   renderCount: renderCount.current
        // })
      }
    }
  })

  return { renderCount: renderCount.current }
}

// Hook to measure page load performance
export function usePagePerformance() {
  const [metrics, setMetrics] = useState<{
    fcp?: number
    lcp?: number
    fid?: number
    cls?: number
    ttfb?: number
  }>({})
  
  const router = useRouter()

  useEffect(() => {
    // Measure Core Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // First Contentful Paint (FCP)
      const paintEntries = performance.getEntriesByType('paint')
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      
      // Time to First Byte (TTFB)
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const ttfb = navigationEntry?.responseStart - navigationEntry?.requestStart

      setMetrics(prev => ({
        ...prev,
        fcp: fcpEntry?.startTime,
        ttfb: ttfb
      }))

      // Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        setMetrics(prev => ({
          ...prev,
          lcp: lastEntry.startTime
        }))
      })

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        // LCP might not be supported
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value
          }
        }
        setMetrics(prev => ({
          ...prev,
          cls: clsValue
        }))
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // CLS might not be supported
      }

      return () => {
        observer.disconnect()
        clsObserver.disconnect()
      }
    }
  }, [router])

  return metrics
}

// Hook to measure database query performance
export function useQueryPerformance() {
  const [queryMetrics, setQueryMetrics] = useState<{
    totalQueries: number
    averageQueryTime: number
    slowQueries: Array<{ query: string; time: number }>
  }>({
    totalQueries: 0,
    averageQueryTime: 0,
    slowQueries: []
  })

  const measureQuery = async <T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now()
    
    try {
      const result = await queryFunction()
      const end = performance.now()
      const queryTime = end - start

      setQueryMetrics(prev => {
        const newTotalQueries = prev.totalQueries + 1
        const newAverageQueryTime = (prev.averageQueryTime * prev.totalQueries + queryTime) / newTotalQueries
        
        let newSlowQueries = [...prev.slowQueries]
        if (queryTime > 1000) { // Queries slower than 1 second
          newSlowQueries.push({ query: queryName, time: queryTime })
          // Keep only the last 10 slow queries
          if (newSlowQueries.length > 10) {
            newSlowQueries = newSlowQueries.slice(-10)
          }
        }

        return {
          totalQueries: newTotalQueries,
          averageQueryTime: newAverageQueryTime,
          slowQueries: newSlowQueries
        }
      })

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Query Performance] ${queryName}: ${queryTime.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const end = performance.now()
      const queryTime = end - start

      if (process.env.NODE_ENV === 'development') {
        console.error(`[Query Performance] ${queryName} failed after ${queryTime.toFixed(2)}ms:`, error)
      }

      throw error
    }
  }

  return { queryMetrics, measureQuery }
}

// Hook to detect slow network conditions
export function useNetworkPerformance() {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
  }>({})

  useEffect(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      if (connection) {
        const updateNetworkInfo = () => {
          setNetworkInfo({
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          })
        }

        updateNetworkInfo()
        connection.addEventListener('change', updateNetworkInfo)

        return () => {
          connection.removeEventListener('change', updateNetworkInfo)
        }
      }
    }
  }, [])

  return networkInfo
}
