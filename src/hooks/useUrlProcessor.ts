
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
      const requests = results.map(result => ({
        url: result.url,
        search_batch_id: result.details?.search_batch_id || null
      }));

      const { error } = await supabase.functions.invoke('analyze-website', {
        body: { urls: requests }
      });

      if (error) {
        console.error('Error analyzing websites:', error);
        toast.error('Failed to analyze some websites');
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
