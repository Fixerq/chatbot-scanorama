
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
        console.log('Setting initial processing status for:', result.url);
        const { error: dbError } = await supabase
          .from('simplified_analysis_results')
          .upsert({
            url: result.url,
            status: 'processing',
            updated_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('Error updating initial status for URL:', result.url, dbError);
          throw new Error(`Failed to update initial status: ${dbError.message}`);
        }
      }

      // Send URLs to Zapier webhook
      const zapierApiKey = '108625d5-66f3-4509-b639-fac38718350c';
      const zapierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/15658111/3aksgxl/';

      console.log('Starting to send URLs to Zapier...');

      // Send each URL to Zapier with detailed logging
      for (const [index, result] of results.entries()) {
        console.log(`Sending URL ${index + 1}/${results.length} to Zapier:`, result.url);
        
        try {
          const response = await fetch(zapierWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': zapierApiKey
            },
            body: JSON.stringify({
              url: result.url,
              timestamp: new Date().toISOString(),
              batch_id: Date.now().toString()
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Zapier API error for URL:', result.url, {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            throw new Error(`Failed to send to Zapier: ${response.statusText} - ${errorText}`);
          }

          console.log(`Successfully sent URL ${result.url} to Zapier`);
          setProgress((index + 1) / results.length * 100);
          
        } catch (error) {
          console.error('Network error sending to Zapier:', error);
          // Update Supabase with error status
          await supabase
            .from('simplified_analysis_results')
            .upsert({
              url: result.url,
              status: 'error',
              error: `Failed to send to Zapier: ${error.message}`,
              updated_at: new Date().toISOString()
            });
          throw error;
        }
      }

      toast.success('Analysis requests sent successfully');
      console.log('Batch analysis completed successfully');

    } catch (error) {
      console.error('Failed to process websites:', error);
      toast.error(`Failed to process websites: ${error.message}`);
      throw error;
    }
  }, []);

  return { analyzeBatch, progress };
};
