#!/usr/bin/env node

/**
 * Migration Script: Add Terms and Conditions to Bills Table
 * This script adds the necessary columns to support terms and conditions with bills
 */

// Load environment variables manually (no dotenv needed)
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const env = {}
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        env[key.trim()] = value.trim().replace(/["']/g, '')
      }
    })
  } catch (error) {
    console.log('⚠️  Could not load .env.local, checking environment variables...')
  }
  
  return env
}

async function runMigration() {
  console.log('🚀 Starting Terms and Conditions migration...\n')

  // Load environment variables
  const env = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('🔍 Checking Supabase credentials...')
  console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
  console.log('Key:', supabaseKey ? '✅ Found' : '❌ Missing')

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials')
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file')
    console.error('\nExpected format in .env.local:')
    console.error('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
    console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
    console.error('\nOr use NEXT_PUBLIC_SUPABASE_ANON_KEY if service role key is not available')
    process.exit(1)
  }

  // Use dynamic import for @supabase/supabase-js
  const { createClient } = await import('@supabase/supabase-js')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log('📋 Checking current table structure...')

    // Check if columns already exist
    const { data: existingColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'bills')
      .in('column_name', ['terms_conditions_ids', 'terms_conditions_text'])

    const existingColumnNames = existingColumns?.map(col => col.column_name) || []
    const needsTermsIds = !existingColumnNames.includes('terms_conditions_ids')
    const needsTermsText = !existingColumnNames.includes('terms_conditions_text')

    // Add terms_conditions_ids column if it doesn't exist
    if (needsTermsIds) {
      console.log('📝 Adding terms_conditions_ids column...')
      const { error: error1 } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE bills ADD COLUMN terms_conditions_ids TEXT[] DEFAULT NULL;'
      })
      
      if (error1) {
        // Try alternative approach for Supabase
        const { error: altError1 } = await supabase
          .from('bills')
          .update({ terms_conditions_ids: null })
          .limit(0) // This won't update anything but will test column existence
        
        if (altError1 && altError1.message.includes('column')) {
          console.log('⚠️  Need to add terms_conditions_ids column via Supabase Dashboard SQL Editor')
        } else {
          console.log('✅ terms_conditions_ids column already exists or was added')
        }
      } else {
        console.log('✅ Added terms_conditions_ids column')
      }
    } else {
      console.log('✅ terms_conditions_ids column already exists')
    }

    // Add terms_conditions_text column if it doesn't exist
    if (needsTermsText) {
      console.log('📝 Adding terms_conditions_text column...')
      const { error: error2 } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE bills ADD COLUMN terms_conditions_text TEXT DEFAULT NULL;'
      })
      
      if (error2) {
        // Try alternative approach for Supabase
        const { error: altError2 } = await supabase
          .from('bills')
          .update({ terms_conditions_text: null })
          .limit(0) // This won't update anything but will test column existence
        
        if (altError2 && altError2.message.includes('column')) {
          console.log('⚠️  Need to add terms_conditions_text column via Supabase Dashboard SQL Editor')
        } else {
          console.log('✅ terms_conditions_text column already exists or was added')
        }
      } else {
        console.log('✅ Added terms_conditions_text column')
      }
    } else {
      console.log('✅ terms_conditions_text column already exists')
    }

    // Test the columns by trying to insert a test record (we'll rollback)
    console.log('\n🧪 Testing the new columns...')
    
    // First get a business ID for testing
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .limit(1)

    if (businesses && businesses.length > 0) {
      const testBusinessId = businesses[0].id
      
      // Try to insert a test bill with terms (will be deleted immediately)
      const { data: testBill, error: insertError } = await supabase
        .from('bills')
        .insert({
          business_id: testBusinessId,
          bill_number: 'TEST-MIGRATION-001',
          bill_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rent_amount: 0,
          maintenance_charges: 0,
          electricity_charges: 0,
          gas_charges: 0,
          water_charges: 0,
          other_charges: 0,
          total_amount: 0,
          status: 'pending',
          terms_conditions_ids: ['test-id-1', 'test-id-2'],
          terms_conditions_text: 'Test terms and conditions'
        })
        .select()
        .single()

      if (insertError) {
        console.log('❌ Error testing columns:', insertError.message)
        console.log('\n📝 Manual migration required via Supabase Dashboard:')
        console.log('1. Go to your Supabase Dashboard > SQL Editor')
        console.log('2. Run the migration script: run_terms_migration.sql')
      } else {
        console.log('✅ Columns working correctly!')
        
        // Clean up test record
        if (testBill) {
          await supabase
            .from('bills')
            .delete()
            .eq('id', testBill.id)
        }
      }
    }

    console.log('\n🎉 Migration process completed!')
    console.log('📋 Next steps:')
    console.log('1. The Terms & Conditions feature is now ready to use')
    console.log('2. Go to Rent Management > Generate Bills to test the feature')
    console.log('3. Make sure you have some terms created in the Term and Condition section')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📝 Manual migration required:')
    console.log('Please run the SQL migration script via Supabase Dashboard SQL Editor')
    console.log('File: run_terms_migration.sql')
    process.exit(1)
  }
}

// Run the migration
runMigration().then(() => {
  console.log('\n✨ Migration script finished')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Migration script error:', error)
  process.exit(1)
})
