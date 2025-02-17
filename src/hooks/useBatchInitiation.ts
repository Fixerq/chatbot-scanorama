
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBatchInitiation() {
  const initiateBatchAnalysis = async (validUrls: string[], batchId: string) => {
    console.log('Sending request to analyze-website function with payload:', {
      urls: validUrls,
      batchId,
      isBatch: true
    });

    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: { 
        urls: validUrls,
        batchId,
        isBatch: true
      }
    });

    if (error) {
      console.error('Error initiating batch analysis:', error);
      toast.error('Failed to start analysis');
      throw error;
    }
    
    console.log('Batch analysis initiated successfully:', data);
    return data;
  };

  return { initiateBatchAnalysis };
}

