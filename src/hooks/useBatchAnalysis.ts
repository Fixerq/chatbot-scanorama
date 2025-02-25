
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

      // Get the Zapier webhook URL from environment variable or use a default
      const zapierWebhookUrl = import.meta.env.VITE_ZAPIER_WEBHOOK_URL;
      
      if (!zapierWebhookUrl) {
        throw new Error('Zapier webhook URL is not configured. Please set VITE_ZAPIER_WEBHOOK_URL environment variable.');
      }

      console.log('Starting to send URLs to Zapier using webhook:', zapierWebhookUrl);

      // Send each URL to Zapier with detailed logging and proper error handling
      for (const [index, result] of results.entries()) {
        console.log(`Sending URL ${index + 1}/${results.length} to Zapier:`, result.url);
        
        try {
          const response = await fetch(zapierWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'no-cors', // Add no-cors mode to handle CORS
            body: JSON.stringify({
              url: result.url,
              timestamp: new Date().toISOString(),
              batch_id: Date.now().toString()
            })
          });

          // Since we're using no-cors, we can't access response status
          // Instead, log the request was sent and update progress
          console.log(`Request sent to Zapier for URL: ${result.url}`);
          setProgress((index + 1) / results.length * 100);

          // Update Supabase with sent status
          const { error: updateError } = await supabase
            .from('simplified_analysis_results')
            .upsert({
              url: result.url,
              status: 'sent_to_zapier',
              updated_at: new Date().toISOString()
            });

          if (updateError) {
            console.error('Error updating status after Zapier send:', updateError);
          }
          
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
          
          // Don't throw here - continue processing other URLs
          toast.error(`Failed to send ${result.url} to Zapier. Will continue with remaining URLs.`);
        }
      }

      toast.success('Analysis requests sent to Zapier successfully');
      console.log('Batch analysis completed successfully');

    } catch (error) {
      console.error('Failed to process websites:', error);
      toast.error(`Failed to process websites: ${error.message}`);
      throw error;
    }
  }, []);

  return { analyzeBatch, progress };
};
