# Billing System Restructure - Requirements Document

## Introduction

This specification outlines the complete restructuring of the plaza management billing system to separate bills by type (Rent, Electricity, Maintenance) with dedicated bill tables, generation processes, and management interfaces. The new system will generate 3 separate bills per business per month and provide type-specific management capabilities.

## Requirements

### Requirement 1: Database Schema Restructure

**User Story:** As a system administrator, I want separate bill tables for each bill type so that I can manage rent, electricity, and maintenance bills independently with proper data organization.

#### Acceptance Criteria

1. WHEN the system is restructured THEN it SHALL create three separate bill tables: `rent_bills`, `electricity_bills`, and `maintenance_bills`
2. WHEN creating new bill tables THEN each table SHALL have a `bill_type` field explicitly set to "rent", "electricity", or "maintenance" respectively
3. WHEN restructuring THEN the system SHALL remove the old combined `bills` table and related legacy tables
4. WHEN creating bill tables THEN each SHALL include fields: `id`, `business_id`, `bill_number`, `bill_date`, `due_date`, `amount`, `bill_type`, `status`, `created_at`, `updated_at`
5. WHEN bills are created THEN each bill type SHALL have its own unique numbering sequence (e.g., RENT-2024-001, ELEC-2024-001, MAINT-2024-001)

### Requirement 2: Separate Payment Tables

**User Story:** As a billing manager, I want separate payment tables for each bill type so that I can track payments specifically for rent, electricity, and maintenance bills.

#### Acceptance Criteria

1. WHEN restructuring payment system THEN it SHALL create three separate payment tables: `rent_payments`, `electricity_payments`, and `maintenance_payments`
2. WHEN creating payment tables THEN each SHALL link to their respective bill table via foreign key
3. WHEN recording payments THEN each payment SHALL be associated with only one bill type
4. WHEN payment tables are created THEN they SHALL include fields: `id`, `business_id`, `bill_id`, `payment_date`, `amount`, `payment_method`, `reference_number`, `notes`, `created_at`

### Requirement 3: Navigation Structure Update

**User Story:** As a user, I want separate navigation sections for Rent, Electricity, and Maintenance so that I can manage each bill type independently.

#### Acceptance Criteria

1. WHEN accessing the navigation THEN it SHALL display three main sections: "Rent", "Electricity", and "Maintenance"
2. WHEN expanding each section THEN it SHALL show sub-items: "Generate Bill" and "All Bills"
3. WHEN clicking "Generate Bill" THEN it SHALL open a page with "Paid" and "Unpaid" tabs for that bill type
4. WHEN clicking "All Bills" THEN it SHALL show all bills (paid and unpaid) for that specific bill type
5. WHEN navigating THEN the current "Bill Generation" and "Payment" sections SHALL be removed from navigation

### Requirement 4: Type-Specific Bill Generation

**User Story:** As a billing clerk, I want to generate separate bills for rent, electricity, and maintenance so that businesses receive clear, categorized billing statements.

#### Acceptance Criteria

1. WHEN generating bills THEN the system SHALL create 3 separate bills per business per month (rent, electricity, maintenance)
2. WHEN generating rent bills THEN it SHALL use the `rent_amount` from the business record
3. WHEN generating electricity bills THEN it SHALL calculate amount based on meter readings and rates
4. WHEN generating maintenance bills THEN it SHALL use predefined maintenance charges or custom amounts
5. WHEN bills are generated THEN each SHALL have a unique bill number with type prefix
6. WHEN generating bills THEN each bill type SHALL have its own generation interface and logic

### Requirement 5: Bill Status Management

**User Story:** As a billing manager, I want to change bill status from paid/unpaid dropdowns so that I can easily manage bill payment status for each bill type.

#### Acceptance Criteria

1. WHEN viewing bills THEN each bill SHALL display a status dropdown with "Paid" and "Unpaid" options
2. WHEN changing status from dropdown THEN the bill status SHALL update immediately in the database
3. WHEN marking a bill as "Paid" THEN it SHALL move to the "Paid" tab in the respective bill type section
4. WHEN marking a bill as "Unpaid" THEN it SHALL move to the "Unpaid" tab in the respective bill type section
5. WHEN status changes THEN the system SHALL reload data to reflect changes across all views

### Requirement 6: Type-Specific Payment Recording

**User Story:** As a cashier, I want to record payments for specific bill types so that payments are properly categorized and tracked.

#### Acceptance Criteria

1. WHEN recording rent payments THEN it SHALL create entries in the `rent_payments` table
2. WHEN recording electricity payments THEN it SHALL create entries in the `electricity_payments` table  
3. WHEN recording maintenance payments THEN it SHALL create entries in the `maintenance_payments` table
4. WHEN recording payments THEN each SHALL link to the appropriate bill in the respective bill table
5. WHEN payment is recorded THEN the associated bill status SHALL automatically update if fully paid

### Requirement 7: Database Migration and Cleanup

**User Story:** As a system administrator, I want to clean up legacy tables and data so that the system has a clean, organized database structure.

#### Acceptance Criteria

1. WHEN migration is complete THEN the old `bills` table SHALL be dropped
2. WHEN migration is complete THEN the old `payments` table SHALL be dropped
3. WHEN migration is complete THEN any other legacy billing tables SHALL be removed
4. WHEN cleanup is done THEN the database SHALL contain only the new type-specific tables
5. WHEN migration runs THEN existing development data SHALL be cleared (no data preservation needed)

### Requirement 8: Updated Database Interface Layer

**User Story:** As a developer, I want updated database functions for each bill type so that the application can interact with the new table structure.

#### Acceptance Criteria

1. WHEN database layer is updated THEN it SHALL provide separate functions for each bill type (getRentBills, getElectricityBills, getMaintenanceBills)
2. WHEN creating bills THEN it SHALL provide type-specific creation functions (createRentBill, createElectricityBill, createMaintenanceBill)
3. WHEN recording payments THEN it SHALL provide type-specific payment functions for each bill type
4. WHEN updating bills THEN it SHALL provide type-specific update functions
5. WHEN database functions are created THEN they SHALL include proper TypeScript interfaces for each bill type

### Requirement 9: Component Architecture Update

**User Story:** As a developer, I want separate components for each bill type so that the codebase is organized and maintainable.

#### Acceptance Criteria

1. WHEN components are restructured THEN it SHALL create separate components: `RentManagement`, `ElectricityManagement`, `MaintenanceManagement`
2. WHEN each component is created THEN it SHALL handle both bill generation and bill viewing for its type
3. WHEN components are implemented THEN each SHALL have "Generate Bill" and "All Bills" functionality
4. WHEN "Generate Bill" is accessed THEN it SHALL show tabbed interface with "Paid" and "Unpaid" tabs
5. WHEN components are complete THEN legacy combined billing components SHALL be removed

### Requirement 10: Bill Numbering System

**User Story:** As a billing manager, I want unique bill numbers for each bill type so that I can easily identify and reference specific bills.

#### Acceptance Criteria

1. WHEN rent bills are generated THEN they SHALL use format "RENT-YYYY-NNN" (e.g., RENT-2024-001)
2. WHEN electricity bills are generated THEN they SHALL use format "ELEC-YYYY-NNN" (e.g., ELEC-2024-001)
3. WHEN maintenance bills are generated THEN they SHALL use format "MAINT-YYYY-NNN" (e.g., MAINT-2024-001)
4. WHEN bill numbers are generated THEN each type SHALL maintain its own sequential counter
5. WHEN bills are created THEN the numbering SHALL reset annually but maintain type separation