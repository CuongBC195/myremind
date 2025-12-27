-- Update schema for health insurance only with new fields
-- Add new columns for health insurance details
ALTER TABLE insurances 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone_number_new VARCHAR(20),
ADD COLUMN IF NOT EXISTS cccd VARCHAR(20),
ADD COLUMN IF NOT EXISTS insurance_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(12, 2);

-- Update phone_number if it's empty, use phone_number_new
UPDATE insurances 
SET phone_number = COALESCE(phone_number_new, phone_number) 
WHERE phone_number = '' OR phone_number IS NULL;

-- Create index for insurance_code
CREATE INDEX IF NOT EXISTS idx_insurance_code ON insurances(insurance_code);

-- Create index for cccd
CREATE INDEX IF NOT EXISTS idx_cccd ON insurances(cccd);

-- Note: We keep insurance_type for backward compatibility but will only use 'y_te'

