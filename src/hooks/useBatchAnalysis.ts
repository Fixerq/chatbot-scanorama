
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

      // Send URLs to Zapier webhook
      const zapierApiKey = '108625d5-66f3-4509-b639-fac38718350c';
      const zapierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/15658111/3aksgxl/';

      // Send each URL to Zapier
      for (const result of results) {
        const response = await fetch(zapierWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: result.url
          })
        });

        if (!response.ok) {
          console.error('Error sending to Zapier:', await response.text());
          throw new Error('Failed to send to Zapier');
        }
      }

      toast.success('Analysis requests sent successfully');
      console.log('Batch analysis initiated successfully');

    } catch (error) {
      console.error('Failed to process websites:', error);
      toast.error(`Failed to process websites: ${error.message}`);
      throw error;
    }
  }, []);

  return { analyzeBatch, progress };
};
