-- Fix push_subscriptions table: Remove unique constraint on endpoint column
-- Keep only the composite unique constraint (user_id, endpoint)

-- First, drop the unique constraint on endpoint if it exists
DO $$ 
BEGIN
    -- Drop the unique constraint on endpoint column
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'push_subscriptions_endpoint_key'
    ) THEN
        ALTER TABLE push_subscriptions DROP CONSTRAINT push_subscriptions_endpoint_key;
        RAISE NOTICE 'Dropped constraint push_subscriptions_endpoint_key';
    END IF;
END $$;

-- Ensure the composite unique constraint exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'push_subscriptions_user_id_endpoint_key'
    ) THEN
        ALTER TABLE push_subscriptions 
        ADD CONSTRAINT push_subscriptions_user_id_endpoint_key 
        UNIQUE (user_id, endpoint);
        RAISE NOTICE 'Added composite unique constraint (user_id, endpoint)';
    END IF;
END $$;

