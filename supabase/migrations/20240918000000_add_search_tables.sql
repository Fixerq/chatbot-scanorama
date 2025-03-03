
-- Table for search batches with search metadata
CREATE TABLE IF NOT EXISTS public.searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  country TEXT,
  region TEXT,
  user_id UUID REFERENCES auth.users(id),
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for storing all search results
CREATE TABLE IF NOT EXISTS public.search_results (
  id SERIAL PRIMARY KEY,
  search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
  place_id TEXT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  details JSONB,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster pagination queries
CREATE INDEX IF NOT EXISTS search_results_search_id_idx ON search_results(search_id);

-- RLS policies for these tables
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read search data
CREATE POLICY "Anyone can read searches" ON public.searches
  FOR SELECT
  USING (true);
  
CREATE POLICY "Anyone can read search results" ON public.search_results
  FOR SELECT
  USING (true);
  
-- Users can insert their own searches
CREATE POLICY "Users can insert searches" ON public.searches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
-- Service role can insert search results (from edge function)
CREATE POLICY "Service role can insert search results" ON public.search_results
  FOR INSERT
  WITH CHECK (auth.jwt() -> 'role' = 'service_role');
