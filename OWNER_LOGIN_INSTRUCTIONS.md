# Owner Login Instructions

## Step 1: Run the Database Migration

Before you can log in as an owner, you need to create the owner/admin tables in your Supabase database.

1. Open your Supabase project dashboard
2. Go to the **SQL Editor**
3. Open the file `create-owner-admin-system.sql` from your project root
4. Copy all the SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the migration

This will:
- Create the `owners`, `admins`, and `admin_permissions` tables
- Set up indexes and RLS policies
- Create a default owner account

## Step 2: Log In as Owner

Once the migration is complete, you can log in as owner:

**Default Owner Credentials:**
- **Role**: Owner
- **Username**: `owner`
- **Password**: `owner123`

### Login Steps:
1. Go to your application's login page
2. Select **"Owner"** from the role dropdown
3. Enter username: `owner`
4. Enter password: `owner123`
5. Click **Sign In**

## Step 3: Change Default Password (IMPORTANT!)

For security reasons, you should change the default owner password immediately after first login:

1. After logging in, navigate to **Settings**
2. Find the password change option
3. Update to a strong, secure password

## What You Can Do as Owner

As an owner, you have full access to:

### All Admin Features:
- Dashboard
- Business Management
- Rent Management
- Payment Management
- Electricity Management
- Gas Management
- Maintenance Management
- Reports
- Expense Tracking
- Queries
- Wave off Management
- Terms & Conditions
- Settings

### Plus Admin Management:
- **Create Admins**: Add new admin users with custom permissions
- **Manage Permissions**: Assign specific sections each admin can access
- **Edit Admins**: Update admin details, permissions, and passwords
- **Activate/Deactivate**: Enable or disable admin accounts
- **Delete Admins**: Remove admin users

## Creating Your First Admin

1. Log in as owner
2. Navigate to **"Admin Management"** in the sidebar
3. Click **"Add Admin"** button
4. Fill in the form:
   - Username (unique)
   - Email (unique)
   - Full Name
   - Password
   - Select permissions (which sections the admin can access)
5. Click **"Create Admin"**

## Example: Creating a Rent-Only Admin

If you want an admin who can only handle rent management:

1. Create a new admin with username like `rent_admin`
2. In the permissions section, check only:
   - Dashboard (optional, for overview)
   - Rent Management
   - Payment Management (if they need to see payments)
3. Leave all other permissions unchecked
4. Save the admin

When this admin logs in, they will only see the sections you've allowed.

## Testing Admin Login

After creating an admin:
1. Log out from the owner account
2. On the login page, select **"Admin"** as the role
3. Enter the admin's username and password
4. Log in - the admin will only see their permitted sections

## Troubleshooting

### Can't See Owner Option in Login
- Make sure you've run the database migration
- Clear your browser cache
- Refresh the page

### Login Fails
- Verify the database migration ran successfully
- Check that the `owners` table exists in Supabase
- Ensure you selected "Owner" from the role dropdown
- Double-check username and password (case-sensitive)

### Permission Errors
- Make sure RLS policies are enabled
- Verify the SQL migration completed without errors
- Check Supabase logs for any policy-related errors

## Database Tables Created

The migration creates these tables:
- `owners`: Stores owner accounts
- `admins`: Stores admin user accounts
- `admin_permissions`: Stores which sections each admin can access

You can view these tables in your Supabase **Table Editor**.

## Security Notes

1. **Change the default owner password immediately**
2. Use strong passwords for all admin accounts
3. Only grant admins the permissions they actually need
4. Regularly review admin accounts and permissions
5. Deactivate admin accounts when they're no longer needed instead of deleting (to preserve audit trail)

## Next Steps

1. Run the database migration
2. Log in as owner
3. Change the default password
4. Create your first admin users
5. Test admin login with different permission sets
6. Customize the system to your needs

For any issues, check the browser console and Supabase logs for error messages.
