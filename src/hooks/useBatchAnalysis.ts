
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useBatchAnalysis = () => {
  const [progress, setProgress] = useState(0);

  const analyzeBatch = useCallback(async (results: Result[]) => {
    console.log('Starting batch analysis for', results.length, 'URLs');
    
    try {
      // Send data to Zapier webhook
      const webhookUrl = 'https://hooks.zapier.com/hooks/catch/2694924/2wqea0g/';
      
      // Format the payload for Zapier
      const payload = results.map(result => ({
        url: result.url,
        business_name: result.title || result.details?.business_name || 'Untitled',
        search_batch_id: result.details?.search_batch_id || '',
        timestamp: new Date().toISOString()
      }));

      console.log('Sending payload to Zapier:', payload);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          mode: 'no-cors' // Change to no-cors mode
        });

        clearTimeout(timeoutId);

        // Since we're using no-cors, we won't get a response we can parse
        // Instead, we'll assume success if we get here
        console.log('Zapier webhook called successfully');

        // Update status in Supabase for each URL
        for (const result of results) {
          const { error: dbError } = await supabase
            .from('simplified_analysis_results')
            .upsert({
              url: result.url,
              status: 'pending', // Mark as pending since we can't confirm the webhook result
              updated_at: new Date().toISOString()
            });

          if (dbError) {
            console.error('Error updating analysis results:', dbError);
            throw dbError;
          }
        }

        toast.success('Analysis request sent successfully');
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        console.error('Fetch error:', fetchError);
        throw new Error(`Failed to send to Zapier: ${fetchError.message}`);
      } finally {
        clearTimeout(timeoutId);
      }

      return { cleanup: () => {} };
    } catch (error) {
      console.error('Failed to process websites:', error);
      toast.error(`Failed to process websites: ${error.message}`);
      throw error;
    }
  }, []);

  return { analyzeBatch, progress };
};
