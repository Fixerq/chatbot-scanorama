
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
      for (const result of results) {
        try {
          // First create the analysis request
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
            continue;
          }

          console.log('Created analysis request:', requestData);

          // Then invoke the analyze-website function
          const { error } = await supabase.functions.invoke('analyze-website', {
            body: { 
              url: result.url,
              requestId: requestData.id
            }
          });

          if (error) {
            console.error('Error analyzing website:', error);
            toast.error(`Failed to analyze ${result.url}`);
          }
        } catch (error) {
          console.error(`Failed to process ${result.url}:`, error);
        }
      }

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
