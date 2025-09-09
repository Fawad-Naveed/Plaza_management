# Reports Module - Excel Download Functionality

## Overview
The Reports module has been enhanced with comprehensive Excel download functionality for all types of business data. Users can now generate detailed reports for rent, maintenance, gas, and electricity history with flexible time periods.

## Features

### 📊 **Report Types**
1. **Rent History Reports**
   - Business name and shop number
   - Bill number and dates
   - Rent amounts and payment status
   - Payment dates and total amounts

2. **Maintenance History Reports**
   - Business details and bill information
   - Maintenance amounts and descriptions
   - Payment status and dates
   - Total amounts

3. **Gas History Reports**
   - Meter reading details
   - Consumption data (previous/current readings)
   - Units consumed and rates
   - Payment information

4. **Electricity History Reports**
   - Meter reading details
   - Consumption data (previous/current readings)
   - Units consumed and rates
   - Payment information

### ⏰ **Time Periods**
- **Quarterly**: Last 3 months
- **Semi-Annual**: Last 6 months
- **Annual**: Last 12 months
- **Custom**: User-defined date range

### 🔍 **Filtering Options**
- **Date Range**: Start and end dates
- **Business Filter**: Specific business or all businesses
- **Period Presets**: Quick selection of common time periods

## Usage

### 1. **Accessing Reports**
- Navigate to the "Reports" section in the sidebar
- Select the desired report type:
  - Rent History
  - Maintenance History
  - Gas History
  - Electricity History

### 2. **Setting Filters**
- Choose the report period (Quarterly/Semi-Annual/Annual)
- Set custom start and end dates if needed
- Optionally filter by specific business
- Click "Refresh Data" to update the view

### 3. **Downloading Reports**
- Review the summary statistics
- Click "Download Excel" button
- The file will be automatically downloaded with the format:
  - `[ReportType]_History_[Period]_[StartDate]_to_[EndDate].xlsx`

## Excel File Structure

### **Rent History Excel**
| Column | Description |
|--------|-------------|
| Business Name | Name of the business |
| Shop Number | Shop/unit number |
| Bill Number | Unique bill identifier |
| Bill Date | Date when bill was generated |
| Due Date | Payment due date |
| Rent Amount | Amount charged for rent |
| Payment Status | Paid/Pending/Overdue |
| Payment Date | Date when payment was received |
| Total Amount | Total bill amount |
| Month | Billing month |
| Year | Billing year |

### **Maintenance History Excel**
| Column | Description |
|--------|-------------|
| Business Name | Name of the business |
| Shop Number | Shop/unit number |
| Bill Number | Unique bill identifier |
| Bill Date | Date when bill was generated |
| Due Date | Payment due date |
| Maintenance Amount | Amount charged for maintenance |
| Description | Description of maintenance work |
| Payment Status | Paid/Pending/Overdue |
| Payment Date | Date when payment was received |
| Total Amount | Total bill amount |

### **Gas/Electricity History Excel**
| Column | Description |
|--------|-------------|
| Business Name | Name of the business |
| Shop Number | Shop/unit number |
| Reading Date | Date of meter reading |
| Previous Reading | Previous meter reading value |
| Current Reading | Current meter reading value |
| Units Consumed | Difference between readings |
| Rate per Unit | Rate charged per unit |
| Amount | Total amount for the reading |
| Payment Status | Paid/Pending/Overdue |
| Payment Date | Date when payment was received |
| Bill Number | Associated bill number |

## Technical Implementation

### **Dependencies**
- `xlsx`: For Excel file generation
- React hooks for state management
- TypeScript for type safety

### **Key Functions**
- `downloadExcel()`: Generates and downloads Excel files
- `filterDataByDateRange()`: Filters data based on date range
- `updateDateRange()`: Updates date range based on selected period
- `loadData()`: Loads all necessary data from database

### **Data Sources**
- Bills table: For rent and maintenance data
- Meter readings table: For gas and electricity data
- Businesses table: For business information

## Error Handling
- Loading states during data fetch
- Error messages for failed operations
- Graceful fallbacks for missing data
- Validation for date ranges and filters

## Future Enhancements
- PDF export functionality
- Email report delivery
- Scheduled report generation
- Advanced analytics and charts
- Custom report templates
- Multi-format export options

## Troubleshooting

### **Common Issues**
1. **Excel file not downloading**
   - Check browser download settings
   - Ensure sufficient disk space
   - Verify xlsx library is installed

2. **No data in reports**
   - Verify date range is correct
   - Check if data exists for selected period
   - Ensure business filter is not too restrictive

3. **Slow performance**
   - Reduce date range
   - Filter by specific business
   - Check database performance

### **Support**
For technical issues or feature requests, please contact the development team.

