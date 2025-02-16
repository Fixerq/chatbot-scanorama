
import { useState, useCallback, useRef } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUrlProcessor = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const processSearchResults = useCallback(async (
    results: Result[], 
    onAnalysisStart: () => void,
    onAnalysisComplete: () => void
  ) => {
    if (!results.length) return;

    setProcessing(true);
    onAnalysisStart();

    try {
      // Start a new worker instance
      const { error: workerError } = await supabase.functions.invoke('start-worker', {
        body: { action: 'start' }
      });

      if (workerError) {
        console.error('Error starting worker:', workerError);
        toast.error('Failed to start analysis worker');
        return;
      }

      // Create a search batch first
      const { data: batchData, error: batchError } = await supabase
        .from('search_batches')
        .insert({
          query: 'batch-analysis',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (batchError) {
        console.error('Error creating search batch:', batchError);
        toast.error('Failed to process URLs');
        return;
      }

      // Create analysis requests for each URL
      for (const result of results) {
        try {
          // Create the analysis request with the batch ID
          const { data: requestData, error: requestError } = await supabase
            .from('analysis_requests')
            .insert({
              url: result.url,
              status: 'pending',
              search_batch_id: batchData.id,
              batch_id: batchData.id,
              retry_count: 0
            })
            .select()
            .single();

          if (requestError) {
            console.error('Error creating analysis request:', requestError);
            continue;
          }

          console.log('Created analysis request:', requestData);

          // Queue the analysis job
          const { error } = await supabase.functions.invoke('analyze-website', {
            body: { 
              url: result.url,
              requestId: requestData.id,
              batchId: batchData.id
            }
          });

          if (error) {
            console.error('Error queuing analysis:', error);
            toast.error(`Failed to queue analysis for ${result.url}`);
          }
        } catch (error) {
          console.error(`Failed to process ${result.url}:`, error);
        }
      }

      // Clean up any existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      // Set up subscription to monitor analysis completion
      const channel = supabase
        .channel('analysis_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analysis_results',
            filter: `url=in.(${results.map(r => `'${r.url}'`).join(',')})`
          },
          (payload) => {
            console.log('Received analysis update:', payload);
            // When all URLs have been analyzed, call onAnalysisComplete
            supabase
              .from('analysis_results')
              .select('url')
              .in('url', results.map(r => r.url))
              .then(({ data, error }) => {
                if (!error && data && data.length === results.length) {
                  onAnalysisComplete();
                }
              });
          }
        )
        .subscribe();

      channelRef.current = channel;

    } catch (error) {
      console.error('Failed to process search results:', error);
      toast.error('Failed to analyze websites');
    } finally {
      setProcessing(false);
    }
  }, []);

  // Cleanup function for component unmount
  const cleanup = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return {
    processing,
    processSearchResults,
    cleanup
  };
};
