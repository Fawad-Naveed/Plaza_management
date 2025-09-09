/**
 * Dynamic imports for optimized components
 * These components are lazily loaded with performance optimizations
 */

import dynamic from 'next/dynamic'

// Optimized Business Management with Form Validation
export const BusinessManagementOptimized = dynamic(
  () => import('../business-management-optimized').then(m => ({ default: m.BusinessManagementOptimized })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ),
  }
)

// Optimized Dashboard with Lazy Loading
export const DashboardOptimized = dynamic(
  () => import('../dashboard-optimized').then(m => ({ default: m.DashboardOptimized })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  }
)

// Form Validation Testing Demo
export const ValidationTestDemo = dynamic(
  () => import('../validation-test-demo').then(m => ({ default: m.ValidationTestDemo })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ),
  }
)

// Export all optimized components
export * from '../business-management-optimized'
export * from '../dashboard-optimized' 
export * from '../validation-test-demo'
