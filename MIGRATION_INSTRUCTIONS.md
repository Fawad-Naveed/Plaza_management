# Database Migration Instructions

## Step 1: Run the Migration Script

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrate-to-partial-payments.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

## Step 2: Verify Migration

After running the migration, your database should have:
- Table `partial_payments` (renamed from `instalments`)
- New columns: `payment_entries` (JSONB), `total_paid_amount` (DECIMAL)
- Renamed column: `total_rent_amount` (was `total_amount`)
- Removed old installment-related columns

## Step 3: Test the Application

1. Restart your Next.js application
2. Navigate to Business Management → Partial Payments
3. Try creating a new partial payment record
4. Verify that the system works as expected

## Troubleshooting

If you encounter any issues:

1. **Table not found error**: Make sure the migration script ran successfully
2. **Column errors**: Check that all old columns were removed and new ones were added
3. **Permission errors**: Ensure your Supabase user has proper permissions

## Rollback (if needed)

If you need to rollback the changes:

```sql
-- This is just a reference - create a backup before migration!
ALTER TABLE partial_payments RENAME TO instalments;
-- You would need to restore the original schema manually
```

**IMPORTANT**: Always backup your data before running migrations!
