-- Add new columns to insurances table for enhanced features
ALTER TABLE insurances 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
ADD COLUMN IF NOT EXISTS reminder_frequency VARCHAR(20) DEFAULT '1_week' CHECK (reminder_frequency IN ('on_due', '3_days', '1_week', '1_month')),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for priority
CREATE INDEX IF NOT EXISTS idx_priority ON insurances(priority);

-- Create index for reminder_frequency
CREATE INDEX IF NOT EXISTS idx_reminder_frequency ON insurances(reminder_frequency);

