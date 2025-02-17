
import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

interface SearchResult {
  place_id: string;
  business_name: string;
  website_url: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  error?: string;
}

const useSearchFlowManager = () => {
  const supabase = useSupabaseClient();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (
    category: string,
    country: string,
    region: string
  ) => {
    setIsSearching(true);
    try {
      // 1. Call Google Places API through our Supabase Edge Function
      const { data: placesData, error: placesError } = await supabase.functions.invoke('search-places', {
        body: {
          category,
          country,
          region
        }
      });

      if (placesError || !placesData) {
        throw new Error('Failed to fetch places: ' + (placesError?.message || 'Unknown error'));
      }

      console.log('Places API response:', placesData);

      // 2. Initialize results with pending status
      const initialResults = placesData.results.map((place: any) => ({
        place_id: place.place_id,
        business_name: place.name,
        website_url: place.website,
        status: 'pending' as const
      }));

      setResults(initialResults);

      // 3. Insert search batch into Supabase
      const { data: batchData, error: batchError } = await supabase
        .from('search_batches')
        .insert([
          {
            query: category,
            country,
            region,
          }
        ])
        .select()
        .single();

      if (batchError) {
        throw new Error('Failed to create search batch: ' + batchError.message);
      }

      // 4. Queue analysis jobs for each result
      const analysisPromises = initialResults.map(async (result) => {
        if (!result.website_url) return result;

        try {
          // Insert analysis job
          const { data: analysisData, error: analysisError } = await supabase
            .from('analysis_requests')
            .insert([
              {
                batch_id: batchData.id,
                url: result.website_url,
                status: 'pending'
              }
            ])
            .select()
            .single();

          if (analysisError) {
            throw analysisError;
          }

          // Start analysis through Edge Function
          const { error: analyzeError } = await supabase.functions.invoke('analyze-website', {
            body: {
              url: result.website_url,
              request_id: analysisData.id
            }
          });

          if (analyzeError) {
            throw new Error('Failed to start analysis: ' + analyzeError.message);
          }

          return {
            ...result,
            status: 'analyzing' as const
          };
        } catch (error) {
          console.error('Analysis error:', error);
          return {
            ...result,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Analysis failed'
          };
        }
      });

      // 5. Update results with analysis status
      const updatedResults = await Promise.all(analysisPromises);
      setResults(updatedResults);

      // 6. Set up real-time subscription for analysis updates
      const channel = supabase
        .channel('analysis_updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'analysis_requests',
            filter: `batch_id=eq.${batchData.id}`
          },
          (payload) => {
            console.log('Analysis update received:', payload);
            setResults((currentResults) => 
              currentResults.map((result) => {
                if (result.website_url === payload.new.url) {
                  return {
                    ...result,
                    status: payload.new.status === 'failed' ? 'error' : payload.new.status,
                    error: payload.new.error_message
                  };
                }
                return result;
              })
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };

    } catch (error) {
      console.error('Search flow error:', error);
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return {
    handleSearch,
    isSearching,
    results
  };
};

export default useSearchFlowManager;
