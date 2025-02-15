
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUrlProcessor = () => {
  const [processing, setProcessing] = useState<boolean>(false);

  const processSearchResults = useCallback(async (results: Result[]) => {
    if (!results.length) return;

    setProcessing(true);
    try {
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
      const requests = await Promise.all(results.map(async (result) => {
        const { data: requestData, error: requestError } = await supabase
          .from('analysis_requests')
          .insert({
            url: result.url,
            status: 'pending',
            search_batch_id: batchData.id
          })
          .select()
          .single();

        if (requestError) {
          console.error('Error creating analysis request:', requestError);
          return null;
        }

        return { url: result.url, requestId: requestData.id };
      }));

      // Filter out any failed requests
      const validRequests = requests.filter((request): request is { url: string; requestId: string } => request !== null);

      // Call the analyze-website function for each valid request
      await Promise.all(validRequests.map(async (request) => {
        if (!request) return;

        const { error } = await supabase.functions.invoke('analyze-website', {
          body: { 
            url: request.url,
            requestId: request.requestId
          }
        });

        if (error) {
          console.error('Error analyzing website:', error);
          toast.error(`Failed to analyze ${request.url}`);
        }
      }));

    } catch (error) {
      console.error('Failed to process search results:', error);
      toast.error('Failed to analyze websites');
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    processSearchResults
  };
};
