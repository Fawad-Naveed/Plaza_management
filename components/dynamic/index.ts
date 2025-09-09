// Dynamic imports for heavy components to enable code splitting and improve performance

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading component for better UX during code splitting
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
  </div>
)

// Heavy components with dynamic imports - Original versions
export const BillGeneration = dynamic(() => import('../bill-generation'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Disable SSR for client-only components if needed
})

export const CustomerManagement = dynamic(() => import('../customer-management'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

// Optimized components with better performance
export const DashboardOptimized = dynamic(() => import('../dashboard-optimized').then(m => ({ default: m.DashboardOptimized })), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

export const BusinessManagementOptimized = dynamic(() => import('../business-management-optimized').then(m => ({ default: m.BusinessManagementOptimized })), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

export const MaintenanceModule = dynamic(() => import('../maintenance-module'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

export const PaymentManagement = dynamic(() => import('../payment-management'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

export const MeterReading = dynamic(() => import('../meter-reading'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

export const GasManagement = dynamic(() => import('../gas-management'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

export const ReportsModule = dynamic(() => import('../reports-module'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

// Chart components are often heavy - dynamically import if using recharts
export const Chart = dynamic(() => import('../ui/chart'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

// Export individual dynamic components for specific use cases
export const DynamicComponents = {
  BillGeneration,
  CustomerManagement,
  MaintenanceModule,
  PaymentManagement,
  MeterReading,
  GasManagement,
  ReportsModule,
  Chart,
  // Optimized components
  DashboardOptimized,
  BusinessManagementOptimized,
} as const

export type DynamicComponentName = keyof typeof DynamicComponents
