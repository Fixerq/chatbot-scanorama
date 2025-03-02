
-- Create cached_places table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cached_places (
  id SERIAL PRIMARY KEY,
  place_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  place_data JSONB NOT NULL,
  search_batch_id UUID NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS cached_places_place_id_idx ON public.cached_places (place_id);
CREATE INDEX IF NOT EXISTS cached_places_search_batch_id_idx ON public.cached_places (search_batch_id);
CREATE INDEX IF NOT EXISTS cached_places_user_id_idx ON public.cached_places (user_id);
CREATE INDEX IF NOT EXISTS cached_places_last_accessed_idx ON public.cached_places (last_accessed);

-- Create or replace cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_cached_places()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.cached_places
    WHERE last_accessed < NOW() - INTERVAL '7 days';
END;
$$;

-- Schedule periodic cleanup
SELECT cron.schedule(
  'cleanup-cached-places',
  '0 0 * * *', -- Run at midnight every day
  $$SELECT cleanup_old_cached_places()$$
);

-- Enable RLS
ALTER TABLE public.cached_places ENABLE ROW LEVEL SECURITY;

-- Create policy to allow access to cached places
CREATE POLICY access_cached_places ON public.cached_places
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.cached_places TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE cached_places_id_seq TO anon, authenticated, service_role;
