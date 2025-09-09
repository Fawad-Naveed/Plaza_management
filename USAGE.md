# Plaza Management System - User Guide

## Overview
This is a comprehensive plaza/mall management system built with Next.js and Supabase. It helps manage businesses, floors, billing, payments, maintenance, and reporting for commercial properties.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Supabase account and project
- Modern web browser

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run database migrations (see Database Setup section)
5. Start the development server: `npm run dev`

## Database Setup

### Required SQL Scripts (Run in order):
1. **`supabase-schema.sql`** - Creates all tables and initial structure
2. **`fix-maintenance-tables.sql`** - Fixes maintenance table relationships
3. **`update-advances-table.sql`** - Adds type and month/year tracking to advances
4. **`sample-data.sql`** - (Optional) Adds sample data for testing

### Running Scripts:
- Go to your Supabase dashboard
- Navigate to SQL Editor
- Copy and paste each script
- Run them in the specified order

## Main Features & How to Use

### 1. Dashboard
**Access:** Click "Dashboard" in the sidebar

**Features:**
- **Overview Statistics:** Total customers, paid/unpaid bills
- **Floor Settings:** 
  - Add new floors with name and shop count
  - Delete floors (red trash button)
  - View floor occupancy
- **Charts:** Floor-wise occupancy and payment status
- **Quick Actions:** Shortcuts to common tasks

**How to Use:**
- Add floors before adding businesses
- Monitor occupancy rates and payment status
- Use quick action buttons for common tasks

### 2. Business Information Management

#### Add Business
**Access:** Business Information → Add Business

**How to Use:**
1. Fill in business details (name, type, contact info)
2. Select floor and shop number
3. Enter lease information (rent, deposit, dates)
4. Add multiple contact persons if needed
5. Click "Add Business"

#### View Business
**Access:** Business Information → View Business

**Features:**
- Search businesses by name, phone, or shop number
- Click on business row to expand and see contact persons
- Edit business details (pencil icon)
- Delete business (trash icon)

#### Floor Management
**Access:** Business Information → Floor Management

**How to Use:**
1. **Add Floor:** Fill form with floor details and click "Add Floor"
2. **View Floors:** See all floors with occupancy status
3. **Delete Floor:** Click red trash button (confirms before deletion)

#### Advance Payments
**Access:** Business Information → Advance

**How to Use:**
1. **Add Advance Payment:**
   - Select business from dropdown
   - Choose payment type: Electricity, Rent, or Maintenance
   - Select month and year
   - Enter amount and date
   - Add purpose (optional)
   - Click "Add Advance Payment"

2. **Duplicate Prevention:**
   - System prevents duplicate advances for same business/type/month/year
   - Shows error message if duplicate attempted

3. **View Advances:**
   - Color-coded badges for payment types
   - Month/year display
   - Delete option available

#### Instalments
**Access:** Business Information → Instalments

**Features:**
- View instalment plans for each business
- Track paid vs total instalments
- Monitor instalment status

#### Theft Records
**Access:** Business Information → Theft

**How to Use:**
1. Select date and business
2. Enter theft description
3. Add amount if applicable
4. Click "Add Theft Record"

#### Meter Load Management
**Access:** Business Information → Meter Load

**Features:**
- View electricity load for each business
- Update load information
- Monitor connection status

### 3. Meter Reading
**Access:** Meter Reading in sidebar

#### Reading Sheet
- View all meter readings in tabular format
- Filter by business or date range

#### Add Reading
1. Select business
2. Choose meter type (electricity/water)
3. Enter previous and current readings
4. System calculates consumption and amount
5. Save reading

### 4. Bill Generation
**Access:** Bill Generation in sidebar

#### Generate Bill
1. Select business from dropdown
2. Choose bill type (Rent, Electricity, Maintenance, or Combined)
3. System auto-calculates based on readings and business data
4. Review charges and generate bill
5. Download PDF automatically

#### All Bills
**Improved Interface:** All bill management actions are now consolidated in the bill list for better usability.

**Available Actions for Each Bill:**
- **👁️ View:** Read-only detailed view of bill with complete breakdown
- **✏️ Edit:** Modify bill details using the same form as generation
- **🖨️ Print:** Download/print professional PDF format
- **🗑️ Delete:** Remove bill with confirmation dialog (use carefully)

**Features:**
- **Search & Filter:** Find bills by business name, bill number, or shop
- **Status Tracking:** Visual badges for paid/pending status
- **Inline Actions:** All operations accessible directly from the bill list
- **Edit Mode:** Pre-populated form for easy bill modifications
- **Confirmation Dialogs:** Safety prompts for destructive actions

**How to Use:**
1. **View Bills:** Navigate to "All Bills" to see complete list
2. **Edit Bill:** Click edit icon → modify details → update bill
3. **View Details:** Click view icon for complete bill breakdown
4. **Print Bill:** Click print icon to download professional PDF
5. **Delete Bill:** Click delete icon → confirm in dialog

### 5. Payment Management
**Access:** Payment in sidebar

#### Bill Payment
1. Select unpaid bill
2. Choose payment method (cash, UPI, card, bank transfer)
3. Enter payment details
4. Record payment

#### Unpaid Bills
- View all pending payments
- Sort by due date or amount
- Send payment reminders

#### Paid Bills
- View payment history
- Generate payment receipts
- Track payment methods

### 6. Maintenance Module
**Access:** Maintenance in sidebar

#### Maintenance Bill
1. Select business
2. Choose maintenance category (cleaning, repair, general, emergency)
3. Enter description and amount
4. Generate maintenance bill

#### Maintenance Advance
- Similar to regular advances but for maintenance
- Track maintenance advance usage
- Adjust against future bills

#### Maintenance Instalments
- Set up maintenance payment plans
- Track instalment progress
- Monitor completion status

#### Maintenance Payments
- Record maintenance bill payments
- Track payment methods
- Generate maintenance receipts

### 7. Reports
**Access:** Reports in sidebar

**Available Reports:**
- Customer reports (total, active, by floor)
- Bill reports (electricity, maintenance, combined)
- Payment reports (by method, monthly trends)
- Financial reports (revenue, outstanding, advances)

**How to Use:**
- Reports auto-generate from current data
- View charts and statistics
- Export data for external analysis

### 8. Terms and Conditions
**Access:** Terms and Conditions in sidebar

**Features:**
- Create business-specific terms
- Set effective dates
- Manage lease conditions
- Legal compliance tracking

### 9. Settings (White-Label Configuration)
**Access:** Settings in sidebar

**Features:**
- **Business Information:** Configure your business name and branding
- **Logo Management:** Upload and preview your business logo
- **Contact Details:** Set email, phone, website, and address
- **Sidebar Branding:** Your business information appears at the bottom of the sidebar

**How to Use:**
1. **Business Name:** Enter your business/organization name (required)
2. **Logo URL:** Provide a direct link to your logo image
   - Recommended size: 200x200px or smaller
   - Supported formats: PNG, JPG, GIF
   - Must be publicly accessible URL
3. **Contact Information:** Fill in your business contact details
4. **Save Settings:** Click "Save Settings" to apply changes
5. **Preview:** View how your branding will appear in the sidebar

**White-Label Benefits:**
- Customize the application with your business branding
- Professional appearance for your organization
- Contact information readily available to users
- Consistent branding throughout the application
- **PDF Documents:** All generated PDFs (bills, receipts) include your business logo and name
- **Professional Documents:** Bills and receipts display your contact information

**Database Setup for Settings:**
Before using Settings, run the SQL script:
```sql
-- Run create-information-table.sql in Supabase SQL Editor
```

**Tips:**
- Use high-quality logo images for best appearance
- Keep business name concise for sidebar display
- Ensure logo URLs are permanent and accessible
- Test logo preview before saving

**PDF Branding:**
Once configured, your business branding automatically appears on:
- **Bill PDFs:** Logo, business name, and contact info in header
- **Payment Receipts:** Professional branded receipt layout
- **All Downloads:** Consistent branding across all generated documents

**Logo Requirements for PDFs:**
- Must be publicly accessible URL (no authentication required)
- Recommended formats: PNG, JPG (PNG preferred for transparency)
- Optimal size: 200x200px or smaller for fast loading
- Square aspect ratio works best for consistent display

## Best Practices

### Data Entry
1. **Always add floors first** before adding businesses
2. **Use consistent naming** for floors and businesses
3. **Enter complete contact information** for better communication
4. **Set proper lease dates** for accurate billing

### Payment Management
1. **Record advances by type and month** to prevent duplicates
2. **Use appropriate payment methods** for tracking
3. **Generate bills regularly** to maintain cash flow
4. **Track unpaid bills** and follow up promptly

### Maintenance
1. **Categorize maintenance properly** for better reporting
2. **Use maintenance advances** for large projects
3. **Track maintenance payments** separately from rent
4. **Document maintenance activities** thoroughly

### Reporting
1. **Review reports regularly** for business insights
2. **Monitor occupancy rates** for floor optimization
3. **Track payment trends** for cash flow management
4. **Use financial reports** for decision making

## Troubleshooting

### Common Issues

#### "Floor not found" when adding business
- **Solution:** Add the floor first in Floor Management section

#### "Advance already exists" error
- **Cause:** Trying to create duplicate advance for same business/type/month/year
- **Solution:** Check existing advances or choose different month/year

#### Bills not generating
- **Check:** Meter readings are entered for the period
- **Verify:** Business has active status
- **Ensure:** Floor and shop information is complete

#### Payment not recording
- **Verify:** Bill exists and is unpaid
- **Check:** Payment amount doesn't exceed bill amount
- **Ensure:** Payment method is selected

### Data Backup
- Regular database backups through Supabase
- Export important reports periodically
- Keep local copies of critical data

### Performance Tips
- Use search functionality for large datasets
- Filter data by date ranges when possible
- Regular cleanup of old/cancelled records

## Support

### Getting Help
1. Check this user guide first
2. Review error messages carefully
3. Verify data entry requirements
4. Contact system administrator if issues persist

### Feature Requests
- Document specific requirements
- Provide use case examples
- Consider impact on existing data
- Submit through proper channels

## Security Notes

### Access Control
- Use strong passwords
- Log out when finished
- Don't share login credentials
- Report suspicious activity

### Data Protection
- Enter accurate information only
- Don't modify critical system data
- Follow data privacy guidelines
- Regular password updates recommended

---

**Version:** 1.0  
**Last Updated:** December 2024  
**System Requirements:** Modern web browser, internet connection