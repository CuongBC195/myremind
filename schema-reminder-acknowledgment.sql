-- Add reminder acknowledgment fields to insurances table
-- This allows users to mark reminders as "acknowledged" and choose to pause or continue reminders

ALTER TABLE insurances
ADD COLUMN IF NOT EXISTS reminder_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP;

-- Create index for reminder_paused for faster queries
CREATE INDEX IF NOT EXISTS idx_reminder_paused ON insurances(reminder_paused) WHERE reminder_paused = true;

-- Add comment
COMMENT ON COLUMN insurances.reminder_paused IS 'If true, stop sending reminders even if not renewed';
COMMENT ON COLUMN insurances.acknowledged_at IS 'Timestamp when user acknowledged the reminder';

