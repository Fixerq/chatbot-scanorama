
-- Add updated_at column to rate_limits table
ALTER TABLE rate_limits 
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Update existing rows to have the same value as last_request
UPDATE rate_limits
SET updated_at = last_request;

-- Make updated_at not nullable
ALTER TABLE rate_limits 
ALTER COLUMN updated_at SET NOT NULL;
