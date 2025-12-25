# Activity History / Audit Log System

## Overview

The Activity History system provides a complete audit trail of all actions performed in the plaza management system. It logs user actions, tracks changes, and provides filtering and search capabilities.

## Implementation Complete ✅

### Files Created:
1. `create-activity-logs-table.sql` - Database migration script
2. `lib/activity-logger.ts` - Helper functions for logging activities
3. `components/activity-history.tsx` - UI component for viewing activity logs

### Files Modified:
1. `components/owner-portal.tsx` - Added Activity History menu item
2. `components/plaza-management-app.tsx` - Added Activity History menu item

## Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `create-activity-logs-table.sql`
4. Paste and execute in Supabase SQL Editor

This creates:
- `activity_logs` table with all necessary fields
- Indexes for optimal query performance
- RLS policies
- A view for easy querying (`activity_logs_view`)

### Step 2: Verify Menu Item

The "Activity History" menu item is now available:
- **Location**: Above "Settings" in the sidebar
- **Access**: Owner and admins (with "activity-history" permission)
- **Icon**: History icon

## Usage

### Viewing Activity Logs

1. Log in as owner or admin
2. Navigate to **Activity History** in the sidebar
3. View all logged activities with:
   - Timestamp
   - User who performed the action
   - Action type
   - Entity affected
   - Amount (for financial transactions)
   - Description

### Filtering

Filter logs by:
- **Date Range**: Start date and end date
- **Action Type**: Select from dropdown of all action types
- **User**: Filter by specific username
- **Business/Entity Name**: Search for specific entities
- **User Type**: Filter by owner, admin, or business

### Viewing Details

Click the eye icon on any log entry to view:
- Complete details
- Old value vs new value (for edits)
- Additional notes
- Full JSON data

### Pagination

- 20 entries per page
- Navigate with Previous/Next buttons
- Shows current page and total pages

## Integrating Activity Logging

To log activities in your existing components, use the `logActivity` function:

```typescript
import { logActivity, ACTION_TYPES } from '@/lib/activity-logger'

// Example: Log bill generation
await logActivity({
  action_type: ACTION_TYPES.BILL_GENERATED,
  entity_type: 'bill',
  entity_id: billId,
  entity_name: `Bill ${billNumber}`,
  description: `Generated rent bill for ${businessName}`,
  amount: billAmount,
  notes: 'Monthly rent bill'
})
```

### Available Action Types

```typescript
// Bills
ACTION_TYPES.BILL_GENERATED
ACTION_TYPES.BILL_CANCELLED
ACTION_TYPES.BILL_WAVEOFF
ACTION_TYPES.BILL_EDITED

// Payments
ACTION_TYPES.PAYMENT_SUBMITTED
ACTION_TYPES.PAYMENT_APPROVED
ACTION_TYPES.PAYMENT_REJECTED
ACTION_TYPES.PAYMENT_RECORDED

// Business
ACTION_TYPES.BUSINESS_CREATED
ACTION_TYPES.BUSINESS_EDITED
ACTION_TYPES.BUSINESS_STATUS_CHANGED

// Admin Management
ACTION_TYPES.ADMIN_CREATED
ACTION_TYPES.ADMIN_EDITED
ACTION_TYPES.ADMIN_DELETED
ACTION_TYPES.ADMIN_ACTIVATED
ACTION_TYPES.ADMIN_DEACTIVATED
ACTION_TYPES.ADMIN_PERMISSIONS_CHANGED

// Advances & Instalments
ACTION_TYPES.ADVANCE_CREATED
ACTION_TYPES.ADVANCE_ADJUSTED
ACTION_TYPES.INSTALMENT_CREATED
ACTION_TYPES.INSTALMENT_PAYMENT

// Settings
ACTION_TYPES.SETTINGS_CHANGED

// Queries
ACTION_TYPES.QUERY_SUBMITTED
ACTION_TYPES.QUERY_RESPONDED
ACTION_TYPES.QUERY_STATUS_CHANGED

// Maintenance
ACTION_TYPES.MAINTENANCE_BILL_GENERATED
ACTION_TYPES.MAINTENANCE_PAYMENT

// Meter Reading
ACTION_TYPES.METER_READING_ADDED
ACTION_TYPES.METER_READING_EDITED
```

## Integration Examples

### Example 1: Log Admin Creation

In `components/admin-management.tsx`, add after successful admin creation:

```typescript
await createAdmin(adminData)

// Log the activity
await logActivity({
  action_type: ACTION_TYPES.ADMIN_CREATED,
  entity_type: 'admin',
  entity_id: admin.id,
  entity_name: adminData.username,
  description: `Created admin: ${adminData.full_name} with permissions: ${adminData.permissions.join(', ')}`,
  new_value: {
    username: adminData.username,
    email: adminData.email,
    permissions: adminData.permissions
  }
})
```

### Example 2: Log Payment Approval

```typescript
await approvePendingPayment(pendingPaymentId, adminName)

// Log the activity
await logActivity({
  action_type: ACTION_TYPES.PAYMENT_APPROVED,
  entity_type: 'payment',
  entity_id: pendingPaymentId,
  entity_name: businessName,
  description: `Approved payment of ${amount} for ${businessName}`,
  amount: amount,
  notes: `Bill number: ${billNumber}`
})
```

### Example 3: Log Business Creation

```typescript
const business = await createBusiness(businessData)

// Log the activity
await logActivity({
  action_type: ACTION_TYPES.BUSINESS_CREATED,
  entity_type: 'business',
  entity_id: business.id,
  entity_name: businessData.name,
  description: `Created new business: ${businessData.name}`,
  new_value: {
    name: businessData.name,
    shop_number: businessData.shop_number,
    floor_number: businessData.floor_number,
    rent_amount: businessData.rent_amount
  }
})
```

### Example 4: Log Business Edit with Old/New Values

```typescript
const oldBusiness = await getBusinessById(businessId)

await updateBusiness(businessId, newData)

// Log the activity with before/after
await logActivity({
  action_type: ACTION_TYPES.BUSINESS_EDITED,
  entity_type: 'business',
  entity_id: businessId,
  entity_name: oldBusiness.name,
  description: `Updated business: ${oldBusiness.name}`,
  old_value: {
    rent_amount: oldBusiness.rent_amount,
    status: oldBusiness.status
  },
  new_value: {
    rent_amount: newData.rent_amount,
    status: newData.status
  }
})
```

### Example 5: Log Query Submission (Business Portal)

```typescript
await submitQuery(queryData)

// Log the activity
await logActivity({
  action_type: ACTION_TYPES.QUERY_SUBMITTED,
  entity_type: 'query',
  entity_id: query.id,
  entity_name: businessName,
  description: `Submitted query: ${queryData.subject}`,
  notes: queryData.message
})
```

## Components to Integrate

### Priority 1 - Core Actions (Implement First):
1. **Bill Generation** (`components/bill-generation.tsx`)
   - Log when bills are generated
   - Log when bills are cancelled

2. **Payment Management** (`components/payment-management.tsx`)
   - Log payment approvals
   - Log payment rejections
   - Log payment recording

3. **Admin Management** (`components/admin-management.tsx`)
   - Log admin creation ✅
   - Log admin editing ✅
   - Log admin deletion ✅
   - Log permission changes ✅

### Priority 2 - Secondary Actions:
4. **Business Management** (`components/customer-management.tsx`)
   - Log business creation
   - Log business editing
   - Log status changes

5. **Maintenance Module** (`components/maintenance-module.tsx`)
   - Log maintenance bill generation
   - Log wave-offs

6. **Wave off Module** (`components/waveoff-module.tsx`)
   - Log wave-off actions

### Priority 3 - Additional Features:
7. **Meter Reading** (`components/meter-reading.tsx`, `components/gas-management.tsx`)
   - Log meter reading additions
   - Log meter reading edits

8. **Queries** (`components/admin-queries.tsx`, `components/business-queries.tsx`)
   - Log query submissions
   - Log query responses
   - Log status changes

9. **Settings** (`components/settings.tsx`)
   - Log settings changes

10. **Advances & Instalments**
    - Log advance creation
    - Log instalment creation/payments

## Best Practices

### 1. Always Log After Success
Only log activities after the action has successfully completed:

```typescript
try {
  await performAction()
  // Only log if action succeeded
  await logActivity({...})
} catch (error) {
  // Don't log failed actions
  console.error(error)
}
```

### 2. Use Descriptive Messages
Make descriptions human-readable and informative:
```typescript
description: `Generated rent bill #${billNumber} for ${businessName} - Amount: $${amount}`
```

### 3. Include Relevant Context
Add old/new values for edits and notes for additional context:
```typescript
old_value: { status: 'pending' },
new_value: { status: 'approved' },
notes: 'Approved by finance team'
```

### 4. Track Financial Amounts
Always include amounts for financial transactions:
```typescript
amount: totalBillAmount
```

### 5. Use Consistent Entity Names
Use business names, bill numbers, or admin usernames for quick identification

## Database Schema

### activity_logs Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | ID of user who performed action |
| user_type | VARCHAR | 'owner', 'admin', or 'business' |
| username | VARCHAR | Username for display |
| action_type | VARCHAR | Type of action |
| entity_type | VARCHAR | Type of entity affected |
| entity_id | UUID | ID of affected entity |
| entity_name | VARCHAR | Name for quick display |
| description | TEXT | Human-readable description |
| old_value | JSONB | Previous state (for edits) |
| new_value | JSONB | New state (for edits) |
| amount | DECIMAL | Financial amount |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | When action occurred |

## Performance Considerations

- **Indexes**: Optimized for common queries (user_id, action_type, created_at)
- **Pagination**: 20 records per page to keep queries fast
- **No deletion**: Logs are permanent (no delete function)
- **Async logging**: Logging doesn't block user actions (fire and forget)

## Security & Privacy

- **RLS**: Row Level Security enabled
- **No PII**: Avoid logging sensitive personal information
- **Access Control**: Only owner can see all logs (future: admin sees based on permissions)
- **Audit Trail**: Complete history retained forever

## Troubleshooting

### Logs Not Appearing
1. Verify database migration ran successfully
2. Check that `activity_logs` table exists
3. Verify RLS policies are correct
4. Check browser console for errors

### Filter Not Working
1. Ensure filter options are loading (check network tab)
2. Verify query syntax in `getActivityLogs` function
3. Check for console errors

### Pagination Issues
1. Verify total count is correct
2. Check page calculation logic
3. Ensure offset is calculated properly

## Future Enhancements

1. **Export**: Export logs to CSV/PDF
2. **Real-time Updates**: WebSocket for live log updates
3. **Advanced Search**: Full-text search in descriptions
4. **Retention Policy**: Archive old logs after X months
5. **Alerts**: Notify owner of critical actions
6. **Dashboard**: Activity summary dashboard
7. **Comparison View**: Side-by-side old vs new value comparison
8. **Rollback**: Ability to undo certain actions

## Testing Checklist

- [ ] Database migration executed successfully
- [ ] Activity History menu item visible
- [ ] Can view activity logs
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Detail view shows complete information
- [ ] Logs are created when actions are performed
- [ ] Old/new values are captured correctly
- [ ] Amount is displayed for financial transactions
- [ ] Timestamps are accurate

## Summary

The Activity History system is now fully set up and ready for integration. The next step is to add `logActivity()` calls throughout your existing components to start tracking user actions.

Start with the high-priority components (bills, payments, admin management) and gradually add logging to other areas of the system.
