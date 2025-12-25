# Owner Portal & Admin Permission System - Testing Guide

## Prerequisites

Before testing, make sure you have:
1. ✅ Run the database migration script (`create-owner-admin-system.sql`)
2. ✅ Verified the tables were created successfully in Supabase
3. ✅ Started your development server

## Test Scenarios

### 1. Owner Login & Portal Access

**Objective**: Verify owner can log in and access all features including admin management.

**Steps**:
1. Go to the login page
2. Select **"Owner"** from the role dropdown
3. Enter username: `owner`
4. Enter password: `owner123`
5. Click **Sign In**

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to owner portal
- ✅ Sidebar shows "Admin Portal" title
- ✅ All navigation items visible including **"Admin Management"**
- ✅ Can access all sections (Dashboard, Business Management, Rent Management, etc.)
- ✅ Admin Management section shows empty state initially

---

### 2. Create Admin with Limited Permissions

**Objective**: Create an admin user with only Rent Management access.

**Steps**:
1. While logged in as owner, navigate to **Admin Management**
2. Click **"Add Admin"** button
3. Fill in the form:
   - Username: `rent_admin`
   - Email: `rent@example.com`
   - Full Name: `Rent Admin`
   - Password: `rent123`
   - Confirm Password: `rent123`
4. In the Permissions section:
   - ✅ Check **Dashboard**
   - ✅ Check **Rent Management**
   - Leave all other permissions unchecked
5. Click **"Create Admin"**

**Expected Results**:
- ✅ Success message appears
- ✅ Admin appears in the admin list table
- ✅ Admin shows "Active" status
- ✅ Permissions column shows "dashboard" and "rent-billing" badges

---

### 3. Test Admin Login with Limited Permissions

**Objective**: Verify admin only sees permitted sections.

**Steps**:
1. Log out from owner account (click Sign Out in sidebar)
2. On login page, select **"Admin"** from role dropdown
3. Enter username: `rent_admin`
4. Enter password: `rent123`
5. Click **Sign In**

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to admin portal
- ✅ Sidebar shows only 2 items:
  - Dashboard
  - Rent Management (with subsections: Generate Bills, All Bills)
- ✅ No other navigation items visible
- ✅ Cannot access Business Management, Payment Management, etc.
- ✅ Admin Management section NOT visible

**Test Direct URL Access**:
1. While logged in as `rent_admin`, manually try to navigate to a forbidden section (e.g., type URL for business management)
2. Expected: Error message "You don't have permission to access this section"

---

### 4. Create Full-Access Admin

**Objective**: Create an admin with all permissions.

**Steps**:
1. Log out and log back in as owner
2. Go to Admin Management
3. Click **"Add Admin"**
4. Fill in form:
   - Username: `full_admin`
   - Email: `full@example.com`
   - Full Name: `Full Access Admin`
   - Password: `full123`
   - Confirm Password: `full123`
5. In Permissions section, click **"Select All Permissions"** checkbox
6. Click **"Create Admin"**

**Expected Results**:
- ✅ Admin created successfully
- ✅ Shows all 13 permission badges in admin list

**Test Login**:
1. Log out and log in as `full_admin` (role: Admin)
2. Expected: Can see all sections just like owner (except Admin Management)

---

### 5. Create Custom Permission Set

**Objective**: Create an admin with billing and payment permissions only.

**Steps**:
1. Log in as owner
2. Create new admin:
   - Username: `billing_admin`
   - Email: `billing@example.com`
   - Full Name: `Billing Admin`
   - Password: `billing123`
3. Select only these permissions:
   - ✅ Dashboard
   - ✅ Rent Management
   - ✅ Payment Management
   - ✅ Electricity Management
   - ✅ Gas Management
4. Create admin

**Test Login**:
1. Log in as `billing_admin`
2. Expected sidebar items:
   - Dashboard
   - Rent Management
   - Payment Management
   - Electricity Management
   - Gas Management
3. Should NOT see: Business Management, Maintenance, Reports, Expenses, Queries, etc.

---

### 6. Edit Admin Permissions

**Objective**: Modify an existing admin's permissions.

**Steps**:
1. Log in as owner
2. Go to Admin Management
3. Find `rent_admin` in the list
4. Click the **Edit** button (pencil icon)
5. Add additional permissions:
   - Keep existing: Dashboard, Rent Management
   - Add: Payment Management
6. Click **"Update Admin"**

**Expected Results**:
- ✅ Success message appears
- ✅ Admin list updates to show new permissions
- ✅ If `rent_admin` is logged in elsewhere, they need to log out and back in to see changes

**Test Updated Permissions**:
1. Log out and log back in as `rent_admin`
2. Expected: Now can see Dashboard, Rent Management, AND Payment Management

---

### 7. Deactivate and Reactivate Admin

**Objective**: Test admin account activation/deactivation.

**Steps**:
1. Log in as owner
2. Go to Admin Management
3. Find `billing_admin`
4. Click the **Deactivate** button (X icon)
5. Observe status changes to "Inactive"

**Test Inactive Login**:
1. Log out and try to log in as `billing_admin`
2. Expected: Login fails with message "Admin account is disabled. Contact owner."

**Reactivate**:
1. Log back in as owner
2. Click the **Activate** button (check icon) for `billing_admin`
3. Try logging in as `billing_admin` again
4. Expected: Login successful

---

### 8. Delete Admin

**Objective**: Test admin deletion.

**Steps**:
1. Log in as owner
2. Go to Admin Management
3. Click **Delete** button (trash icon) for an admin
4. Confirm deletion in the popup

**Expected Results**:
- ✅ Admin removed from list
- ✅ If that admin tries to log in, login fails

---

### 9. Change Admin Password

**Objective**: Update an admin's password.

**Steps**:
1. Log in as owner
2. Go to Admin Management
3. Click **Edit** for an admin
4. Enter new password: `newpass123`
5. Confirm password: `newpass123`
6. Click **"Update Admin"**

**Test New Password**:
1. Log out
2. Try logging in as that admin with old password - should fail
3. Log in with new password - should succeed

---

### 10. Username and Email Uniqueness

**Objective**: Verify validation prevents duplicate usernames/emails.

**Steps**:
1. Log in as owner
2. Try to create a new admin with username `rent_admin` (already exists)
3. Expected: Error message "Username already exists"
4. Try with unique username but email `rent@example.com` (already exists)
5. Expected: Error message "Email already exists"

---

### 11. Permission Validation

**Objective**: Ensure at least one permission is required.

**Steps**:
1. Log in as owner
2. Try to create an admin without selecting any permissions
3. Click **"Create Admin"**
4. Expected: Error message "At least one permission is required"

---

### 12. Session Persistence

**Objective**: Verify authentication state persists across page refreshes.

**Steps**:
1. Log in as any user (owner or admin)
2. Refresh the page (F5)
3. Expected: Still logged in, same sections visible

**Test Session Isolation**:
1. Log in as `rent_admin` in one browser
2. Open a private/incognito window
3. Log in as owner
4. Both sessions should work independently

---

## Test Results Checklist

### Owner Portal
- [ ] Owner can log in successfully
- [ ] Owner sees all navigation items
- [ ] Owner can access Admin Management section
- [ ] Owner can create admins
- [ ] Owner can edit admins
- [ ] Owner can delete admins
- [ ] Owner can activate/deactivate admins
- [ ] Owner can change admin passwords
- [ ] Owner can assign custom permissions

### Admin Portal with Permissions
- [ ] Admin sees only permitted sections in sidebar
- [ ] Admin cannot access unpermitted sections via URL
- [ ] Permission filtering works correctly
- [ ] Subsections inherit parent permission (e.g., customer-add requires "customer" permission)
- [ ] Admin cannot see Admin Management section
- [ ] Error message shown when trying to access forbidden section

### Authentication
- [ ] Owner login works with correct credentials
- [ ] Admin login works with correct credentials
- [ ] Inactive admin cannot log in
- [ ] Wrong password fails login
- [ ] Username must be unique
- [ ] Email must be unique
- [ ] Sessions persist across page refreshes
- [ ] Logout works correctly

### Validation
- [ ] All required fields validated on admin creation
- [ ] Password must be at least 6 characters
- [ ] Passwords must match
- [ ] Email format validated
- [ ] At least one permission required
- [ ] Username availability checked before creation

## Common Issues & Solutions

### Issue: Owner login fails
**Solution**: 
- Verify database migration ran successfully
- Check that `owners` table exists in Supabase
- Verify the password hash is correct in the database

### Issue: Admin can't see any sections after login
**Solution**:
- Check that permissions were assigned during admin creation
- Verify `admin_permissions` table has entries for that admin
- Try editing admin and re-assigning permissions

### Issue: Permission changes not reflected
**Solution**:
- Admin must log out and log back in to see permission changes
- Clear browser cache if needed

### Issue: "Permission denied" error when accessing features
**Solution**:
- Verify RLS policies are set up correctly in Supabase
- Check browser console for detailed error messages
- Ensure `admin_permissions` table has correct entries

## Performance Testing

### Load Test
1. Create 10-20 admin users with various permission sets
2. Verify admin list loads quickly
3. Check that permission filtering doesn't slow down navigation

### Stress Test
1. Rapidly switch between different admins
2. Test concurrent logins from multiple browsers
3. Verify no memory leaks or performance degradation

## Security Testing

### Access Control
- [ ] Admin cannot access Admin Management even via direct URL
- [ ] Admin cannot create other admins
- [ ] Admin cannot modify their own permissions
- [ ] Inactive admin cannot access system
- [ ] Permissions are checked on every page load

### Session Security
- [ ] Sessions expire appropriately
- [ ] No sensitive data in localStorage beyond user ID
- [ ] Logout clears all session data

## Next Steps After Testing

1. **Change Default Password**: Immediately change owner password from `owner123`
2. **Create Production Admins**: Set up your actual admin users with appropriate permissions
3. **Document Permissions**: Create internal documentation of which admin should have which permissions
4. **Monitor Usage**: Keep track of which admins are active and what they access
5. **Regular Audits**: Periodically review admin accounts and permissions

## Reporting Issues

If you find any issues during testing:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Check Supabase logs for database errors
4. Document expected vs actual behavior
5. Try to isolate whether it's a frontend or backend issue
