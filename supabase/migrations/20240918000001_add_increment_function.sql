
-- Simple increment function for updating counters
CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer AS $$
  SELECT $1 + 1;
$$ LANGUAGE SQL IMMUTABLE;
