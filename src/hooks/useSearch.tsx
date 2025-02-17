
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SearchResult, Status, AnalysisResult, isAnalysisResult } from '@/utils/types/search';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define the shape of analysis job records from the database
interface AnalysisJob {
  url: string;
  status: Status;
  error?: string;
  result?: AnalysisResult;
  metadata?: Record<string, unknown>;
  batch_id: string;
}

// Type guard for AnalysisJob
function isAnalysisJob(obj: unknown): obj is AnalysisJob {
  if (!obj || typeof obj !== 'object') return false;
  const job = obj as Partial<AnalysisJob>;
  return (
    typeof job.url === 'string' &&
    typeof job.status === 'string' &&
    typeof job.batch_id === 'string'
  );
}

export const useSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!currentBatchId) return;

    const channel = supabase
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
          const newJob = payload.new;
          
          // Type guard to ensure newJob has the correct shape
          if (!isAnalysisJob(newJob)) {
            console.error('Invalid job data received:', newJob);
            return;
          }

          console.log('Analysis job update:', newJob);
          
          setResults(current => 
            current.map(result => {
              if (result.url === newJob.url) {
                return {
                  ...result,
                  status: newJob.status,
                  error: newJob.error,
                  analysis_result: newJob.result && isAnalysisResult(newJob.result) 
                    ? newJob.result 
                    : undefined
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
  }, [currentBatchId]);

  const handleSearch = async (query: string, country: string, region: string) => {
    setIsSearching(true);
    try {
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

      const { data: placesData, error: placesError } = await supabase.functions
        .invoke('search-places', {
          body: { query, country, region }
        });

      if (placesError) throw placesError;

      const analysisJobs = placesData.results.map((place: any) => ({
        url: place.website_url || place.url,
        batch_id: batch.id,
        status: 'pending' as Status,
        metadata: {
          place_id: place.place_id,
          business_name: place.business_name,
          formatted_address: place.address
        }
      }));

      const { error: jobsError } = await supabase
        .from('analysis_jobs')
        .insert(analysisJobs);

      if (jobsError) throw jobsError;

      const initialResults: SearchResult[] = placesData.results.map((place: any) => ({
        url: place.website_url || place.url,
        status: 'pending',
        title: place.business_name,
        metadata: {
          place_id: place.place_id,
          business_name: place.business_name,
          formatted_address: place.address
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

      const { error } = await supabase
        .from('analysis_jobs')
        .update({
          status: 'pending',
          error: null,
          result: null
        })
        .eq('url', url)
        .eq('batch_id', currentBatchId);

      if (error) throw error;
      
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
