-- Create enum type for insurance types
CREATE TYPE insurance_type_enum AS ENUM ('xe_may', 'y_te', 'o_to', 'khac');

-- Create insurances table
CREATE TABLE IF NOT EXISTS insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  insurance_type insurance_type_enum NOT NULL,
  expiry_date DATE NOT NULL,
  status BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries on expiry_date
CREATE INDEX IF NOT EXISTS idx_expiry_date ON insurances(expiry_date);

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_status ON insurances(status);

