-- Create pending_payments table for payment approval workflow
-- This table stores payment submissions from businesses that need admin approval

CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  bill_id UUID NOT NULL REFERENCES bills(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
  payment_date DATE NOT NULL,
  notes TEXT,
  receipt_image_url TEXT, -- For businesses to upload payment proof
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by VARCHAR(255), -- Business user who submitted the payment
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Admin approval tracking
  reviewed_by VARCHAR(255), -- Admin who approved/rejected
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Reference to actual payment record (created after approval)
  payment_id UUID REFERENCES payments(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_pending_payments_business_id ON pending_payments(business_id);
CREATE INDEX idx_pending_payments_bill_id ON pending_payments(bill_id);
CREATE INDEX idx_pending_payments_status ON pending_payments(status);
CREATE INDEX idx_pending_payments_submitted_at ON pending_payments(submitted_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Policy for businesses to see only their own pending payments
CREATE POLICY "Businesses can view their own pending payments" ON pending_payments
    FOR SELECT USING (business_id IN (
        SELECT id FROM businesses WHERE auth_user_id = auth.uid()
    ));

-- Policy for businesses to insert their own pending payments
CREATE POLICY "Businesses can submit their own pending payments" ON pending_payments
    FOR INSERT WITH CHECK (business_id IN (
        SELECT id FROM businesses WHERE auth_user_id = auth.uid()
    ));

-- Policy for admins to view all pending payments
CREATE POLICY "Admins can view all pending payments" ON pending_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@plazamanagement.com'
        )
    );

-- Policy for admins to update pending payments (approve/reject)
CREATE POLICY "Admins can update pending payments" ON pending_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@plazamanagement.com'
        )
    );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_pending_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_pending_payments_updated_at
    BEFORE UPDATE ON pending_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_pending_payments_updated_at();

-- Add comments to explain the table
COMMENT ON TABLE pending_payments IS 'Stores payment submissions from businesses that require admin approval before being processed';
COMMENT ON COLUMN pending_payments.business_id IS 'Reference to the business making the payment';
COMMENT ON COLUMN pending_payments.bill_id IS 'Reference to the bill being paid';
COMMENT ON COLUMN pending_payments.amount IS 'Amount being paid';
COMMENT ON COLUMN pending_payments.payment_method IS 'Method of payment (cash, cheque, etc.)';
COMMENT ON COLUMN pending_payments.receipt_image_url IS 'URL to uploaded receipt/proof image';
COMMENT ON COLUMN pending_payments.status IS 'Payment status: pending, approved, or rejected';
COMMENT ON COLUMN pending_payments.reviewed_by IS 'Admin who approved or rejected the payment';
COMMENT ON COLUMN pending_payments.payment_id IS 'Reference to the actual payment record created after approval';