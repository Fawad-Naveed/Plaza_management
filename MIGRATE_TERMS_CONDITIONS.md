# 📋 Terms & Conditions Database Migration

This guide will help you add the necessary database columns to enable Terms & Conditions functionality with bill generation.

## 🎯 What This Migration Does

- Adds `terms_conditions_ids` column to store selected term IDs
- Adds `terms_conditions_text` column to store formatted terms text
- Both columns are nullable (can be NULL)
- Adds database index for better performance

## 🛠️ Migration Options

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to `SQL Editor`

2. **Run the Migration**
   - Copy and paste the content from `run_terms_migration.sql` 
   - Click `Run` to execute

### Option 2: Command Line (If you have PostgreSQL CLI access)

```bash
# Run the migration script
psql -d your_database_url -f run_terms_migration.sql
```

### Option 3: Manual SQL Commands

If you prefer to run commands one by one, execute these in your Supabase SQL Editor:

```sql
-- Check if columns exist first
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bills' 
AND column_name IN ('terms_conditions_ids', 'terms_conditions_text');

-- Add the columns (only if they don't exist)
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS terms_conditions_ids TEXT[] DEFAULT NULL;

ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS terms_conditions_text TEXT DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN bills.terms_conditions_ids IS 'Array of term and condition IDs that were selected for this bill';
COMMENT ON COLUMN bills.terms_conditions_text IS 'Formatted text of all selected terms and conditions for this bill';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bills_terms_conditions_ids ON bills USING GIN (terms_conditions_ids);

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bills' 
AND column_name IN ('terms_conditions_ids', 'terms_conditions_text')
ORDER BY ordinal_position;
```

## ✅ Verification

After running the migration, verify it worked:

1. **Check Column Creation**
   ```sql
   \d bills
   ```
   You should see the new columns listed.

2. **Test Insert** 
   The application should now work with Terms & Conditions!

## 🚀 Using the Feature

After migration:

1. **Add Terms & Conditions**
   - Go to "Term and Condition" in your sidebar
   - Add some terms and conditions

2. **Generate Bills with Terms**
   - Go to "Rent Management" > "Generate Bills"
   - You'll see a new "Terms & Conditions" section
   - Toggle terms on/off as needed
   - Generate the bill

3. **Print Bills with Terms**
   - Generated PDFs will include selected terms
   - Terms appear after the bill total

## 🔧 Rollback (If Needed)

If you need to remove the columns:

```sql
-- Remove the columns (BE CAREFUL - this will delete data)
ALTER TABLE bills DROP COLUMN IF EXISTS terms_conditions_ids;
ALTER TABLE bills DROP COLUMN IF EXISTS terms_conditions_text;

-- Remove the index
DROP INDEX IF EXISTS idx_bills_terms_conditions_ids;
```

## 📞 Support

If you encounter any issues:
1. Check that your Supabase project has the necessary permissions
2. Verify the `bills` table exists
3. Make sure you have admin/owner access to run ALTER TABLE commands

---

**Next Steps**: After successful migration, the Terms & Conditions feature will be fully functional! 🎉
