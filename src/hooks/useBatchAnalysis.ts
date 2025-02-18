
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';

export const useBatchAnalysis = () => {
  const [progress, setProgress] = useState(0);

  const analyzeBatch = useCallback(async (results: Result[]) => {
    console.log('Starting batch analysis for', results.length, 'URLs');
    
    try {
      // Create initial records for all URLs
      const { error: initError } = await supabase
        .from('simplified_analysis_results')
        .upsert(
          results.map(result => ({
            url: result.url,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        );

      if (initError) {
        console.error('Error initializing analysis:', initError);
        throw initError;
      }

      // Call the analyze-website function
      const { error } = await supabase.functions.invoke('analyze-website', {
        body: {
          urls: results.map(r => r.url),
          isBatch: true,
          retry: true
        }
      });

      if (error) {
        console.error('Error analyzing websites:', error);
        throw error;
      }

      console.log('Analysis initiated successfully');
      return { cleanup: () => {} };
    } catch (error) {
      console.error('Failed to analyze websites:', error);
      toast.error('Failed to process websites');
      throw error;
    }
  }, []);

  return { analyzeBatch, progress };
};
