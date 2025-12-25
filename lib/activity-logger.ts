// Activity Logger - Helper functions to log user actions
import { createClient as createBrowserClient } from "./supabase/client"
import { getAuthState } from "./auth"

export interface ActivityLog {
  id?: string
  user_id?: string
  user_type: 'owner' | 'admin' | 'business'
  username: string
  action_type: string
  entity_type?: string
  entity_id?: string
  entity_name?: string
  description: string
  old_value?: any
  new_value?: any
  amount?: number
  notes?: string
  created_at?: string
}

export interface ActivityLogFilters {
  startDate?: string
  endDate?: string
  actionType?: string
  username?: string
  entityName?: string
  userType?: string
  page?: number
  pageSize?: number
}

/**
 * Log an activity/action performed by a user
 */
export async function logActivity(params: {
  action_type: string
  entity_type?: string
  entity_id?: string
  entity_name?: string
  description: string
  old_value?: any
  new_value?: any
  amount?: number
  notes?: string
}): Promise<void> {
  try {
    const authState = getAuthState()
    if (!authState || !authState.success) {
      console.warn('No auth state available for activity logging')
      return
    }

    const supabase = createBrowserClient()

    const logEntry = {
      user_id: authState.userId || authState.businessId,
      user_type: authState.role as 'owner' | 'admin' | 'business',
      username: authState.userName || authState.businessName || 'Unknown',
      action_type: params.action_type,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      entity_name: params.entity_name,
      description: params.description,
      old_value: params.old_value ? JSON.stringify(params.old_value) : null,
      new_value: params.new_value ? JSON.stringify(params.new_value) : null,
      amount: params.amount,
      notes: params.notes,
    }

    const { error } = await supabase
      .from('activity_logs')
      .insert(logEntry)

    if (error) {
      console.error('Failed to log activity:', error)
    }
  } catch (error) {
    console.error('Activity logging error:', error)
  }
}

/**
 * Get activity logs with filters and pagination
 */
export async function getActivityLogs(
  filters: ActivityLogFilters = {}
): Promise<{ logs: ActivityLog[], total: number }> {
  const supabase = createBrowserClient()
  
  const pageSize = filters.pageSize || 20
  const page = filters.page || 1
  const offset = (page - 1) * pageSize

  // Build query
  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  if (filters.actionType) {
    query = query.eq('action_type', filters.actionType)
  }
  if (filters.username) {
    query = query.ilike('username', `%${filters.username}%`)
  }
  if (filters.entityName) {
    query = query.ilike('entity_name', `%${filters.entityName}%`)
  }
  if (filters.userType) {
    query = query.eq('user_type', filters.userType)
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Parse JSON fields
  const logs = (data || []).map(log => ({
    ...log,
    old_value: log.old_value ? JSON.parse(log.old_value) : null,
    new_value: log.new_value ? JSON.parse(log.new_value) : null,
  }))

  return {
    logs,
    total: count || 0
  }
}

/**
 * Get unique action types for filter dropdown
 */
export async function getActionTypes(): Promise<string[]> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('activity_logs')
    .select('action_type')
    .order('action_type')

  if (error) {
    console.error('Failed to fetch action types:', error)
    return []
  }

  // Get unique action types
  const uniqueTypes = [...new Set(data?.map(item => item.action_type) || [])]
  return uniqueTypes
}

/**
 * Get unique usernames for filter dropdown
 */
export async function getUsernames(): Promise<string[]> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('activity_logs')
    .select('username')
    .order('username')

  if (error) {
    console.error('Failed to fetch usernames:', error)
    return []
  }

  // Get unique usernames
  const uniqueUsernames = [...new Set(data?.map(item => item.username) || [])]
  return uniqueUsernames
}

// Predefined action type constants for consistency
export const ACTION_TYPES = {
  // Bills
  BILL_GENERATED: 'bill_generated',
  BILL_CANCELLED: 'bill_cancelled',
  BILL_WAVEOFF: 'bill_waveoff',
  BILL_EDITED: 'bill_edited',
  
  // Payments
  PAYMENT_SUBMITTED: 'payment_submitted',
  PAYMENT_APPROVED: 'payment_approved',
  PAYMENT_REJECTED: 'payment_rejected',
  PAYMENT_RECORDED: 'payment_recorded',
  
  // Business
  BUSINESS_CREATED: 'business_created',
  BUSINESS_EDITED: 'business_edited',
  BUSINESS_STATUS_CHANGED: 'business_status_changed',
  
  // Admin Management
  ADMIN_CREATED: 'admin_created',
  ADMIN_EDITED: 'admin_edited',
  ADMIN_DELETED: 'admin_deleted',
  ADMIN_ACTIVATED: 'admin_activated',
  ADMIN_DEACTIVATED: 'admin_deactivated',
  ADMIN_PERMISSIONS_CHANGED: 'admin_permissions_changed',
  
  // Advances & Instalments
  ADVANCE_CREATED: 'advance_created',
  ADVANCE_ADJUSTED: 'advance_adjusted',
  INSTALMENT_CREATED: 'instalment_created',
  INSTALMENT_PAYMENT: 'instalment_payment',
  
  // Settings
  SETTINGS_CHANGED: 'settings_changed',
  
  // Queries
  QUERY_SUBMITTED: 'query_submitted',
  QUERY_RESPONDED: 'query_responded',
  QUERY_STATUS_CHANGED: 'query_status_changed',
  
  // Maintenance
  MAINTENANCE_BILL_GENERATED: 'maintenance_bill_generated',
  MAINTENANCE_PAYMENT: 'maintenance_payment',
  
  // Meter Reading
  METER_READING_ADDED: 'meter_reading_added',
  METER_READING_EDITED: 'meter_reading_edited',
} as const

// Helper function to format action type for display
export function formatActionType(actionType: string): string {
  return actionType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to format user type badge
export function getUserTypeBadgeColor(userType: string): string {
  switch (userType) {
    case 'owner':
      return 'bg-purple-100 text-purple-800'
    case 'admin':
      return 'bg-blue-100 text-blue-800'
    case 'business':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
