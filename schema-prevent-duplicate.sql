-- Add unique constraint to prevent duplicate insurance entries
-- This creates a partial unique index that prevents duplicates within a short time window
-- Note: This is a soft constraint - allows same insurance after 10 seconds

-- Create a function to generate a unique key for duplicate detection
CREATE OR REPLACE FUNCTION insurance_duplicate_key(
  p_user_id UUID,
  p_customer_name TEXT,
  p_expiry_date DATE,
  p_insurance_type TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN md5(p_user_id::TEXT || p_customer_name || p_expiry_date::TEXT || p_insurance_type || date_trunc('second', NOW())::TEXT);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Alternative: Create a unique index on recent duplicates (within 10 seconds)
-- This is more flexible than a hard constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_insurances_recent_duplicate 
ON insurances (user_id, customer_name, expiry_date, insurance_type, date_trunc('second', created_at))
WHERE created_at > NOW() - INTERVAL '10 seconds';

-- Note: The above index might be too strict. Instead, we'll handle duplicates in application code.
-- But we can add a regular unique constraint if needed:
-- ALTER TABLE insurances 
-- ADD CONSTRAINT insurances_user_customer_expiry_type_unique 
-- UNIQUE (user_id, customer_name, expiry_date, insurance_type);

