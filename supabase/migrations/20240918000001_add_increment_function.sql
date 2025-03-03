
-- Function to increment the result count in the searches table
CREATE OR REPLACE FUNCTION public.increment(search_id UUID, increment_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE searches
  SET result_count = result_count + increment_amount
  WHERE id = search_id;
END;
$$;
