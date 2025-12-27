-- Add 2_weeks option to reminder_frequency
-- First, drop the existing check constraint
ALTER TABLE insurances 
DROP CONSTRAINT IF EXISTS insurances_reminder_frequency_check;

-- Add new check constraint with 2_weeks option
ALTER TABLE insurances 
ADD CONSTRAINT insurances_reminder_frequency_check 
CHECK (reminder_frequency IN ('on_due', '3_days', '1_week', '2_weeks', '1_month'));

