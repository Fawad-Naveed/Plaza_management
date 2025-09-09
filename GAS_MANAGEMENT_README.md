# Gas Management Module

## Overview

The Gas Management module has been successfully replicated from the Electricity Management module to provide comprehensive gas meter reading and billing functionality for the Plaza Management System.

## Features

### 1. Gas Meter Reading Management
- **Reading Sheet**: Bulk gas meter reading entry for all businesses
- **Individual Readings**: Add gas meter readings for specific businesses
- **Reading History**: View complete gas consumption history for each business
- **Monthly Details**: Detailed breakdown of gas consumption by month

### 2. Gas Bill Generation
- **Bill Creation**: Generate gas bills with automatic calculation
- **Bill Numbering**: Unique gas bill numbers (GAS-YYYY-NNN format)
- **Rate Management**: Configurable gas rates per unit
- **Bill Status**: Track paid, unpaid, and overdue gas bills

### 3. Gas Bill Management
- **All Bills View**: Complete list of all gas bills with search and filtering
- **Status Management**: Update bill status with dropdown controls
- **PDF Generation**: Download professional gas bill PDFs
- **Bill Editing**: Modify existing gas bills

## Database Changes

### New Column Added
- `bills.gas_charges` - Stores gas charges amount for each bill

### Updated Meter Readings
- `meter_readings.meter_type` now supports 'gas' as a valid type

## Components

### 1. GasManagement Component (`components/gas-management.tsx`)
- Handles gas meter reading entry and management
- Provides reading sheet functionality
- Shows gas consumption history
- Manages individual gas readings

### 2. Updated BillGeneration Component
- Supports gas bill generation
- Includes gas charges calculation
- Handles gas bill filtering and display
- Provides gas bill status management

### 3. Updated Navigation
- Added "Gas Management" section to sidebar
- Includes "Meter Reading" and "All Bills" sub-sections

## Usage

### Adding Gas Meter Readings

1. **Reading Sheet Method**:
   - Navigate to "Gas Management > Meter Reading"
   - Select month and year
   - Enter current readings for all businesses
   - Click "Save All Readings"

2. **Individual Reading Method**:
   - Select business from dropdown
   - Enter current meter reading
   - Set reading date and rate
   - Click "Add Reading"

### Generating Gas Bills

1. Navigate to "Gas Management > All Bills"
2. Click "Generate New Gas Bill"
3. Select business and enter gas consumption details
4. Set due date and review charges
5. Generate bill with terms and conditions

### Managing Gas Bills

1. **View All Bills**: See complete list with search functionality
2. **Update Status**: Use dropdown to mark bills as paid/unpaid
3. **Print Bills**: Download PDF versions of gas bills
4. **Edit Bills**: Modify bill details as needed

## Technical Implementation

### Database Schema Updates
```sql
-- Add gas_charges to bills table
ALTER TABLE bills ADD COLUMN gas_charges DECIMAL DEFAULT 0;

-- Update meter_readings to support gas type
-- meter_type now accepts 'electricity', 'water', 'gas'
```

### Type Definitions
```typescript
// Updated Bill interface
interface Bill {
  // ... existing fields
  gas_charges: number
}

// Updated MeterReading interface
interface MeterReading {
  // ... existing fields
  meter_type: "electricity" | "water" | "gas"
}
```

### Key Functions
- `calculateGasAmount()` - Calculate gas charges from units and rate
- `getLatestGasMeterReading()` - Get most recent gas reading for a business
- `generateBillNumber()` - Generate unique gas bill numbers (GAS-YYYY-NNN)

## Migration Instructions

1. **Run Database Migration**:
   ```sql
   -- Execute the migration script
   \i run-gas-migration.sql
   ```

2. **Update Application**:
   - The new components are already integrated
   - Navigation has been updated
   - All existing functionality remains intact

## Configuration

### Default Gas Rate
- Default rate: PKR 150.0 per unit
- Configurable per reading/bill
- Can be updated in the gas reading form

### Bill Numbering
- Format: GAS-YYYY-NNN (e.g., GAS-2024-001)
- Automatically increments for each new gas bill
- Unique across all gas bills

## Integration

The Gas Management module is fully integrated with:
- **Business Management**: Uses existing business data
- **Payment Management**: Gas bills appear in payment tracking
- **Dashboard**: Gas statistics included in overview
- **Reports**: Gas consumption and billing data available

## File Structure

```
components/
├── gas-management.tsx          # Main gas management component
├── bill-generation.tsx         # Updated with gas support
├── plaza-management-app.tsx    # Updated navigation
└── ...

lib/
├── database.ts                 # Updated types and functions
└── ...

sql/
├── run-gas-migration.sql       # Database migration script
└── add-gas-charges-to-bills.sql # Gas charges column addition
```

## Testing

To test the Gas Management module:

1. **Add Test Gas Readings**:
   - Navigate to Gas Management > Meter Reading
   - Add readings for test businesses
   - Verify calculations are correct

2. **Generate Test Bills**:
   - Create gas bills for test businesses
   - Verify bill numbering and calculations
   - Test PDF generation

3. **Verify Integration**:
   - Check that gas bills appear in payment management
   - Verify dashboard shows gas statistics
   - Test search and filtering functionality

## Support

For issues or questions regarding the Gas Management module:
1. Check the database migration was successful
2. Verify all components are properly imported
3. Ensure navigation is correctly configured
4. Review console logs for any errors

## Future Enhancements

Potential improvements for the Gas Management module:
- Gas consumption analytics and trends
- Automated gas bill generation based on readings
- Gas rate history tracking
- Integration with external gas provider APIs
- Advanced reporting and analytics

