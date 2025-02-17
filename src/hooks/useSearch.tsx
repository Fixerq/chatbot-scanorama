
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { AnalysisResult } from '@/utils/types/search';

type AnalysisJob = Database['public']['Tables']['analysis_jobs']['Row'];

export const useSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (!currentBatchId) return;

    const subscription = supabase
      .channel(`analysis_jobs_${currentBatchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_jobs',
          filter: `batch_id=eq.${currentBatchId}`
        },
        (payload: RealtimePostgresChangesPayload<AnalysisJob>) => {
          if (payload.eventType === 'DELETE' || !payload.new) return;
          
          const newData = payload.new;
          const analysisResult = newData.result as AnalysisResult | null;
          
          setResults(current => 
            current.map(result => {
              if (result.url === newData.url) {
                return {
                  ...result,
                  status: newData.status || 'pending',
                  error: newData.error || undefined,
                  analysis_result: analysisResult || undefined
                };
              }
              return result;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentBatchId]);

  const handleSearch = async (query: string, country: string, region: string) => {
    setIsSearching(true);
    try {
      // Create a new search batch
      const { data: batch, error: batchError } = await supabase
        .from('search_batches')
        .insert({
          query,
          country,
          region
        })
        .select()
        .single();

      if (batchError) throw batchError;
      
      setCurrentBatchId(batch.id);

      // Call search-places edge function
      const { data: placesData, error: placesError } = await supabase.functions
        .invoke('search-places', {
          body: {
            query,
            country,
            region
          }
        });

      if (placesError) throw placesError;

      // Create analysis jobs for each result
      const analysisJobs = placesData.results.map((place: any) => ({
        url: place.website_url || place.url,
        batch_id: batch.id,
        status: 'pending',
        metadata: {
          place_id: place.place_id,
          business_name: place.business_name,
          address: place.address
        }
      }));

      const { error: jobsError } = await supabase
        .from('analysis_jobs')
        .insert(analysisJobs);

      if (jobsError) throw jobsError;

      // Initialize results with place data
      const initialResults: Result[] = placesData.results.map((place: any) => ({
        url: place.website_url || place.url,
        status: 'pending',
        title: place.business_name,
        details: {
          business_name: place.business_name,
          address: place.address,
          website_url: place.website_url,
        }
      }));

      setResults(initialResults);

    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const retryAnalysis = async (url: string) => {
    try {
      if (!currentBatchId) {
        throw new Error('No active batch');
      }

      await supabase
        .from('analysis_jobs')
        .update({
          status: 'pending',
          error: null
        })
        .eq('url', url)
        .eq('batch_id', currentBatchId);
      
      toast.success('Analysis retry initiated');
      
    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Failed to retry analysis');
    }
  };

  return {
    handleSearch,
    retryAnalysis,
    isSearching,
    results
  };
};

