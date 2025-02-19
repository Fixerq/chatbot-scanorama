
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useBatchAnalysis = () => {
  const [progress, setProgress] = useState(0);

  const analyzeBatch = useCallback(async (results: Result[]) => {
    console.log('Starting batch analysis for', results.length, 'URLs');
    
    try {
      // First, update Supabase status to 'processing'
      for (const result of results) {
        const { error: dbError } = await supabase
          .from('simplified_analysis_results')
          .upsert({
            url: result.url,
            status: 'processing',
            updated_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('Error updating initial status:', dbError);
          throw new Error('Failed to update initial status');
        }
      }

      // Send URLs to analyze-website function with proper error handling
      const { error: analysisError } = await supabase.functions.invoke('analyze-website', {
        body: {
          urls: results.map(r => r.url),
          isBatch: true,
          retry: true
        }
      });

      if (analysisError) {
        console.error('Error analyzing websites:', analysisError);
        throw analysisError;
      }

      // Update Supabase with 'pending' status
      for (const result of results) {
        const { error: dbError } = await supabase
          .from('simplified_analysis_results')
          .upsert({
            url: result.url,
            status: 'pending',
            updated_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('Error updating to pending status:', dbError);
          throw new Error('Failed to update to pending status');
        }
      }

      toast.success('Analysis request sent successfully');
      console.log('Batch analysis completed successfully');

    } catch (error) {
      console.error('Failed to process websites:', error);
      toast.error(`Failed to process websites: ${error.message}`);
      throw error;
    }
  }, []);

  return { analyzeBatch, progress };
};
